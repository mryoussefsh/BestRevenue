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

    public function test_updating_close_period_day_triggers_auto_close_command(): void
    {
        \Illuminate\Support\Facades\Artisan::shouldReceive('queue')
            ->with('period:auto-close')
            ->once()
            ->andReturn(0);

        Setting::create([
            'key'   => 'close_period_day',
            'value' => '15',
            'group' => 'payout',
            'label' => 'Close Period Day',
            'type'  => 'integer',
        ]);

        Setting::create([
            'key'   => 'payout_auto_enabled',
            'value' => 'true',
            'group' => 'payout',
            'label' => 'Payout Auto Enabled',
            'type'  => 'boolean',
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/v1/admin/settings/close_period_day', [
            'value' => 20
        ]);

        $response->assertStatus(200);
    }

    public function test_updating_close_period_day_does_not_trigger_auto_close_if_disabled(): void
    {
        // We expect Artisan::queue('period:auto-close') NOT to be called.
        // If it is called, Mockery will throw an exception.
        \Illuminate\Support\Facades\Artisan::shouldReceive('queue')
            ->with('period:auto-close')
            ->never();

        Setting::create([
            'key'   => 'close_period_day',
            'value' => '15',
            'group' => 'payout',
            'label' => 'Close Period Day',
            'type'  => 'integer',
        ]);

        Setting::create([
            'key'   => 'payout_auto_enabled',
            'value' => 'false',
            'group' => 'payout',
            'label' => 'Payout Auto Enabled',
            'type'  => 'boolean',
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/v1/admin/settings/close_period_day', [
            'value' => 20
        ]);

        $response->assertStatus(200);
    }

    public function test_admin_can_update_ad_type_preselected_sizes_setting(): void
    {
        Sanctum::actingAs($this->admin);

        $newValue = [
            'banner' => ['300x250', '300x600'],
            'reward' => ['1x1'],
        ];

        $response = $this->putJson('/api/v1/admin/settings/ad_type_preselected_sizes', [
            'value' => $newValue
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('key', 'ad_type_preselected_sizes')
            ->assertJsonPath('value', json_encode($newValue));

        $this->assertDatabaseHas('settings', [
            'key'   => 'ad_type_preselected_sizes',
            'value' => json_encode($newValue)
        ]);
    }

    public function test_updating_ad_type_preselected_sizes_fails_validation_for_non_array(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/v1/admin/settings/ad_type_preselected_sizes', [
            'value' => 'not-an-array-string'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['value']);
    }

    public function test_public_settings_endpoint_returns_preselected_sizes(): void
    {
        $response = $this->getJson('/api/v1/public/settings');

        $response->assertStatus(200)
            ->assertJsonStructure(['ad_type_preselected_sizes']);
    }

    public function test_ad_ops_manager_can_retrieve_google_settings_only(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $adOps = User::create([
            'id'        => Str::uuid()->toString(),
            'name'      => 'Ad Ops User',
            'email'     => 'adops@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $adOps->assignRole('Ad Ops Manager');

        Sanctum::actingAs($adOps);

        $response = $this->getJson('/api/v1/admin/settings');
        
        $response->assertStatus(200);
        
        $json = $response->json();
        
        // Assert google_client_id and google_client_secret are present
        $keys = collect($json)->pluck('key')->toArray();
        $this->assertContains('google_client_id', $keys);
        $this->assertContains('google_client_secret', $keys);
        
        // Assert payout_threshold (which belongs to payout group) is not present
        $this->assertNotContains('payout_threshold', $keys);
        $this->assertNotContains('project_path', $keys);
    }

    public function test_ad_ops_manager_can_update_google_credentials(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $adOps = User::create([
            'id'        => Str::uuid()->toString(),
            'name'      => 'Ad Ops User',
            'email'     => 'adops@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $adOps->assignRole('Ad Ops Manager');

        Sanctum::actingAs($adOps);

        $response = $this->putJson('/api/v1/admin/settings/google_client_id', [
            'value' => 'new-adops-client-id'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'key' => 'google_client_id',
            'value' => 'new-adops-client-id'
        ]);
    }

    public function test_ad_ops_manager_cannot_update_non_google_settings(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $adOps = User::create([
            'id'        => Str::uuid()->toString(),
            'name'      => 'Ad Ops User',
            'email'     => 'adops@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $adOps->assignRole('Ad Ops Manager');

        Setting::create([
            'key'   => 'payout_threshold',
            'value' => '50.00',
            'group' => 'payout',
            'label' => 'Minimum Payout Threshold (USD)',
            'type'  => 'string',
        ]);

        Sanctum::actingAs($adOps);

        $response = $this->putJson('/api/v1/admin/settings/payout_threshold', [
            'value' => '100.00'
        ]);

        $response->assertStatus(403);
    }
}
