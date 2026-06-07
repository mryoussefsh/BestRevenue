<?php

namespace Tests\Feature;

use App\Models\AdUnit;
use App\Models\Adjustment;
use App\Models\AuditLog;
use App\Models\GamAccount;
use App\Models\Publisher;
use App\Models\RevenueRecord;
use App\Models\User;
use App\Models\Website;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdjustmentIvtTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected GamAccount $gamAccount;
    protected Publisher $publisher;
    protected Website $website1;
    protected Website $website2;
    protected Website $otherAccountWebsite;
    protected AdUnit $adUnit1;
    protected AdUnit $adUnit2;

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

        // 2. Create GAM Account
        $this->gamAccount = GamAccount::create([
            'id'           => Str::uuid()->toString(),
            'name'         => 'Test GAM Account',
            'email'        => 'gam@test.com',
            'network_code' => '99999',
            'status'       => 'active',
        ]);

        // 3. Create Publisher
        $this->publisher = Publisher::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Test Publisher',
            'email'         => 'pub@test.com',
            'status'        => 'active',
            'default_ratio' => 0.80,
        ]);

        // 4. Create Websites
        $this->website1 = Website::create([
            'id'             => Str::uuid()->toString(),
            'publisher_id'   => $this->publisher->id,
            'gam_account_id' => $this->gamAccount->id,
            'domain'         => 'site1.com',
            'is_active'      => true,
        ]);

        $this->website2 = Website::create([
            'id'             => Str::uuid()->toString(),
            'publisher_id'   => $this->publisher->id,
            'gam_account_id' => $this->gamAccount->id,
            'domain'         => 'site2.com',
            'is_active'      => true,
        ]);

        // Website belonging to another GAM account (or no GAM account)
        $otherGamAccount = GamAccount::create([
            'id'           => Str::uuid()->toString(),
            'name'         => 'Other GAM Account',
            'email'        => 'othergam@test.com',
            'network_code' => '88888',
            'status'       => 'active',
        ]);

        $this->otherAccountWebsite = Website::create([
            'id'             => Str::uuid()->toString(),
            'publisher_id'   => $this->publisher->id,
            'gam_account_id' => $otherGamAccount->id,
            'domain'         => 'other.com',
            'is_active'      => true,
        ]);

        // 5. Create Ad Units
        $this->adUnit1 = AdUnit::create([
            'id'               => Str::uuid()->toString(),
            'website_id'       => $this->website1->id,
            'gam_ad_unit_name' => 'site1_banner',
            'display_name'     => 'Banner 1',
            'is_active'        => true,
        ]);

        $this->adUnit2 = AdUnit::create([
            'id'               => Str::uuid()->toString(),
            'website_id'       => $this->website2->id,
            'gam_ad_unit_name' => 'site2_banner',
            'display_name'     => 'Banner 2',
            'is_active'        => true,
        ]);

        // Authenticate as Admin
        Sanctum::actingAs($this->admin);
    }

    public function test_apply_ivt_validates_input(): void
    {
        $response = $this->postJson('/api/v1/admin/adjustments/apply-ivt', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gam_account_id', 'website_ids', 'date_from', 'date_to', 'ivt_percent']);
    }

    public function test_apply_ivt_ensures_websites_belong_to_gam_account(): void
    {
        $response = $this->postJson('/api/v1/admin/adjustments/apply-ivt', [
            'gam_account_id' => $this->gamAccount->id,
            'website_ids'    => [$this->website1->id, $this->otherAccountWebsite->id],
            'date_from'      => '2026-05-01',
            'date_to'        => '2026-05-31',
            'ivt_percent'    => 5.0,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Some selected websites do not belong to the selected GAM Account.');
    }

    public function test_apply_ivt_calculates_and_creates_adjustments(): void
    {
        // 1. Create revenue records for site1.com
        // Earnings within date range
        RevenueRecord::create([
            'id'                 => Str::uuid()->toString(),
            'ad_unit_id'         => $this->adUnit1->id,
            'date'               => '2026-05-10',
            'hour'               => '00',
            'publisher_earnings' => 100.00,
        ]);
        RevenueRecord::create([
            'id'                 => Str::uuid()->toString(),
            'ad_unit_id'         => $this->adUnit1->id,
            'date'               => '2026-05-20',
            'hour'               => '00',
            'publisher_earnings' => 50.55,
        ]);
        // Earnings outside date range
        RevenueRecord::create([
            'id'                 => Str::uuid()->toString(),
            'ad_unit_id'         => $this->adUnit1->id,
            'date'               => '2026-06-01',
            'hour'               => '00',
            'publisher_earnings' => 200.00,
        ]);

        // 2. Create revenue records for site2.com
        RevenueRecord::create([
            'id'                 => Str::uuid()->toString(),
            'ad_unit_id'         => $this->adUnit2->id,
            'date'               => '2026-05-15',
            'hour'               => '00',
            'publisher_earnings' => 10.00,
        ]);

        // Total earnings in May:
        // site1.com = 100.00 + 50.55 = 150.55
        // site2.com = 10.00
        // With 5.0% IVT:
        // site1 deduction = 150.55 * 0.05 = 7.5275 => round(2) = 7.53
        // site2 deduction = 10.00 * 0.05 = 0.50 => round(2) = 0.50

        $response = $this->postJson('/api/v1/admin/adjustments/apply-ivt', [
            'gam_account_id' => $this->gamAccount->id,
            'website_ids'    => [$this->website1->id, $this->website2->id],
            'date_from'      => '2026-05-01',
            'date_to'        => '2026-05-31',
            'ivt_percent'    => 5.0,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'IVT deductions applied successfully.');

        // Assert two adjustments are created
        $adjustments = Adjustment::where('publisher_id', $this->publisher->id)->get();
        $this->assertCount(2, $adjustments);

        $adj1 = $adjustments->filter(fn($adj) => str_contains($adj->notes, 'site1.com'))->first();
        $this->assertNotNull($adj1);
        $this->assertEquals(-7.53, (float) $adj1->amount);
        $this->assertEquals('pending', $adj1->status);
        $this->assertEquals($this->admin->id, $adj1->created_by);

        $adj2 = $adjustments->filter(fn($adj) => str_contains($adj->notes, 'site2.com'))->first();
        $this->assertNotNull($adj2);
        $this->assertEquals(-0.50, (float) $adj2->amount);
        $this->assertEquals('pending', $adj2->status);


        // Assert Audit Logs were created
        $logs = AuditLog::where('entity_type', 'Adjustment')->get();
        $this->assertCount(2, $logs);
        $this->assertEquals('created', $logs->first()->action);
    }

    public function test_apply_bonus_calculates_and_creates_adjustments(): void
    {
        // 1. Create revenue records for site1.com
        RevenueRecord::create([
            'id'                 => Str::uuid()->toString(),
            'ad_unit_id'         => $this->adUnit1->id,
            'date'               => '2026-05-10',
            'hour'               => '00',
            'publisher_earnings' => 100.00,
        ]);
        RevenueRecord::create([
            'id'                 => Str::uuid()->toString(),
            'ad_unit_id'         => $this->adUnit1->id,
            'date'               => '2026-05-20',
            'hour'               => '00',
            'publisher_earnings' => 50.55,
        ]);

        // 2. Create revenue records for site2.com
        RevenueRecord::create([
            'id'                 => Str::uuid()->toString(),
            'ad_unit_id'         => $this->adUnit2->id,
            'date'               => '2026-05-15',
            'hour'               => '00',
            'publisher_earnings' => 10.00,
        ]);

        $response = $this->postJson('/api/v1/admin/adjustments/apply-bonus', [
            'gam_account_id' => $this->gamAccount->id,
            'website_ids'    => [$this->website1->id, $this->website2->id],
            'date_from'      => '2026-05-01',
            'date_to'        => '2026-05-31',
            'bonus_percent'  => 10.0,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Bonuses applied successfully.');

        $adjustments = Adjustment::where('publisher_id', $this->publisher->id)->get();
        $this->assertCount(2, $adjustments);

        $adj1 = $adjustments->filter(fn($adj) => str_contains($adj->notes, 'site1.com'))->first();
        $this->assertNotNull($adj1);
        $this->assertEquals(15.06, (float) $adj1->amount);
        $this->assertEquals('pending', $adj1->status);

        $adj2 = $adjustments->filter(fn($adj) => str_contains($adj->notes, 'site2.com'))->first();
        $this->assertNotNull($adj2);
        $this->assertEquals(1.00, (float) $adj2->amount);
        $this->assertEquals('pending', $adj2->status);

    }
}
