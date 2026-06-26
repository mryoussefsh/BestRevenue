<?php

namespace Tests\Feature;

use App\Models\Publisher;
use App\Models\User;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\Setting;
use App\Mail\TicketCreatedAdminMail;
use App\Mail\TicketRepliedAdminMail;
use App\Mail\TicketRepliedPublisherMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportTicketsTest extends TestCase
{
    use RefreshDatabase;

    private User $publisherUser;
    private Publisher $publisher;
    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic settings
        Setting::updateOrCreate(['key' => 'support_email'], [
            'value' => 'support@mindorax.local',
            'group' => 'support',
            'label' => 'Support Destination',
            'type'  => 'string'
        ]);

        Setting::updateOrCreate(['key' => 'site_name'], [
            'value' => 'Mindora X',
            'group' => 'general',
            'label' => 'Site Name',
            'type'  => 'string'
        ]);

        // Create publisher
        $this->publisher = Publisher::create([
            'id'    => (string) \Illuminate\Support\Str::uuid(),
            'name'  => 'Test Publisher Network',
            'email' => 'publisher@test.com',
        ]);

        $this->publisherUser = User::create([
            'name'         => 'Publisher Admin',
            'email'        => 'publisher@test.com',
            'password'     => Hash::make('password123'),
            'role'         => 'publisher',
            'publisher_id' => $this->publisher->id,
            'is_active'    => true,
        ]);

        // Create admin
        $this->adminUser = User::create([
            'name'      => 'Platform Administrator',
            'email'     => 'admin@test.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
    }

    public function test_publisher_can_list_and_create_tickets(): void
    {
        Mail::fake();

        Sanctum::actingAs($this->publisherUser);

        // List tickets (should be empty initially)
        $response = $this->getJson('/api/v1/publisher/tickets');
        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');

        // Create ticket
        $response = $this->postJson('/api/v1/publisher/tickets', [
            'subject'  => 'GAM Sync Failing',
            'category' => 'gam',
            'priority' => 'high',
            'message'  => 'My Google Ad Manager account sync failed with OAuth expired error.',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('message', 'Ticket opened successfully.');
        
        $ticketId = $response->json('ticket.id');
        $this->assertNotNull($ticketId);

        // Assert database records exist
        $this->assertDatabaseHas('tickets', [
            'id'           => $ticketId,
            'publisher_id' => $this->publisher->id,
            'subject'      => 'GAM Sync Failing',
            'category'     => 'gam',
            'priority'     => 'high',
            'status'       => 'open',
        ]);

        $this->assertDatabaseHas('ticket_messages', [
            'ticket_id'      => $ticketId,
            'user_id'        => $this->publisherUser->id,
            'message'        => 'My Google Ad Manager account sync failed with OAuth expired error.',
            'is_admin_reply' => false,
        ]);

        // Assert email notification was sent to admin support email
        Mail::assertSent(TicketCreatedAdminMail::class, function ($mail) {
            return $mail->hasTo('support@mindorax.local');
        });

        // Assert audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'created',
            'entity_type' => 'Ticket',
            'entity_id' => $ticketId,
            'user_id' => $this->publisherUser->id,
        ]);
    }

    public function test_publisher_cannot_access_other_publisher_tickets(): void
    {
        // Create another publisher
        $otherPublisher = Publisher::create([
            'id'    => (string) \Illuminate\Support\Str::uuid(),
            'name'  => 'Other Publisher',
            'email' => 'other@test.com',
        ]);

        $ticket = Ticket::create([
            'id'           => (string) \Illuminate\Support\Str::uuid(),
            'publisher_id' => $otherPublisher->id,
            'user_id'      => $this->publisherUser->id, // dummy user ID
            'subject'      => 'Private Issue',
            'status'       => 'open',
        ]);

        Sanctum::actingAs($this->publisherUser);

        // Attempting to show ticket of other publisher
        $response = $this->getJson("/api/v1/publisher/tickets/{$ticket->id}");
        $response->assertStatus(404);

        // Attempting to reply to other publisher ticket
        $response = $this->postJson("/api/v1/publisher/tickets/{$ticket->id}/reply", [
            'message' => 'Sneaky reply',
        ]);
        $response->assertStatus(404);
    }

    public function test_publisher_replies_to_resolved_ticket_reopens_it(): void
    {
        Mail::fake();

        $ticket = Ticket::create([
            'id'           => (string) \Illuminate\Support\Str::uuid(),
            'publisher_id' => $this->publisher->id,
            'user_id'      => $this->publisherUser->id,
            'subject'      => 'Locked Payout',
            'status'       => 'resolved',
        ]);

        Sanctum::actingAs($this->publisherUser);

        // Reply to ticket
        $response = $this->postJson("/api/v1/publisher/tickets/{$ticket->id}/reply", [
            'message' => 'Please reopen, this is still not resolved.',
        ]);

        $response->assertStatus(201);
        
        // Assert ticket status re-opened
        $ticket->refresh();
        $this->assertEquals('open', $ticket->status);

        // Assert database record added
        $this->assertDatabaseHas('ticket_messages', [
            'ticket_id'      => $ticket->id,
            'message'        => 'Please reopen, this is still not resolved.',
            'is_admin_reply' => false,
        ]);

        // Assert email notification was sent to admin support email
        Mail::assertSent(TicketRepliedAdminMail::class, function ($mail) {
            return $mail->hasTo('support@mindorax.local');
        });

        // Assert audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'reply',
            'entity_type' => 'Ticket',
            'entity_id' => $ticket->id,
            'user_id' => $this->publisherUser->id,
        ]);
    }

    public function test_publisher_cannot_reply_to_closed_ticket(): void
    {
        $ticket = Ticket::create([
            'id'           => (string) \Illuminate\Support\Str::uuid(),
            'publisher_id' => $this->publisher->id,
            'user_id'      => $this->publisherUser->id,
            'subject'      => 'Finalized Issue',
            'status'       => 'closed',
        ]);

        Sanctum::actingAs($this->publisherUser);

        $response = $this->postJson("/api/v1/publisher/tickets/{$ticket->id}/reply", [
            'message' => 'Try to reopen closed ticket.',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'This ticket is closed and cannot be reopened. Please open a new ticket.');
    }

    public function test_publisher_cannot_open_multiple_active_tickets(): void
    {
        Sanctum::actingAs($this->publisherUser);

        // Open first ticket (success)
        $response = $this->postJson('/api/v1/publisher/tickets', [
            'subject'  => 'First Ticket',
            'category' => 'other',
            'priority' => 'low',
            'message'  => 'First ticket message',
        ]);
        $response->assertStatus(201);

        // Try to open second ticket (error)
        $response = $this->postJson('/api/v1/publisher/tickets', [
            'subject'  => 'Second Ticket',
            'category' => 'other',
            'priority' => 'low',
            'message'  => 'Second ticket message',
        ]);
        $response->assertStatus(422);
        $response->assertJsonPath('message', 'You already have an active support ticket. Please resolve or close it before opening a new one.');
    }

    public function test_admin_can_manage_tickets_and_send_replies(): void
    {
        Mail::fake();

        // Create ticket by publisher
        $ticket = Ticket::create([
            'id'           => (string) \Illuminate\Support\Str::uuid(),
            'publisher_id' => $this->publisher->id,
            'user_id'      => $this->publisherUser->id,
            'subject'      => 'Billing Inquiry',
            'category'     => 'billing',
            'priority'     => 'medium',
            'status'       => 'open',
        ]);

        Sanctum::actingAs($this->adminUser);

        // List all tickets
        $response = $this->getJson('/api/v1/admin/tickets');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');

        // Assign and escalate ticket
        $response = $this->putJson("/api/v1/admin/tickets/{$ticket->id}", [
            'assigned_to' => $this->adminUser->id,
            'priority'    => 'urgent',
            'status'      => 'in_progress',
        ]);
        $response->assertStatus(200);

        $ticket->refresh();
        $this->assertEquals($this->adminUser->id, $ticket->assigned_to);
        $this->assertEquals('urgent', $ticket->priority);
        $this->assertEquals('in_progress', $ticket->status);

        // Post admin reply message
        $response = $this->postJson("/api/v1/admin/tickets/{$ticket->id}/reply", [
            'message' => 'We have updated your IBAN payment details. Please check.',
        ]);
        $response->assertStatus(201);

        $this->assertDatabaseHas('ticket_messages', [
            'ticket_id'      => $ticket->id,
            'user_id'        => $this->adminUser->id,
            'message'        => 'We have updated your IBAN payment details. Please check.',
            'is_admin_reply' => true,
        ]);

        // Assert email notification was sent to publisher user's email
        Mail::assertSent(TicketRepliedPublisherMail::class, function ($mail) {
            return $mail->hasTo('publisher@test.com');
        });
    }

    public function test_unread_replies_badge_count_logic(): void
    {
        Mail::fake();

        Sanctum::actingAs($this->publisherUser);

        // 1. Initially count is 0
        $response = $this->getJson('/api/v1/publisher/tickets');
        $response->assertStatus(200);
        $response->assertJsonPath('unread_replies_count', 0);

        // 2. Create ticket. Count should still be 0 since no admin replied.
        $ticket = Ticket::create([
            'id'           => (string) \Illuminate\Support\Str::uuid(),
            'publisher_id' => $this->publisher->id,
            'user_id'      => $this->publisherUser->id,
            'subject'      => 'Test Badge Count',
            'category'     => 'other',
            'priority'     => 'low',
            'status'       => 'open',
            'last_viewed_by_publisher_at' => now(),
        ]);

        $ticket->messages()->create([
            'user_id'        => $this->publisherUser->id,
            'message'        => 'Initial publisher message',
            'is_admin_reply' => false,
        ]);

        $response = $this->getJson('/api/v1/publisher/tickets');
        $response->assertStatus(200);
        $response->assertJsonPath('unread_replies_count', 0);

        // 3. Admin replies. Count should become 1.
        // Sleep 1 second to ensure created_at is strictly greater than last_viewed_by_publisher_at
        sleep(1);
        
        $ticket->messages()->create([
            'user_id'        => $this->adminUser->id,
            'message'        => 'Admin reply here',
            'is_admin_reply' => true,
        ]);

        $response = $this->getJson('/api/v1/publisher/tickets');
        $response->assertStatus(200);
        $response->assertJsonPath('unread_replies_count', 1);

        // 4. Publisher views ticket. Count should reset to 0.
        $response = $this->getJson("/api/v1/publisher/tickets/{$ticket->id}");
        $response->assertStatus(200);

        $response = $this->getJson('/api/v1/publisher/tickets');
        $response->assertStatus(200);
        $response->assertJsonPath('unread_replies_count', 0);

        // 5. Admin replies again. Count should become 1.
        sleep(1);
        $ticket->messages()->create([
            'user_id'        => $this->adminUser->id,
            'message'        => 'Admin reply 2',
            'is_admin_reply' => true,
        ]);

        $response = $this->getJson('/api/v1/publisher/tickets');
        $response->assertStatus(200);
        $response->assertJsonPath('unread_replies_count', 1);

        // 6. Publisher replies back. Count should reset to 0.
        sleep(1);
        $response = $this->postJson("/api/v1/publisher/tickets/{$ticket->id}/reply", [
            'message' => 'Publisher follow up reply',
        ]);
        $response->assertStatus(201);

        $response = $this->getJson('/api/v1/publisher/tickets');
        $response->assertStatus(200);
        $response->assertJsonPath('unread_replies_count', 0);
    }

    public function test_admin_pending_tickets_badge_count_logic(): void
    {
        Mail::fake();

        Sanctum::actingAs($this->adminUser);

        // 1. Initially sidebar stats pending_tickets is 0
        $response = $this->getJson('/api/v1/admin/sidebar-stats');
        $response->assertStatus(200);
        $response->assertJsonPath('pending_tickets', 0);

        // 2. Publisher creates a ticket. pending_tickets should become 1.
        $ticket = Ticket::create([
            'id'           => (string) \Illuminate\Support\Str::uuid(),
            'publisher_id' => $this->publisher->id,
            'user_id'      => $this->publisherUser->id,
            'subject'      => 'Admin Badge Count Test',
            'category'     => 'other',
            'priority'     => 'low',
            'status'       => 'open',
            'last_viewed_by_publisher_at' => now(),
        ]);

        $ticket->messages()->create([
            'user_id'        => $this->publisherUser->id,
            'message'        => 'Publisher creates a ticket',
            'is_admin_reply' => false,
        ]);

        $response = $this->getJson('/api/v1/admin/sidebar-stats');
        $response->assertStatus(200);
        $response->assertJsonPath('pending_tickets', 1);

        // 3. Admin views the ticket. pending_tickets should reset to 0.
        $response = $this->getJson("/api/v1/admin/tickets/{$ticket->id}");
        $response->assertStatus(200);

        $response = $this->getJson('/api/v1/admin/sidebar-stats');
        $response->assertStatus(200);
        $response->assertJsonPath('pending_tickets', 0);

        // 4. Admin replies to the ticket. pending_tickets should remain 0.
        sleep(1);
        $response = $this->postJson("/api/v1/admin/tickets/{$ticket->id}/reply", [
            'message' => 'Admin reply',
        ]);
        $response->assertStatus(201);

        $response = $this->getJson('/api/v1/admin/sidebar-stats');
        $response->assertStatus(200);
        $response->assertJsonPath('pending_tickets', 0);

        // 5. Publisher replies back. pending_tickets should become 1.
        Sanctum::actingAs($this->publisherUser);
        sleep(1);
        $response = $this->postJson("/api/v1/publisher/tickets/{$ticket->id}/reply", [
            'message' => 'Publisher reply',
        ]);
        $response->assertStatus(201);

        Sanctum::actingAs($this->adminUser);
        $response = $this->getJson('/api/v1/admin/sidebar-stats');
        $response->assertStatus(200);
        $response->assertJsonPath('pending_tickets', 1);
    }

    public function test_publisher_can_close_ticket(): void
    {
        $ticket = Ticket::create([
            'id'           => (string) \Illuminate\Support\Str::uuid(),
            'publisher_id' => $this->publisher->id,
            'user_id'      => $this->publisherUser->id,
            'subject'      => 'Close Me Test',
            'status'       => 'open',
        ]);

        Sanctum::actingAs($this->publisherUser);

        $response = $this->postJson("/api/v1/publisher/tickets/{$ticket->id}/close");

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Ticket closed successfully.');

        $ticket->refresh();
        $this->assertEquals('closed', $ticket->status);

        // Assert audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'closed',
            'entity_type' => 'Ticket',
            'entity_id' => $ticket->id,
            'user_id' => $this->publisherUser->id,
        ]);
    }
}
