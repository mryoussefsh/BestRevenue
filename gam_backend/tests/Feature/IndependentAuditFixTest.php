<?php

namespace Tests\Feature;

use App\Models\Adjustment;
use App\Models\GamAccount;
use App\Models\PeriodClosing;
use App\Models\Publisher;
use App\Models\RevenueRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class IndependentAuditFixTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $publisher;
    protected $publisherUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Admin
        $this->admin = User::create([
            'id'        => Str::uuid()->toString(),
            'name'      => 'Admin User',
            'email'     => 'admin@test.com',
            'password'  => Hash::make('password'),
            'role'      => 'admin',
            'is_active' => true,
        ]);

        // Create Publisher
        $this->publisher = Publisher::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Pub User',
            'email'         => 'pub@test.com',
            'default_ratio' => 0.70,
            'status'        => 'active',
        ]);

        $this->publisherUser = User::create([
            'id'           => Str::uuid()->toString(),
            'name'         => 'Pub User',
            'email'        => 'pub@test.com',
            'password'     => Hash::make('oldpassword'),
            'role'         => 'publisher',
            'publisher_id' => $this->publisher->id,
            'is_active'    => true,
        ]);
    }

    /**
     * Test expired password reset token is correctly rejected.
     */
    public function test_expired_password_reset_token_fails(): void
    {
        $rawToken = 'sample-secret-token-123';
        DB::table('password_reset_tokens')->insert([
            'email'      => 'pub@test.com',
            'token'      => Hash::make($rawToken),
            // Created 70 minutes ago
            'created_at' => now()->subMinutes(70),
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email'                 => 'pub@test.com',
            'token'                 => $rawToken,
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'This reset link has expired. Please request a new one.',
        ]);
    }

    /**
     * Test publisher deletion is blocked if payouts, adjustments, or revenue records exist.
     */
    public function test_publisher_deletion_blocked_with_financial_history(): void
    {
        $this->actingAs($this->admin);

        // 1. Blocked if Payout exists
        $period = PeriodClosing::create([
            'id'          => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month'=> 5,
            'status'      => 'closed',
        ]);

        $payout = \App\Models\Payout::create([
            'id'                => Str::uuid()->toString(),
            'publisher_id'      => $this->publisher->id,
            'period_closing_id' => $period->id,
            'period_year'       => 2026,
            'period_month'      => 5,
            'amount'            => 100,
            'status'            => 'paid',
        ]);

        $response = $this->deleteJson("/api/v1/admin/publishers/{$this->publisher->id}");
        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Cannot delete publisher: historical financial records exist (payouts, adjustments, or synced revenue records). Please suspend the publisher instead to deactivate their account.',
        ]);

        // Clean up payout & period
        $payout->delete();
        $period->delete();

        // 2. Blocked if Adjustment exists
        $adjustment = Adjustment::create([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $this->publisher->id,
            'amount'       => 50,
            'notes'        => 'Test Adjustment',
            'status'       => 'pending',
            'created_by'   => $this->admin->id,
        ]);

        $response = $this->deleteJson("/api/v1/admin/publishers/{$this->publisher->id}");
        $response->assertStatus(422);

        $adjustment->delete();

        // 3. Allowed to delete if zero financial history
        $response = $this->deleteJson("/api/v1/admin/publishers/{$this->publisher->id}");
        $response->assertStatus(200);
    }

    /**
     * Test OAuth state validation user_id comparison.
     */
    public function test_oauth_state_mismatched_user_id_rejected(): void
    {
        $nonce = Str::random(40);
        
        // Cached state points to Admin User (id = this->admin->id)
        $statePayload = [
            'user_id' => $this->admin->id,
            'nonce'   => $nonce,
        ];
        Cache::put("oauth_state_{$nonce}", $statePayload, 900);

        // Spoofed state payload contains a different user_id
        $spoofedPayload = [
            'user_id' => 'different-user-uuid',
            'nonce'   => $nonce,
        ];
        $spoofedStateToken = base64_encode(json_encode($spoofedPayload));

        $response = $this->get("/api/v1/gam-accounts/oauth/callback?state={$spoofedStateToken}&code=auth-code");
        
        // Redirects with error message
        $response->assertRedirect();
        $this->assertTrue(str_contains($response->headers->get('Location'), 'OAuth+state+user+mismatch'));
    }

    /**
     * Test synchronization of publishers.pending_balance_adjustment.
     */
    public function test_pending_balance_adjustment_sync(): void
    {
        $this->actingAs($this->admin);

        // 1. Initial should be 0.00
        $this->publisher->refresh();
        $this->assertEquals(0.00, (float)$this->publisher->pending_balance_adjustment);

        // 2. Creating adjustment increases pending_balance_adjustment
        $adj1 = Adjustment::create([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $this->publisher->id,
            'amount'       => 100.50,
            'notes'        => 'Adj 1',
            'status'       => 'pending',
            'created_by'   => $this->admin->id,
        ]);

        $this->publisher->refresh();
        $this->assertEquals(100.50, (float)$this->publisher->pending_balance_adjustment);

        // 3. Creating second adjustment accumulates
        $adj2 = Adjustment::create([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $this->publisher->id,
            'amount'       => -25.20,
            'notes'        => 'Adj 2',
            'status'       => 'pending',
            'created_by'   => $this->admin->id,
        ]);

        $this->publisher->refresh();
        $this->assertEquals(75.30, (float)$this->publisher->pending_balance_adjustment);

        // 4. Deleting adjustment decreases sum
        $adj2->delete();
        $this->publisher->refresh();
        $this->assertEquals(100.50, (float)$this->publisher->pending_balance_adjustment);
    }

    /**
     * Test that impersonate payload includes payment_info attribute.
     */
    public function test_impersonate_payload_includes_payment_info(): void
    {
        // Set payment info on publisher
        $this->publisher->update([
            'payment_info' => [
                'method'  => 'PayPal',
                'account' => 'paypal@test.com',
            ],
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$this->publisher->id}/impersonate");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'access_token',
            'token_type',
            'user' => [
                'id',
                'name',
                'email',
                'role',
                'publisher_id',
                'pending_balance',
                'payment_info' => [
                    'method',
                    'account',
                ],
            ],
        ]);

        $this->assertEquals('PayPal', $response->json('user.payment_info.method'));
        $this->assertEquals('paypal@test.com', $response->json('user.payment_info.account'));
    }
}
