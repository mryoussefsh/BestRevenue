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

    public function test_homepage_stats_override_functionality(): void
    {
        Setting::create([
            'key'   => 'homepage_stats_override',
            'value' => 'false',
            'group' => 'homepage_stats',
            'label' => 'Override Homepage Statistics',
            'type'  => 'boolean',
        ]);
        Setting::create([
            'key'   => 'homepage_stats_publishers',
            'value' => '1000',
            'group' => 'homepage_stats',
            'label' => 'Homepage Stats: Active Global Publishers',
            'type'  => 'integer',
        ]);
        Setting::create([
            'key'   => 'homepage_stats_impressions',
            'value' => '9999999',
            'group' => 'homepage_stats',
            'label' => 'Homepage Stats: Ad Impressions Served',
            'type'  => 'integer',
        ]);
        Setting::create([
            'key'   => 'homepage_stats_total_paid',
            'value' => '88888',
            'group' => 'homepage_stats',
            'label' => 'Homepage Stats: Total Paid to Publishers',
            'type'  => 'integer',
        ]);
        Setting::create([
            'key'   => 'homepage_stats_websites',
            'value' => '77',
            'group' => 'homepage_stats',
            'label' => 'Homepage Stats: Approved Domains',
            'type'  => 'integer',
        ]);

        // Seed real data to verify addition behavior
        $publisher = \App\Models\Publisher::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Test Publisher',
            'email'         => 'pub@test.com',
            'status'        => 'active',
            'default_ratio' => 0.80,
        ]);

        $website = \App\Models\Website::create([
            'id'               => Str::uuid()->toString(),
            'publisher_id'     => $publisher->id,
            'domain'           => 'site-test.com',
            'gam_network_code' => '1234',
            'is_active'        => true,
        ]);

        $adUnit = \App\Models\AdUnit::create([
            'id'               => Str::uuid()->toString(),
            'website_id'       => $website->id,
            'gam_ad_unit_name' => 'banner_test',
            'display_name'     => 'Banner',
            'is_active'        => true,
        ]);

        \App\Models\RevenueRecord::create([
            'id'                  => Str::uuid()->toString(),
            'ad_unit_id'          => $adUnit->id,
            'date'                => '2026-06-15',
            'hour'                => '00',
            'impressions'         => 1000,
            'gross_revenue'       => 100.0,
            'publisher_earnings'  => 80.0,
        ]);

        \App\Models\Payout::create([
            'id'                => Str::uuid()->toString(),
            'publisher_id'      => $publisher->id,
            'period_year'       => 2026,
            'period_month'      => 5,
            'amount'            => 80.00,
            'adjustment'        => 0,
            'final_amount'      => 80.00,
            'status'            => 'paid',
            'payment_method'    => 'Wise',
        ]);

        // 1. Fetch public settings when override is disabled (should only show real database numbers)
        $response = $this->getJson('/api/v1/public/settings');
        $response->assertStatus(200);
        $json = $response->json();
        
        // Assert we get standard database stats
        $this->assertEquals(1, $json['stats_publishers']);
        $this->assertEquals(1, $json['stats_websites']);
        $this->assertEquals(80.0, $json['stats_total_paid']);
        $this->assertEquals(1000, $json['stats_impressions']);

        // 2. Enable override
        Sanctum::actingAs($this->admin);
        $this->putJson('/api/v1/admin/settings/homepage_stats_override', [
            'value' => 'true'
        ])->assertStatus(200);

        // 3. Fetch public settings when override is enabled (should show real + overridden stats)
        $response2 = $this->getJson('/api/v1/public/settings');
        $response2->assertStatus(200);
        $json2 = $response2->json();

        // Assert overridden stats are returned (real + configured settings)
        $this->assertEquals(1 + 1000, $json2['stats_publishers']);
        $this->assertEquals(1 + 77, $json2['stats_websites']);
        $this->assertEquals(80.0 + 88888.0, $json2['stats_total_paid']);
        $this->assertEquals(1000 + 9999999, $json2['stats_impressions']);
    }
}
