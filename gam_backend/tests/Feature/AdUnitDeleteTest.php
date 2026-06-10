<?php

namespace Tests\Feature;

use App\Models\AdUnit;
use App\Models\GamAccount;
use App\Models\Publisher;
use App\Models\User;
use App\Models\Website;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdUnitDeleteTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $publisher;
    protected $gamAccount;
    protected $website;

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

        // Create GAM account
        $this->gamAccount = GamAccount::create([
            'id'           => Str::uuid()->toString(),
            'name'         => 'Test GAM Account',
            'email'        => 'gam-test@test.com',
            'network_code' => '12345678',
        ]);

        // Create Website
        $this->website = Website::create([
            'id'               => Str::uuid()->toString(),
            'publisher_id'     => $this->publisher->id,
            'gam_account_id'   => $this->gamAccount->id,
            'domain'           => 'testdomain.com',
            'gam_network_code' => '12345678',
            'is_active'        => true,
        ]);
    }

    /**
     * Test that deleting an ad unit defaults to archiving in GAM.
     */
    public function test_delete_ad_unit_defaults_to_archiving_in_gam(): void
    {
        $this->actingAs($this->admin);

        $adUnit = AdUnit::create([
            'id'                => Str::uuid()->toString(),
            'website_id'        => $this->website->id,
            'display_name'      => 'Test Ad Unit',
            'gam_ad_unit_name'  => 'test_ad_unit',
            'gam_ad_unit_id'    => 'gam_id_123',
            'is_active'         => true,
        ]);

        // Mock GamApiService to verify archiving is called
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldReceive('archiveAdUnits')
            ->once()
            ->with(\Mockery::on(function ($account) {
                return $account->id === $this->gamAccount->id;
            }), ['gam_id_123'])
            ->andReturn(true);

        $response = $this->deleteJson("/api/v1/admin/ad-units/{$adUnit->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ad_units', ['id' => $adUnit->id]);
    }

    /**
     * Test that deleting an ad unit with archive=false skips archiving in GAM.
     */
    public function test_delete_ad_unit_with_archive_false_skips_archiving_in_gam(): void
    {
        $this->actingAs($this->admin);

        $adUnit = AdUnit::create([
            'id'                => Str::uuid()->toString(),
            'website_id'        => $this->website->id,
            'display_name'      => 'Test Ad Unit 2',
            'gam_ad_unit_name'  => 'test_ad_unit_2',
            'gam_ad_unit_id'    => 'gam_id_456',
            'is_active'         => true,
        ]);

        // Mock GamApiService to verify archiving is NOT called
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldNotReceive('archiveAdUnits');

        $response = $this->deleteJson("/api/v1/admin/ad-units/{$adUnit->id}?archive=false");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ad_units', ['id' => $adUnit->id]);
    }

    /**
     * Test that bulk deleting ad units defaults to archiving them in GAM.
     */
    public function test_bulk_delete_ad_units_defaults_to_archiving_in_gam(): void
    {
        $this->actingAs($this->admin);

        $adUnit1 = AdUnit::create([
            'id'                => Str::uuid()->toString(),
            'website_id'        => $this->website->id,
            'display_name'      => 'Bulk 1',
            'gam_ad_unit_name'  => 'bulk_1',
            'gam_ad_unit_id'    => 'gam_bulk_1',
            'is_active'         => true,
        ]);

        $adUnit2 = AdUnit::create([
            'id'                => Str::uuid()->toString(),
            'website_id'        => $this->website->id,
            'display_name'      => 'Bulk 2',
            'gam_ad_unit_name'  => 'bulk_2',
            'gam_ad_unit_id'    => 'gam_bulk_2',
            'is_active'         => true,
        ]);

        // Mock GamApiService to verify bulk archiving is called
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldReceive('archiveAdUnits')
            ->once()
            ->with(\Mockery::on(function ($account) {
                return $account->id === $this->gamAccount->id;
            }), ['gam_bulk_1', 'gam_bulk_2'])
            ->andReturn(true);

        $response = $this->postJson("/api/v1/admin/ad-units/bulk-delete", [
            'ids' => [$adUnit1->id, $adUnit2->id]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ad_units', ['id' => $adUnit1->id]);
        $this->assertDatabaseMissing('ad_units', ['id' => $adUnit2->id]);
    }

    /**
     * Test that bulk deleting ad units with archive=false skips archiving them in GAM.
     */
    public function test_bulk_delete_ad_units_with_archive_false_skips_archiving(): void
    {
        $this->actingAs($this->admin);

        $adUnit1 = AdUnit::create([
            'id'                => Str::uuid()->toString(),
            'website_id'        => $this->website->id,
            'display_name'      => 'Bulk 3',
            'gam_ad_unit_name'  => 'bulk_3',
            'gam_ad_unit_id'    => 'gam_bulk_3',
            'is_active'         => true,
        ]);

        $adUnit2 = AdUnit::create([
            'id'                => Str::uuid()->toString(),
            'website_id'        => $this->website->id,
            'display_name'      => 'Bulk 4',
            'gam_ad_unit_name'  => 'bulk_4',
            'gam_ad_unit_id'    => 'gam_bulk_4',
            'is_active'         => true,
        ]);

        // Mock GamApiService to verify bulk archiving is NOT called
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldNotReceive('archiveAdUnits');

        $response = $this->postJson("/api/v1/admin/ad-units/bulk-delete", [
            'ids' => [$adUnit1->id, $adUnit2->id],
            'archive' => false
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ad_units', ['id' => $adUnit1->id]);
        $this->assertDatabaseMissing('ad_units', ['id' => $adUnit2->id]);
    }
}
