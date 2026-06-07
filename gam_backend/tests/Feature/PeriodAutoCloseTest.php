<?php

namespace Tests\Feature;

use App\Models\AdUnit;
use App\Models\Adjustment;
use App\Models\Payout;
use App\Models\PeriodClosing;
use App\Models\Publisher;
use App\Models\RevenueRecord;
use App\Models\Setting;
use App\Models\Website;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Tests\TestCase;

class PeriodAutoCloseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed settings
        Setting::updateOrCreate(['key' => 'payout_threshold'], [
            'value' => '50.00',
            'group' => 'payout',
            'label' => 'Minimum Payout Threshold (USD)',
            'type' => 'string',
        ]);
        Setting::updateOrCreate(['key' => 'payout_day'], [
            'value' => '1',
            'group' => 'payout',
            'label' => 'Auto Payout Day of Month',
            'type' => 'integer',
        ]);
        Setting::updateOrCreate(['key' => 'close_period_day'], [
            'value' => '20',
            'group' => 'payout',
            'label' => 'Auto-Close Period Day',
            'type' => 'integer',
        ]);
        Setting::updateOrCreate(['key' => 'payout_auto_enabled'], [
            'value' => 'true',
            'group' => 'payout',
            'label' => 'Enable Auto Payout',
            'type' => 'boolean',
        ]);
        Setting::updateOrCreate(['key' => 'approve_earnings_day'], [
            'value' => '1',
            'group' => 'payout',
            'label' => 'Approve Earnings Day',
            'type' => 'integer',
        ]);
    }

    public function test_threshold_rollover_logic(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 12:00:00'));

        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Test Publisher',
            'email' => 'test@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_account'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'test.com',
            'gam_network_code' => '123456',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'test_banner',
            'display_name' => 'Banner',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $20.00 (below threshold $50.00) in period 2026-05
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 25.00,
            'publisher_earnings' => 20.00, // below 50.00
            'period_closing_id' => null,
        ]);

        // Run auto-close command for 2026-05
        $exitCode = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 5,
        ]);

        $this->assertEquals(0, $exitCode);

        // Verify that PeriodClosing was created for 2026-05
        $closing1 = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $this->assertNotNull($closing1);
        $this->assertEquals('closed', $closing1->status);

        // Verify no payout was created for publisher
        $payoutCount = Payout::where('publisher_id', $publisher->id)->count();
        $this->assertEquals(0, $payoutCount);

        // Verify that the revenue record IS locked (period_closing_id is set to closing1)
        $rev1->refresh();
        $this->assertEquals($closing1->id, $rev1->period_closing_id);

        // Verify that a rollover adjustment was created carrying forward the $20
        $rolloverAdjustment = Adjustment::where('publisher_id', $publisher->id)
            ->where('status', 'pending')
            ->first();
        $this->assertNotNull($rolloverAdjustment);
        $this->assertEquals(20.00, (float)$rolloverAdjustment->amount);
        $this->assertEquals($closing1->id, $rolloverAdjustment->period_closing_id);

        // 4. Create another Revenue Record totaling $40.00 in period 2026-06 (so accumulated they have $60.00, above threshold)
        $rev2 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-06-10',
            'hour' => '00',
            'impressions' => 2000,
            'gross_revenue' => 50.00,
            'publisher_earnings' => 40.00,
            'period_closing_id' => null,
        ]);

        // Run auto-close command for 2026-06
        $exitCode2 = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 6,
        ]);

        $this->assertEquals(0, $exitCode2);

        // Verify PeriodClosing was created for 2026-06
        $closing2 = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 6)
            ->first();
        $this->assertNotNull($closing2);
        $this->assertEquals('closed', $closing2->status);

        // Verify payout WAS created for publisher in period 2026-06 closing
        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing2->id)
            ->first();
        $this->assertNotNull($payout);
        $this->assertEquals(60.00, (float)$payout->final_amount);
        $this->assertEquals(40.00, (float)$payout->amount); // base amount contains rev2 ($40)
        $this->assertEquals(20.00, (float)$payout->adjustment); // adjustment contains the rollover ($20)

        // Verify both revenue records are locked under their respective period closings
        $rev1->refresh();
        $rev2->refresh();
        $this->assertEquals($closing1->id, $rev1->period_closing_id);
        $this->assertEquals($closing2->id, $rev2->period_closing_id);
    }

    public function test_threshold_rollover_with_adjustments(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 12:00:00'));

        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Test Publisher',
            'email' => 'test2@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_account'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'test2.com',
            'gam_network_code' => '1234567',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'test_banner2',
            'display_name' => 'Banner 2',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $20.00
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 25.00,
            'publisher_earnings' => 20.00,
            'period_closing_id' => null,
        ]);

        // Create pending Adjustment of $10.00
        $adj1 = Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 10.00,
            'notes' => 'May bonus',
            'status' => 'pending',
            'created_at' => '2026-05-20 12:00:00',
        ]);

        // Run auto-close command for 2026-05 (total = $20 + $10 = $30, below $50)
        $exitCode = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 5,
        ]);
        $this->assertEquals(0, $exitCode);

        // Verify that PeriodClosing was created for 2026-05
        $closing1 = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $this->assertNotNull($closing1);

        // Verify that the revenue record is locked and adjustment is applied
        $rev1->refresh();
        $adj1->refresh();
        $this->assertEquals($closing1->id, $rev1->period_closing_id);
        $this->assertEquals('applied', $adj1->status);
        $this->assertEquals($closing1->id, $adj1->period_closing_id);

        // Verify rollover adjustment of $30.00 exists
        $rollover = Adjustment::where('publisher_id', $publisher->id)
            ->where('status', 'pending')
            ->first();
        $this->assertNotNull($rollover);
        $this->assertEquals(30.00, (float)$rollover->amount);
        $this->assertEquals($closing1->id, $rollover->period_closing_id);

        // 4. Create another Revenue Record of $15.00 and Adjustment of $15.00 in 2026-06
        // Cumulative final amount: $30 (rollover) + $15 (rev2) + $15 (adj2) = $60 (>= 50)
        $rev2 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-06-10',
            'hour' => '00',
            'impressions' => 1500,
            'gross_revenue' => 18.75,
            'publisher_earnings' => 15.00,
            'period_closing_id' => null,
        ]);

        $adj2 = Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 15.00,
            'notes' => 'June bonus',
            'status' => 'pending',
            'created_at' => '2026-06-10 12:00:00',
        ]);

        // Run auto-close command for 2026-06
        $exitCode2 = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 6,
        ]);
        $this->assertEquals(0, $exitCode2);

        // Verify PeriodClosing was created for 2026-06
        $closing2 = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 6)
            ->first();
        $this->assertNotNull($closing2);

        // Verify payout WAS created for publisher in period 2026-06 closing
        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing2->id)
            ->first();
        $this->assertNotNull($payout);
        $this->assertEquals(60.00, (float)$payout->final_amount);
        $this->assertEquals(15.00, (float)$payout->amount); // base earnings = 15
        $this->assertEquals(45.00, (float)$payout->adjustment); // total adjustments = 30 (rollover) + 15 (June bonus)

        // Verify adjustments are marked applied and linked to June closing
        $rollover->refresh();
        $adj2->refresh();
        $this->assertEquals('applied', $rollover->status);
        $this->assertEquals($closing2->id, $rollover->period_closing_id);
        $this->assertEquals('applied', $adj2->status);
        $this->assertEquals($closing2->id, $adj2->period_closing_id);

        // Verify both revenue records are locked under their respective period closings
        $rev1->refresh();
        $rev2->refresh();
        $this->assertEquals($closing1->id, $rev1->period_closing_id);
        $this->assertEquals($closing2->id, $rev2->period_closing_id);
    }

    public function test_delete_period_closing_unlocks_and_resets(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Test Publisher',
            'email' => 'test3@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_account'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'test3.com',
            'gam_network_code' => '12345678',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'test_banner3',
            'display_name' => 'Banner 3',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $60.00 (above threshold)
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 75.00,
            'publisher_earnings' => 60.00,
            'period_closing_id' => null,
        ]);

        // Create pending Adjustment of $10.00
        $adj1 = Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 10.00,
            'notes' => 'May bonus',
            'status' => 'pending',
            'created_at' => '2026-05-20 12:00:00',
        ]);

        // Run auto-close command for 2026-05
        $exitCode = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 5,
        ]);
        $this->assertEquals(0, $exitCode);

        // Verify PeriodClosing and Payout exist
        $closing = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $this->assertNotNull($closing);

        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->first();
        $this->assertNotNull($payout);

        // Verify revenue record locked and adjustment applied
        $rev1->refresh();
        $adj1->refresh();
        $this->assertEquals($closing->id, $rev1->period_closing_id);
        $this->assertEquals('applied', $adj1->status);
        $this->assertEquals($closing->id, $adj1->period_closing_id);

        // Act: call the delete endpoint as admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->deleteJson("/api/v1/admin/period-closings/{$closing->id}");

        $response->assertStatus(200);

        // Assert that period closing record is deleted
        $this->assertNull(PeriodClosing::find($closing->id));

        // Assert that payout is deleted
        $this->assertNull(Payout::find($payout->id));

        // Assert that revenue record is unlocked
        $rev1->refresh();
        $this->assertNull($rev1->period_closing_id);

        // Assert that adjustment is reset to pending and unlocked
        $adj1->refresh();
        $this->assertEquals('pending', $adj1->status);
        $this->assertNull($adj1->period_closing_id);
    }

    public function test_missing_payout_account_rollover(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 12:00:00'));

        // 1. Create a Publisher with NO payment_info
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Test Publisher No Payment',
            'email' => 'nopayment@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => null, // no payment info
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'test4.com',
            'gam_network_code' => '123456789',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'test_banner4',
            'display_name' => 'Banner 4',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $60.00 (above threshold)
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 75.00,
            'publisher_earnings' => 60.00,
            'period_closing_id' => null,
        ]);

        // Run auto-close command for 2026-05
        $exitCode = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 5,
        ]);
        $this->assertEquals(0, $exitCode);

        // Verify that PeriodClosing was created for 2026-05
        $closing1 = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $this->assertNotNull($closing1);

        // Verify that the revenue record IS locked under closing1
        $rev1->refresh();
        $this->assertEquals($closing1->id, $rev1->period_closing_id);

        // Verify rollover adjustment of $60 exists
        $rollover = Adjustment::where('publisher_id', $publisher->id)
            ->where('status', 'pending')
            ->first();
        $this->assertNotNull($rollover);
        $this->assertEquals(60.00, (float)$rollover->amount);
        $this->assertEquals($closing1->id, $rollover->period_closing_id);

        // Verify no payout was created for publisher
        $payoutCount = Payout::where('publisher_id', $publisher->id)->count();
        $this->assertEquals(0, $payoutCount);

        // 4. Now configure payment info
        $publisher->update([
            'payment_info' => ['method' => 'Wise', 'account' => 'payout_account_123']
        ]);

        // Run auto-close command for 2026-06
        $exitCode2 = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 6,
        ]);
        $this->assertEquals(0, $exitCode2);

        // Verify payout WAS created for publisher in period 2026-06 closing
        $closing2 = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 6)
            ->first();
        $this->assertNotNull($closing2);

        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing2->id)
            ->first();
        $this->assertNotNull($payout);
        $this->assertEquals(60.00, (float)$payout->final_amount);
        $this->assertEquals('Wise', $payout->payment_method);
        $this->assertEquals(0.00, (float)$payout->amount); // 0 new earnings in June
        $this->assertEquals(60.00, (float)$payout->adjustment); // 60 rollover adjustment

        // Verify revenue record is locked under May closing
        $rev1->refresh();
        $this->assertEquals($closing1->id, $rev1->period_closing_id);
    }

    public function test_admin_can_manually_create_payout_ignoring_threshold(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Test Publisher Manual',
            'email' => 'manual@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Bank Transfer', 'account' => 'manual_acc_123'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'test5.com',
            'gam_network_code' => '987654321',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'test_banner5',
            'display_name' => 'Banner 5',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $20.00 (below threshold $50.00)
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 25.00,
            'publisher_earnings' => 20.00,
            'period_closing_id' => null,
        ]);

        // Act: Create closed PeriodClosing first
        $closing = PeriodClosing::create([
            'id' => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month' => 5,
            'status' => 'closed',
            'closed_at' => now(),
        ]);
        $rev1->update(['period_closing_id' => $closing->id]);

        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin2@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 10.00, // manual amount override
            'admin_note' => 'Manual override payout',
        ]);

        $response->assertStatus(200);

        // Verify Payout is created
        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->first();
        $this->assertNotNull($payout);

        // Assert payout parameters
        $this->assertEquals(10.00, (float)$payout->final_amount);
        $this->assertEquals(10.00, (float)$payout->amount);
        $this->assertEquals(0.00, (float)$payout->adjustment);
        $this->assertEquals('Manual override payout', $payout->admin_note);
        $this->assertEquals('Bank Transfer', $payout->payment_method);

        // Verify revenue record is locked
        $rev1->refresh();
        $this->assertEquals($closing->id, $rev1->period_closing_id);
    }

    public function test_auto_close_handles_residual_publishers_when_payout_already_exists(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 12:00:00'));

        // 1. Create Publisher A (will get manual payout) and Publisher B (will get auto payout)
        $pubA = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Publisher A',
            'email' => 'puba@test.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'acc_a'],
        ]);

        $pubB = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Publisher B',
            'email' => 'pubb@test.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'acc_b'],
        ]);

        // 2. Create Website and Ad Unit for each
        $webA = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $pubA->id,
            'domain' => 'sitea.com',
            'gam_network_code' => '111111',
            'is_active' => true,
        ]);
        $adUnitA = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $webA->id,
            'gam_ad_unit_name' => 'banner_a',
            'display_name' => 'Banner A',
            'is_active' => true,
        ]);

        $webB = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $pubB->id,
            'domain' => 'siteb.com',
            'gam_network_code' => '222222',
            'is_active' => true,
        ]);
        $adUnitB = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $webB->id,
            'gam_ad_unit_name' => 'banner_b',
            'display_name' => 'Banner B',
            'is_active' => true,
        ]);

        // 3. Create Revenue Records for both in May 2026
        $revA = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnitA->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 120.00,
            'publisher_earnings' => 100.00,
            'period_closing_id' => null,
        ]);

        $revB = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnitB->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 500,
            'gross_revenue' => 100.00,
            'publisher_earnings' => 80.00,
            'period_closing_id' => null,
        ]);

        // 4. Create closed PeriodClosing and lock Publisher A's revenue record
        $closing = PeriodClosing::create([
            'id' => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month' => 5,
            'status' => 'closed',
            'total_gross_revenue' => 120.00,
            'total_publisher_earnings' => 100.00,
            'total_impressions' => 1000,
            'closed_at' => now(),
        ]);
        $revA->update(['period_closing_id' => $closing->id]);

        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_resid@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$pubA->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 100.00,
            'admin_note' => 'Manual payout for A',
        ]);
        $response->assertStatus(200);

        // 5. Run the period:auto-close command for 2026-05
        $exitCode = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 5,
        ]);
        $this->assertEquals(0, $exitCode);

        // Verify that:
        $payoutB = Payout::where('publisher_id', $pubB->id)
            ->where('period_closing_id', $closing->id)
            ->first();
        $this->assertNotNull($payoutB);
        $this->assertEquals(80.00, (float)$payoutB->final_amount);

        // - Publisher B's revenue is locked
        $revB->refresh();
        $this->assertEquals($closing->id, $revB->period_closing_id);

        // - PeriodClosing aggregates are updated with Publisher B's totals
        $closing->refresh();
        $this->assertEquals(180.00, (float)$closing->total_publisher_earnings); // 100 + 80
        $this->assertEquals(220.00, (float)$closing->total_gross_revenue); // 120 + 100
        $this->assertEquals(1500, $closing->total_impressions); // 1000 + 500
        $this->assertEquals('closed', $closing->status);
    }

    public function test_admin_can_initiate_close_for_period_with_manual_payout_if_unprocessed_publishers_exist(): void
    {
        // 1. Create Publisher A (will get manual payout) and Publisher B (will get auto payout)
        $pubA = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Publisher A',
            'email' => 'puba@test.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'acc_a'],
        ]);

        $pubB = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Publisher B',
            'email' => 'pubb@test.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'acc_b'],
        ]);

        // 2. Create Website and Ad Unit for each
        $webA = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $pubA->id,
            'domain' => 'sitea.com',
            'gam_network_code' => '111111',
            'is_active' => true,
        ]);
        $adUnitA = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $webA->id,
            'gam_ad_unit_name' => 'banner_a',
            'display_name' => 'Banner A',
            'is_active' => true,
        ]);

        $webB = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $pubB->id,
            'domain' => 'siteb.com',
            'gam_network_code' => '222222',
            'is_active' => true,
        ]);
        $adUnitB = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $webB->id,
            'gam_ad_unit_name' => 'banner_b',
            'display_name' => 'Banner B',
            'is_active' => true,
        ]);

        // 3. Create Revenue Records for both in May 2026
        $revA = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnitA->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 120.00,
            'publisher_earnings' => 100.00,
            'period_closing_id' => null,
        ]);

        $revB = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnitB->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 500,
            'gross_revenue' => 100.00,
            'publisher_earnings' => 80.00,
            'period_closing_id' => null,
        ]);

        // 4. Create closed PeriodClosing and lock Publisher A's revenue record
        $closing = PeriodClosing::create([
            'id' => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month' => 5,
            'status' => 'closed',
            'total_gross_revenue' => 120.00,
            'total_publisher_earnings' => 100.00,
            'total_impressions' => 1000,
            'closed_at' => now(),
        ]);
        $revA->update(['period_closing_id' => $closing->id]);

        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_resid2@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$pubA->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 100.00,
            'admin_note' => 'Manual payout for A',
        ]);
        $response->assertStatus(200);

        // 5. Try to close the period via the PeriodClosing controller endpoint
        $closeResponse = $this->postJson("/api/v1/admin/period-closings/close", [
            'year' => 2026,
            'month' => 5,
        ]);

        $closeResponse->assertStatus(202);

        // Assert that running it again after locking all revenue records returns 422
        $revB->update(['period_closing_id' => PeriodClosing::where('period_year', 2026)->where('period_month', 5)->first()->id]);

        $closeResponse2 = $this->postJson("/api/v1/admin/period-closings/close", [
            'year' => 2026,
            'month' => 5,
        ]);
        $closeResponse2->assertStatus(422);
    }

    public function test_admin_can_update_publisher_ratio_split(): void
    {
        // 1. Create a Publisher with default_ratio = 0.70
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Ratio Test Publisher',
            'email' => 'ratio@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.70,
        ]);

        // 2. Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin3@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Act: Update ratio split to 0.85
        $response = $this->putJson("/api/v1/admin/publishers/{$publisher->id}", [
            'name' => 'Ratio Test Publisher Updated',
            'email' => 'ratio@publisher.com',
            'default_ratio' => 0.85,
            'status' => 'active',
        ]);

        $response->assertStatus(200);

        // Assert publisher ratio is updated
        $publisher->refresh();
        $this->assertEquals(0.85, (float)$publisher->default_ratio);

        // Assert RatioHistory is created
        $history = \App\Models\RatioHistory::where('entity_type', 'publisher')
            ->where('entity_id', $publisher->id)
            ->first();
        $this->assertNotNull($history);
        $this->assertEquals(0.70, (float)$history->old_ratio);
        $this->assertEquals(0.85, (float)$history->new_ratio);
        $this->assertEquals($admin->id, $history->changed_by);
    }

    public function test_ratio_history_endpoint_returns_publisher_and_website_logs(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Ratio Test Publisher 2',
            'email' => 'ratio2@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.70,
        ]);

        // 2. Create Website
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'mytestsite.com',
            'gam_network_code' => '999999',
            'is_active' => true,
        ]);

        // 3. Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin Changer',
            'email' => 'admin4@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // 4. Create RatioHistory logs
        \App\Models\RatioHistory::create([
            'id' => Str::uuid()->toString(),
            'entity_type' => 'publisher',
            'entity_id' => $publisher->id,
            'old_ratio' => 0.70,
            'new_ratio' => 0.80,
            'changed_by' => $admin->id,
            'changed_at' => now()->subDay(),
        ]);

        \App\Models\RatioHistory::create([
            'id' => Str::uuid()->toString(),
            'entity_type' => 'website',
            'entity_id' => $website->id,
            'old_ratio' => null,
            'new_ratio' => 0.75,
            'changed_by' => $admin->id,
            'changed_at' => now(),
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Act: request the ratio history
        $response = $this->getJson("/api/v1/admin/publishers/{$publisher->id}/ratio-history");

        $response->assertStatus(200);
        $response->assertJsonCount(2);

        $data = $response->json();

        // The first log is the newest (website ratio change)
        $this->assertEquals('website', $data[0]['entity_type']);
        $this->assertEquals('Website: mytestsite.com', $data[0]['target']);
        $this->assertEquals(0.75, (float)$data[0]['new_ratio']);
        $this->assertEquals('Admin Changer', $data[0]['changed_by']);

        // The second log is the older (publisher ratio change)
        $this->assertEquals('publisher', $data[1]['entity_type']);
        $this->assertEquals('General Profile', $data[1]['target']);
        $this->assertEquals(0.80, (float)$data[1]['new_ratio']);
        $this->assertEquals('Admin Changer', $data[1]['changed_by']);
    }

    public function test_admin_can_clear_website_ratio_override(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Clear Override Publisher',
            'email' => 'clearoverride@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.70,
        ]);

        // 2. Create Website with override ratio 0.85
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'override.com',
            'ratio_override' => 0.85,
            'gam_network_code' => '55555',
            'is_active' => true,
        ]);

        // 3. Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin5@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Act: Update website setting ratio_override to null (inheriting from publisher)
        $response = $this->putJson("/api/v1/admin/websites/{$website->id}", [
            'publisher_id' => $publisher->id,
            'domain' => 'override.com',
            'ratio_override' => null, // clear it
            'gam_network_code' => '55555',
            'is_active' => true,
        ]);

        $response->assertStatus(200);

        // Assert ratio_override is now null in database
        $website->refresh();
        $this->assertNull($website->ratio_override);

        // Assert RatioHistory shows a new entry with null new_ratio
        $history = \App\Models\RatioHistory::where('entity_type', 'website')
            ->where('entity_id', $website->id)
            ->orderBy('changed_at', 'desc')
            ->first();
        $this->assertNotNull($history);
        $this->assertEquals(0.85, (float)$history->old_ratio);
        $this->assertNull($history->new_ratio);
        $this->assertEquals($admin->id, $history->changed_by);
    }

    public function test_admin_can_reject_payout_and_roll_back_balances(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Reject Rollback Publisher',
            'email' => 'rejectrollback@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'payout_account_123'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'rollbacktest.com',
            'gam_network_code' => '121212',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'test_banner_rollback',
            'display_name' => 'Banner Rollback',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $60.00 (above threshold)
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 75.00,
            'publisher_earnings' => 60.00,
            'period_closing_id' => null,
        ]);

        // Create pending Adjustment of $10.00
        $adj1 = Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 10.00,
            'notes' => 'May bonus',
            'status' => 'pending',
            'created_at' => '2026-05-20 12:00:00',
        ]);

        // Run auto-close command for 2026-05 (total = $60 + $10 = $70, above threshold)
        $exitCode = Artisan::call('period:auto-close', [
            '--force-year' => 2026,
            '--force-month' => 5,
        ]);
        $this->assertEquals(0, $exitCode);

        // Verify PeriodClosing and Payout exist
        $closing = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $this->assertNotNull($closing);
        $this->assertEquals(75.00, (float)$closing->total_gross_revenue);
        $this->assertEquals(60.00, (float)$closing->total_publisher_earnings);
        $this->assertEquals(1000, $closing->total_impressions);

        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->first();
        $this->assertNotNull($payout);
        $this->assertEquals(70.00, (float)$payout->final_amount);
        $this->assertEquals('pending', $payout->status);

        // Verify revenue record locked and adjustment applied
        $rev1->refresh();
        $adj1->refresh();
        $this->assertEquals($closing->id, $rev1->period_closing_id);
        $this->assertEquals('applied', $adj1->status);
        $this->assertEquals($closing->id, $adj1->period_closing_id);

        // Act: call the reject endpoint as admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_reject@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Check dynamic available balance before reject (should be $0.00 because locked)
        $responseBefore = $this->getJson("/api/v1/admin/publishers/{$publisher->id}");
        $responseBefore->assertStatus(200);
        $this->assertEquals(0.00, (float)$responseBefore->json('data.approved_balance'));

        // Perform rejection
        $responseReject = $this->postJson("/api/v1/admin/payouts/{$payout->id}/reject", [
            'admin_note' => 'Payment info is invalid.',
        ]);

        $responseReject->assertStatus(200);

        // Verify payout is rejected
        $payout->refresh();
        $this->assertEquals('rejected', $payout->status);
        $this->assertEquals('Payment info is invalid.', $payout->admin_note);

        // Verify revenue record is unlocked
        $rev1->refresh();
        $this->assertNull($rev1->period_closing_id);

        // Verify adjustment is reset to pending and unlocked
        $adj1->refresh();
        $this->assertEquals('pending', $adj1->status);
        $this->assertNull($adj1->period_closing_id);

        // Verify PeriodClosing totals are decremented back to 0
        $closing->refresh();
        $this->assertEquals(0.00, (float)$closing->total_gross_revenue);
        $this->assertEquals(0.00, (float)$closing->total_publisher_earnings);
        $this->assertEquals(0, $closing->total_impressions);

        // Verify publisher dynamic balance is now restored:
        // approved_balance should be: $60 (unlocked revenue) + $10 (pending adjustment) = $70.00
        $responseAfter = $this->getJson("/api/v1/admin/publishers/{$publisher->id}");
        $responseAfter->assertStatus(200);
        $this->assertEquals(70.00, (float)$responseAfter->json('data.approved_balance'));
        $this->assertEquals(10.00, (float)$responseAfter->json('data.pending_balance_adjustment'));

        // Assert that we cannot approve this rejected payout anymore
        $responseApprove = $this->postJson("/api/v1/admin/payouts/{$payout->id}/approve", [
            'admin_note' => 'Try to approve rejected',
        ]);
        $responseApprove->assertStatus(400);
    }

    public function test_calendar_based_approval_logic(): void
    {
        // Set current time to a fixed date: 2026-06-03
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-06-03 12:00:00'));

        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Calendar Test Publisher',
            'email' => 'calendar@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'calendar.com',
            'gam_network_code' => '998877',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'calendar_banner',
            'display_name' => 'Calendar Banner',
            'is_active' => true,
        ]);

        // May record (previous month)
        $mayRecord = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 10.00,
            'publisher_earnings' => 8.00,
        ]);

        // June record (current month)
        $juneRecord = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-06-02',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 10.00,
            'publisher_earnings' => 8.00,
        ]);

        // Case A: approve_earnings_day = 1.
        // Today is June 3rd (day 3 >= 1), so May's records should be approved. June record should be pending.
        Setting::updateOrCreate(['key' => 'approve_earnings_day'], ['value' => '1']);

        $this->assertTrue($mayRecord->fresh()->is_approved);
        $this->assertFalse($juneRecord->fresh()->is_approved);

        // Case B: approve_earnings_day = 5.
        // Today is June 3rd (day 3 < 5), so May's records should NOT be approved yet (pending).
        Setting::updateOrCreate(['key' => 'approve_earnings_day'], ['value' => '5']);

        $this->assertFalse($mayRecord->fresh()->is_approved);
        $this->assertFalse($juneRecord->fresh()->is_approved);

        // Case C: Today is June 6th (day 6 >= 5), May's records should now be approved.
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-06-06 12:00:00'));

        $this->assertTrue($mayRecord->fresh()->is_approved);
        $this->assertFalse($juneRecord->fresh()->is_approved);

        // Reset test time
        \Carbon\Carbon::setTestNow();
    }

    public function disabled_test_manual_payout_with_custom_amount_carries_over_balance(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Carry Over Publisher',
            'email' => 'carryover@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_acc'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'carryover.com',
            'gam_network_code' => '999111',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'carryover_banner',
            'display_name' => 'CarryOver Banner',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $125.79 (above threshold)
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 157.2375,
            'publisher_earnings' => 125.79,
            'period_closing_id' => null,
        ]);

        // Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_carry@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Check original approved balance
        $responseBefore = $this->getJson("/api/v1/admin/publishers/{$publisher->id}");
        $this->assertEquals(125.79, (float)$responseBefore->json('data.approved_balance'));

        // Act: Create manual payout of $50.00
        $responsePayout = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 50.00,
            'admin_note' => 'Partial manual payout of $50.00',
        ]);

        $responsePayout->assertStatus(200);

        // Verify Payout is created
        $closing = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $this->assertNotNull($closing);

        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->first();
        $this->assertNotNull($payout);
        $this->assertEquals(50.00, (float)$payout->final_amount);
        $this->assertEquals(125.79, (float)$payout->amount);
        $this->assertEquals(-75.79, (float)$payout->adjustment);

        // Verify carry-over adjustment exists in adjustments table
        $carryOver = Adjustment::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->where('status', 'pending')
            ->first();
        $this->assertNotNull($carryOver);
        $this->assertEquals(75.79, (float)$carryOver->amount);
        $this->assertStringContainsString('Carry-over balance', $carryOver->notes);

        // Verify publisher approved balance is now $75.79
        $responseAfter = $this->getJson("/api/v1/admin/publishers/{$publisher->id}");
        $this->assertEquals(75.79, (float)$responseAfter->json('data.approved_balance'));

        // Rejection cleanup check
        // Rejection should delete the carry-over adjustment and restore original balance
        $responseReject = $this->postJson("/api/v1/admin/payouts/{$payout->id}/reject", [
            'admin_note' => 'Rejected to test carry-over rollback',
        ]);
        $responseReject->assertStatus(200);

        // Assert carry-over adjustment is deleted
        $this->assertNull(Adjustment::find($carryOver->id));

        // Assert approved balance is restored to 125.79
        $responseAfterReject = $this->getJson("/api/v1/admin/publishers/{$publisher->id}");
        $this->assertEquals(125.79, (float)$responseAfterReject->json('data.approved_balance'));
    }

    public function disabled_test_delete_period_closing_cleans_up_carry_over_adjustment(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Carry Over PC Publisher',
            'email' => 'carryoverpc@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_acc'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'carryoverpc.com',
            'gam_network_code' => '999222',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'carryoverpc_banner',
            'display_name' => 'CarryOverPC Banner',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $125.79 (above threshold)
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 157.2375,
            'publisher_earnings' => 125.79,
            'period_closing_id' => null,
        ]);

        // Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_carry_pc@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Create manual payout of $50.00
        $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 50.00,
            'admin_note' => 'Partial manual payout of $50.00',
        ])->assertStatus(200);

        $closing = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $this->assertNotNull($closing);

        $carryOver = Adjustment::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->where('status', 'pending')
            ->first();
        $this->assertNotNull($carryOver);

        // Act: Delete period closing
        $responseDelete = $this->deleteJson("/api/v1/admin/period-closings/{$closing->id}");
        $responseDelete->assertStatus(200);

        // Assert carry-over adjustment is deleted
        $this->assertNull(Adjustment::find($carryOver->id));

        // Assert approved balance is restored to 125.79
        $responseAfterDelete = $this->getJson("/api/v1/admin/publishers/{$publisher->id}");
        $this->assertEquals(125.79, (float)$responseAfterDelete->json('data.approved_balance'));
    }

    public function disabled_test_can_re_request_payout_after_rejection(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Re-request Publisher',
            'email' => 'rerequest@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_acc'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'rerequest.com',
            'gam_network_code' => '999333',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'rerequest_banner',
            'display_name' => 'Re-request Banner',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $125.79 (above threshold)
        $rev1 = RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => '00',
            'impressions' => 1000,
            'gross_revenue' => 157.2375,
            'publisher_earnings' => 125.79,
            'period_closing_id' => null,
        ]);

        // Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_rereq@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Create manual payout of $50.00
        $response1 = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 50.00,
            'admin_note' => 'First manual payout',
        ]);
        $response1->assertStatus(200);

        $closing = PeriodClosing::where('period_year', 2026)
            ->where('period_month', 5)
            ->first();
        $payout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->first();
        $this->assertNotNull($payout);

        // Try to request again while pending -> should fail with error message
        $responseDuplicate = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 60.00,
            'admin_note' => 'Duplicate manual payout',
        ]);
        $responseDuplicate->assertStatus(422);
        $responseDuplicate->assertJsonFragment([
            'message' => 'A payout already exists for this publisher in period 2026-05.'
        ]);

        // Reject the payout
        $responseReject = $this->postJson("/api/v1/admin/payouts/{$payout->id}/reject", [
            'admin_note' => 'Rejected',
        ]);
        $responseReject->assertStatus(200);

        // Try to request again after rejection -> should succeed now!
        $responseRetry = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 75.00,
            'admin_note' => 'Second manual payout after rejection',
        ]);
        $responseRetry->assertStatus(200);

        // Assert that the rejected payout is NOT deleted (it is preserved for history)
        $payout->refresh();
        $this->assertEquals('rejected', $payout->status);

        $newPayout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->where('status', 'pending')
            ->first();
        $this->assertNotNull($newPayout);
        $this->assertEquals(75.00, (float)$newPayout->final_amount);
        $this->assertEquals('pending', $newPayout->status);

        // Verify both payouts exist in database for this publisher and period closing
        $allPayouts = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->get();
        $this->assertCount(2, $allPayouts);
    }

    public function disabled_test_manual_payout_cannot_exceed_available_balance(): void
    {
        // Set current time to a fixed date: 2026-06-21
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-06-21 12:00:00'));

        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Validation Test Pub',
            'email'         => 'val_pub@test.com',
            'default_ratio' => 0.70,
            'status'        => 'active',
            'payment_info'  => ['method' => 'paypal', 'account' => 'paypal@test.com']
        ]);

        // 2. Create approved revenue of $60.00
        $website = \App\Models\Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'val-test.com',
            'gam_network_code' => '123456',
            'is_active' => true,
        ]);

        $adUnit = \App\Models\AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'val_banner',
            'display_name' => 'Val Banner',
            'is_active' => true,
        ]);

        RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => 12,
            'gross_revenue' => 100.00,
            'publisher_earnings' => 60.00,
            'impressions' => 1000,
        ]);

        // Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_val@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Act: Try to create manual payout of $70.00 (exceeds available balance of $60.00)
        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 70.00,
            'admin_note' => 'Exceeding payout request',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'The payout amount cannot exceed the available wallet balance of $60.00.',
        ]);
    }

    public function disabled_test_manual_payout_only_includes_adjustments_from_target_period(): void
    {
        // Set current time to a fixed date: 2026-06-21
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-06-21 12:00:00'));

        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Target Period Adjustment Test Pub',
            'email'         => 'target_adj_pub@test.com',
            'default_ratio' => 0.70,
            'status'        => 'active',
            'payment_info'  => ['method' => 'Wise', 'account' => 'wise_acc_123']
        ]);

        // 2. Create approved revenue of $60.00 for May 2026
        $website = \App\Models\Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'target-adj-test.com',
            'gam_network_code' => '1234567',
            'is_active' => true,
        ]);

        $adUnit = \App\Models\AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'target_adj_banner',
            'display_name' => 'Target Adj Banner',
            'is_active' => true,
        ]);

        RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => 12,
            'gross_revenue' => 100.00,
            'publisher_earnings' => 60.00,
            'impressions' => 1000,
        ]);

        // 3. Create a pending adjustment in May 2026 of +$10.00
        \App\Models\Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 10.00,
            'notes' => 'May Adjustment',
            'status' => 'pending',
            'created_at' => '2026-05-20 12:00:00',
        ]);

        // 4. Create a pending adjustment in June 2026 of +$30.00 (should be excluded from May payout)
        \App\Models\Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 30.00,
            'notes' => 'June Adjustment',
            'status' => 'pending',
            'created_at' => '2026-06-05 12:00:00',
        ]);

        // Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_adj_val@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Act: Create manual payout for May 2026.
        // Available May balance is: $60.00 (revenue) + $10.00 (May adjustment) = $70.00.
        // June adjustment ($30.00) is excluded.
        // If we try to create a payout of $80.00, it should FAIL because $80.00 > $70.00.
        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 80.00,
            'admin_note' => 'Payout of $80 should fail',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'The payout amount cannot exceed the available wallet balance of $70.00.',
        ]);

        // A payout of $70.00 should SUCCEED.
        $response2 = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 70.00,
            'admin_note' => 'Payout of $70 should succeed',
        ]);

        $response2->assertStatus(200);

        // Verify that only the May adjustment is marked as applied, while the June adjustment is still pending.
        $mayAdjustment = \App\Models\Adjustment::where('notes', 'May Adjustment')->first();
        $this->assertEquals('applied', $mayAdjustment->status);

        $juneAdjustment = \App\Models\Adjustment::where('notes', 'June Adjustment')->first();
        $this->assertEquals('pending', $juneAdjustment->status);
    }

    public function test_publisher_resource_contains_ready_for_payout_balance(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Balance Test Pub',
            'email' => 'balancetest@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_account'],
        ]);

        // 2. Create Website and Ad Unit
        $website = Website::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'domain' => 'balancetest.com',
            'gam_network_code' => '12345678',
            'is_active' => true,
        ]);

        $adUnit = AdUnit::create([
            'id' => Str::uuid()->toString(),
            'website_id' => $website->id,
            'gam_ad_unit_name' => 'bal_banner',
            'display_name' => 'Banner',
            'is_active' => true,
        ]);

        // 3. Create Revenue Record totaling $60.00 in May 2026
        RevenueRecord::create([
            'id' => Str::uuid()->toString(),
            'ad_unit_id' => $adUnit->id,
            'date' => '2026-05-15',
            'hour' => 0,
            'impressions' => 1000,
            'unfilled_impressions' => 0,
            'clicks' => 10,
            'ctr' => 0.01,
            'gross_revenue' => 100.00,
            'cpm' => 2.00,
            'ratio_applied' => 0.80,
            'publisher_earnings' => 60.00,
            'publisher_cpm' => 1.60,
        ]);

        // May Adjustment ($10)
        \App\Models\Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 10.00,
            'notes' => 'May Adjustment',
            'status' => 'pending',
            'created_at' => '2026-05-05 12:00:00',
        ]);

        // June Adjustment ($30)
        \App\Models\Adjustment::forceCreate([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount' => 30.00,
            'notes' => 'June Adjustment',
            'status' => 'pending',
            'created_at' => '2026-06-05 12:00:00',
        ]);

        // Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_bal_test@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Check response with date_to = 2026-05-31
        // ready_for_payout_balance should still be 60 (revenue) + 10 (May) + 30 (June) = 100.
        // approved_balance should be filtered to 60 + 10 = 70.
        $response = $this->getJson("/api/v1/admin/publishers/{$publisher->id}?date_to=2026-05-31");
        $response->assertStatus(200);
        $response->assertJsonPath('data.approved_balance', 70);
        $response->assertJsonPath('data.ready_for_payout_balance', 100);

        // Check response without date filters
        // both approved_balance and ready_for_payout_balance should be 100.
        $responseNoDate = $this->getJson("/api/v1/admin/publishers/{$publisher->id}");
        $responseNoDate->assertStatus(200);
        $responseNoDate->assertJsonPath('data.approved_balance', 100);
        $responseNoDate->assertJsonPath('data.ready_for_payout_balance', 100);
    }

    public function test_period_closing_index_excludes_rejected_payouts_from_total_payouts(): void
    {
        // 1. Create a Publisher
        $publisher = Publisher::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Closing Test Pub',
            'email' => 'closingtest@publisher.com',
            'status' => 'active',
            'default_ratio' => 0.80,
            'payment_info' => ['method' => 'Wise', 'account' => 'test_account'],
        ]);

        // 2. Create a Period Closing
        $closing = PeriodClosing::create([
            'id' => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month' => 5,
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        // 3. Create an approved payout ($15) under this closing
        Payout::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'period_closing_id' => $closing->id,
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 15.00,
            'adjustment' => 0.00,
            'final_amount' => 15.00,
            'status' => 'approved',
        ]);

        // 4. Create a rejected payout ($20) under this closing
        Payout::create([
            'id' => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'period_closing_id' => $closing->id,
            'period_year' => 2026,
            'period_month' => 5,
            'amount' => 20.00,
            'adjustment' => 0.00,
            'final_amount' => 20.00,
            'status' => 'rejected',
        ]);

        // Create Admin user
        $admin = \App\Models\User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin_closing_test@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Call GET /api/v1/admin/period-closings
        // payouts_sum_final_amount should be 15, not 35
        $response = $this->getJson("/api/v1/admin/period-closings");
        $response->assertStatus(200);
        $response->assertJsonPath('data.0.payouts_sum_final_amount', 15);
    }
}
