<?php

namespace Tests\Feature;

use App\Models\EmailTemplate;
use App\Models\Publisher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class EmailSystemTest extends TestCase
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
     * Test forgot password triggers email and stores hash.
     */
    public function test_forgot_password_sends_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'pub@test.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);

        // Assert token is in DB
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'pub@test.com',
        ]);

        Mail::assertSent(\App\Mail\PasswordResetMail::class, function ($mail) {
            return $mail->hasTo('pub@test.com');
        });
    }

    /**
     * Test password reset with valid token.
     */
    public function test_password_reset_with_valid_token(): void
    {
        $rawToken = 'sample-secret-token-123';
        DB::table('password_reset_tokens')->insert([
            'email'      => 'pub@test.com',
            'token'      => Hash::make($rawToken),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email'                 => 'pub@test.com',
            'token'                 => $rawToken,
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'Password updated successfully. You can now log in.',
        ]);

        // Assert password changed in DB
        $this->publisherUser->refresh();
        $this->assertTrue(Hash::check('newpassword123', $this->publisherUser->password));

        // Assert token was deleted
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'pub@test.com',
        ]);
    }

    /**
     * Test password reset fails with invalid token.
     */
    public function test_password_reset_fails_with_invalid_token(): void
    {
        DB::table('password_reset_tokens')->insert([
            'email'      => 'pub@test.com',
            'token'      => Hash::make('correct-token'),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email'                 => 'pub@test.com',
            'token'                 => 'wrong-token',
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Invalid or expired reset link.',
        ]);
    }

    /**
     * Test email templates admin endpoints.
     */
    public function test_email_templates_crud_for_admin(): void
    {
        $this->actingAs($this->admin);

        // 1. Get list
        $response = $this->getJson('/api/v1/admin/email-templates');
        $response->assertStatus(200);
        $response->assertJsonCount(count(EmailTemplate::allKeys()));

        // 2. Update a template
        $response = $this->putJson('/api/v1/admin/email-templates/welcome', [
            'subject' => 'New Subject',
            'body'    => '<p>New Body {{ name }}</p>',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('email_templates', [
            'key'     => 'welcome',
            'subject' => 'New Subject',
        ]);

        // 3. Send preview
        $response = $this->postJson('/api/v1/admin/email-templates/welcome/preview');
        $response->assertStatus(200);

        // 4. Reset to default
        $response = $this->postJson('/api/v1/admin/email-templates/welcome/reset');
        $response->assertStatus(200);
        $this->assertDatabaseMissing('email_templates', [
            'key' => 'welcome',
        ]);
    }
}
