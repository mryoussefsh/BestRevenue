<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $publisherUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create admin user
        $this->admin = User::create([
            'id'        => Str::uuid()->toString(),
            'name'      => 'Admin User',
            'email'     => 'admin@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'admin',
            'is_active' => true,
        ]);

        // 2. Create publisher user
        $this->publisherUser = User::create([
            'id'        => Str::uuid()->toString(),
            'name'      => 'Publisher User',
            'email'     => 'pub@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'publisher',
            'is_active' => true,
        ]);

        // Seed some setting entries that should exist
        Setting::create([
            'key'   => 'google_client_id',
            'value' => 'old-client-id',
            'group' => 'gam',
            'label' => 'Google OAuth Client ID',
            'type'  => 'string',
        ]);

        Setting::create([
            'key'   => 'google_client_secret',
            'value' => 'old-client-secret',
            'group' => 'gam',
            'label' => 'Google OAuth Client Secret',
            'type'  => 'string',
        ]);
    }

    public function test_admin_can_update_google_api_credentials(): void
    {
        Sanctum::actingAs($this->admin);

        $response1 = $this->putJson('/api/v1/admin/settings/google_client_id', [
            'value' => 'new-client-id-12345'
        ]);

        $response1->assertStatus(200)
            ->assertJsonPath('key', 'google_client_id')
            ->assertJsonPath('value', 'new-client-id-12345');

        $response2 = $this->putJson('/api/v1/admin/settings/google_client_secret', [
            'value' => 'new-client-secret-abcde'
        ]);

        $response2->assertStatus(200)
            ->assertJsonPath('key', 'google_client_secret')
            ->assertJsonPath('value', 'new-client-secret-abcde');

        $this->assertDatabaseHas('settings', [
            'key'   => 'google_client_id',
            'value' => 'new-client-id-12345'
        ]);

        $this->assertDatabaseHas('settings', [
            'key'   => 'google_client_secret',
            'value' => 'new-client-secret-abcde'
        ]);
    }

    public function test_publisher_cannot_update_settings(): void
    {
        Sanctum::actingAs($this->publisherUser);

        $response = $this->putJson('/api/v1/admin/settings/google_client_id', [
            'value' => 'hacky-id'
        ]);

        $response->assertStatus(403);
    }

    public function test_update_fails_if_value_missing(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/v1/admin/settings/google_client_id', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['value']);
    }

    public function test_update_non_existent_setting_returns_404(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/v1/admin/settings/non_existent_key_123', [
            'value' => 'some-value'
        ]);

        $response->assertStatus(404);
    }
}
