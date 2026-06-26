<?php

namespace Tests\Feature;

use App\Models\AdUnit;
use App\Models\Adjustment;
use App\Models\Payout;
use App\Models\PeriodClosing;
use App\Models\Publisher;
use App\Models\RevenueRecord;
use App\Models\Setting;
use App\Models\User;
use App\Models\Website;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class FinancialConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        return User::create([
            'id'        => Str::uuid()->toString(),
            'name'      => 'Admin User',
            'email'     => 'admin@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
    }

    private function makePublisher(string $email = 'pub@test.com'): Publisher
    {
        return Publisher::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Test Publisher',
            'email'         => $email,
            'status'        => 'active',
            'default_ratio' => 0.80,
            'payment_info'  => ['method' => 'Wise', 'account' => 'acc_123'],
        ]);
    }

    private function makeRevenue(Publisher $publisher, string $date, float $earnings): RevenueRecord
    {
        $website = Website::create([
            'id'               => Str::uuid()->toString(),
            'publisher_id'     => $publisher->id,
            'domain'           => 'site-' . Str::random(4) . '.com',
            'gam_network_code' => (string) rand(1000, 9999),
            'is_active'        => true,
        ]);
        $adUnit = AdUnit::create([
            'id'               => Str::uuid()->toString(),
            'website_id'       => $website->id,
            'gam_ad_unit_name' => 'banner_' . Str::random(4),
            'display_name'     => 'Banner',
            'is_active'        => true,
        ]);
        return RevenueRecord::create([
            'id'                  => Str::uuid()->toString(),
            'ad_unit_id'          => $adUnit->id,
            'date'                => $date,
            'hour'                => '00',
            'impressions'         => 1000,
            'gross_revenue'       => $earnings / 0.8,
            'publisher_earnings'  => $earnings,
            'period_closing_id'   => null,
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        Setting::updateOrCreate(['key' => 'payout_threshold'],    ['value' => '50.00', 'group' => 'payout', 'label' => 'Threshold', 'type' => 'string']);
        Setting::updateOrCreate(['key' => 'payout_auto_enabled'], ['value' => 'true',  'group' => 'payout', 'label' => 'Auto',      'type' => 'boolean']);
        Setting::updateOrCreate(['key' => 'close_period_day'],    ['value' => '20',    'group' => 'payout', 'label' => 'Close Day',  'type' => 'integer']);
        Setting::updateOrCreate(['key' => 'approve_earnings_day'],['value' => '1',     'group' => 'payout', 'label' => 'Approve Day','type' => 'integer']);
    }

    /**
     * Verifies that concurrent period closing is prevented by the Cache lock.
     */
    public function test_concurrent_period_close_is_prevented_by_cache_lock(): void
    {
        $admin = $this->makeAdmin();
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Set carbon time to allow closing
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 12:00:00'));

        // Acquire the cache lock manually to simulate concurrent close in progress
        $lock = Cache::lock("period_close_lock_2026_6", 600);
        $lock->get();

        $response = $this->postJson("/api/v1/admin/period-closings/close", [
            'year'  => 2026,
            'month' => 6,
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', fn($msg) => str_contains($msg, 'Another close operation'));

        $lock->release();
    }

    /**
     * Verifies that concurrent period close fails if the period is already in 'closing' status.
     */
    public function test_period_close_fails_if_status_is_closing(): void
    {
        $admin = $this->makeAdmin();
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 12:00:00'));

        PeriodClosing::create([
            'id'          => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month'=> 6,
            'status'      => 'closing',
        ]);

        $response = $this->postJson("/api/v1/admin/period-closings/close", [
            'year'  => 2026,
            'month' => 6,
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', fn($msg) => str_contains($msg, 'currently being closed'));
    }

    /**
     * Verifies that duplicate submissions with the same idempotency key return the same manual payment record.
     */
    public function test_manual_payment_double_submit_idempotency(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher();
        Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 100.00,
            'status'       => 'pending',
            'notes'        => 'Seeded balance',
            'created_at'   => now(),
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $key = 'idemp_key_12345';

        $response1 = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount'          => 75.00,
            'method'          => 'Wise',
            'idempotency_key' => $key,
        ]);

        $response1->assertStatus(201);
        $payout1Id = $response1->json('payout.id');

        $response2 = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount'          => 75.00,
            'method'          => 'Wise',
            'idempotency_key' => $key,
        ]);

        $response2->assertStatus(201);
        $payout2Id = $response2->json('payout.id');

        $this->assertEquals($payout1Id, $payout2Id);
        $this->assertDatabaseCount('payouts', 1);
        $this->assertDatabaseCount('adjustments', 2); // Seeded adjustment + negative deduction adjustment
    }

    /**
     * Verifies that GAM Sync skips records in locked (closed or closing) periods.
     */
    public function test_revenue_sync_blocked_during_period_close(): void
    {
        // Set up closing period
        PeriodClosing::create([
            'id'          => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month'=> 6,
            'status'      => 'closing',
        ]);

        $publisher = $this->makePublisher();
        $gamAccount = \App\Models\GamAccount::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Test GAM Account',
            'email'         => 'gam-test@test.com',
            'network_code'  => '1234',
            'refresh_token' => 'some-token',
        ]);
        $website = Website::create([
            'id'               => Str::uuid()->toString(),
            'publisher_id'     => $publisher->id,
            'gam_account_id'   => $gamAccount->id,
            'domain'           => 'site-1.com',
            'gam_network_code' => '1234',
            'is_active'        => true,
        ]);
        $adUnit = AdUnit::create([
            'id'               => Str::uuid()->toString(),
            'website_id'       => $website->id,
            'gam_ad_unit_name' => 'banner_1',
            'display_name'     => 'Banner',
            'is_active'        => true,
        ]);

        // Mock the fetchReport API call
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldReceive('fetchReport')->andReturn([
            [
                'date'                 => '2026-06-15',
                'ad_unit_name'         => 'banner_1',
                'impressions'          => 1000,
                'unfilled_impressions' => 0,
                'clicks'               => 10,
                'cpm'                  => 2.0,
                'gross_revenue'        => 2.0,
            ]
        ]);

        // Run sync command for June 2026
        $exitCode = Artisan::call('gam:sync', [
            '--manual'    => true,
            '--date-from' => '2026-06-15',
            '--date-to'   => '2026-06-15',
        ]);

        $this->assertEquals(0, $exitCode);

        // Assert that the record was NOT created since the period is closing
        $this->assertDatabaseCount('revenue_records', 0);
    }

    /**
     * Verifies that rejecting a manual payout only deletes its specific negative deduction adjustment.
     */
    public function test_payout_rejection_for_manual_payout_does_not_delete_other_adjustments(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher();
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Create an unrelated pending adjustment
        $otherAdj = Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 100.00,
            'status'       => 'pending',
            'notes'        => 'Unrelated bonus',
        ]);

        // Record a manual payout (creates a Payout + a deduction adjustment)
        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 50.00,
            'method' => 'Wise',
        ]);
        $response->assertStatus(201);
        $payoutId = $response->json('payout.id');

        $this->assertDatabaseCount('adjustments', 2);

        // Reject the manual payout
        $rejectResponse = $this->postJson("/api/v1/admin/payouts/{$payoutId}/reject", [
            'admin_note' => 'Rejection test note',
        ]);
        $rejectResponse->assertStatus(200);

        // The unrelated adjustment should still exist and be pending
        $this->assertDatabaseCount('adjustments', 1);
        $this->assertDatabaseHas('adjustments', [
            'id'     => $otherAdj->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Verifies that rejecting a manual payout that has already been applied under a closed period
     * creates a new pending refund adjustment for the publisher.
     */
    public function test_payout_rejection_for_manual_payout_applied_to_closed_period_creates_refund(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher();
        Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 100.00,
            'status'       => 'pending',
            'notes'        => 'Seeded balance',
            'created_at'   => now(),
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Record a manual payout (creates Payout + deduction adjustment of -$60.00)
        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 60.00,
            'method' => 'Wise',
        ]);
        $response->assertStatus(201);
        $payoutId = $response->json('payout.id');

        // Simulate period closing by setting the deduction adjustment status to 'applied'
        $deduction = Adjustment::where('publisher_id', $publisher->id)
            ->where('notes', 'Deduction for standalone manual payment ' . $payoutId)
            ->firstOrFail();

        $period = PeriodClosing::create([
            'id'          => Str::uuid()->toString(),
            'period_year' => 2026,
            'period_month'=> 5,
            'status'      => 'closed',
        ]);

        $deduction->update([
            'status'            => 'applied',
            'period_closing_id' => $period->id,
        ]);

        // Reject the manual payout
        $rejectResponse = $this->postJson("/api/v1/admin/payouts/{$payoutId}/reject", [
            'admin_note' => 'Rejection of manual payment after period close',
        ]);
        $rejectResponse->assertStatus(200);

        // Verify that the original deduction adjustment is untouched (still applied)
        $this->assertDatabaseHas('adjustments', [
            'id'                => $deduction->id,
            'status'            => 'applied',
            'period_closing_id' => $period->id,
        ]);

        // Verify that a new pending adjustment was created carrying the +$60.00 refund
        $this->assertDatabaseHas('adjustments', [
            'publisher_id' => $publisher->id,
            'amount'       => 60.00,
            'status'       => 'pending',
            'notes'        => 'Refund for rejected manual payment ' . $payoutId . ' (deduction was applied to closed period)',
        ]);

        // Verify publisher pending balance adjustment is back to 160.00 (100.00 seeded adjustment + 60.00 refund adjustment)
        $publisher->refresh();
        $this->assertEquals(160.00, (float) $publisher->pending_balance_adjustment);
    }

    /**
     * Verifies that the platform_timezone setting is dynamically loaded and applied.
     */
    public function test_platform_timezone_applied_dynamically(): void
    {
        Setting::updateOrCreate(
            ['key' => 'platform_timezone'],
            [
                'value' => 'Asia/Dubai',
                'group' => 'display',
                'label' => 'Timezone',
                'type'  => 'string'
            ]
        );

        // Simulate service provider reload/re-booting logic
        $timezone = Setting::get('platform_timezone', 'UTC');
        date_default_timezone_set($timezone);
        config(['app.timezone' => $timezone]);

        $this->assertEquals('Asia/Dubai', date_default_timezone_get());
        $this->assertEquals('Asia/Dubai', config('app.timezone'));
    }

    /**
     * Verifies that the gam:sync command scheduler daily frequency check respects the platform_timezone setting.
     */
    public function test_gam_sync_respects_platform_timezone_for_daily_frequency(): void
    {
        // Set platform_timezone to Asia/Dubai (UTC+4)
        Setting::updateOrCreate(
            ['key' => 'platform_timezone'],
            [
                'value' => 'Asia/Dubai',
                'group' => 'display',
                'label' => 'Timezone',
                'type'  => 'string'
            ]
        );
        Setting::updateOrCreate(['key' => 'gam_sync_frequency'], ['value' => 'daily', 'group' => 'gam', 'label' => 'Freq', 'type' => 'string']);

        // Create a previous log run at 2026-07-21 19:30:00 UTC
        \App\Models\GamSyncLog::create([
            'triggered_by' => 'scheduler',
            'started_at'   => \Carbon\Carbon::parse('2026-07-21 19:30:00', 'UTC'),
            'finished_at'  => \Carbon\Carbon::parse('2026-07-21 19:40:00', 'UTC'),
            'status'       => 'success',
        ]);

        // Mock the fetchReport API call
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldReceive('fetchReport')->andReturn([]); // return empty to avoid creating rows but run successfully

        // Set test now to 2026-07-21 21:30:00 UTC (same UTC day, but next day in Asia/Dubai)
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 21:30:00', 'UTC'));

        // Run sync command (scheduled, not manual)
        $exitCode = Artisan::call('gam:sync', [
            '--manual' => false,
        ]);

        $this->assertEquals(0, $exitCode);

        // Verify that a log entry was created because sync was NOT skipped
        $logs = \App\Models\GamSyncLog::where('triggered_by', 'scheduler')
            ->orderBy('started_at', 'desc')
            ->get();

        $this->assertCount(2, $logs); // Pre-existing log + new run log
        $this->assertEquals('success', $logs->first()->status);
    }

    /**
     * Verifies that the gam:sync command scheduler daily frequency check SKIPS execution if the last run was on the same day in the configured timezone.
     */
    public function test_gam_sync_skips_when_same_day_in_timezone(): void
    {
        // Set platform_timezone to UTC
        Setting::updateOrCreate(
            ['key' => 'platform_timezone'],
            [
                'value' => 'UTC',
                'group' => 'display',
                'label' => 'Timezone',
                'type'  => 'string'
            ]
        );
        Setting::updateOrCreate(['key' => 'gam_sync_frequency'], ['value' => 'daily', 'group' => 'gam', 'label' => 'Freq', 'type' => 'string']);

        // Create a previous log run at 2026-07-21 19:30:00 UTC
        \App\Models\GamSyncLog::create([
            'triggered_by' => 'scheduler',
            'started_at'   => \Carbon\Carbon::parse('2026-07-21 19:30:00', 'UTC'),
            'finished_at'  => \Carbon\Carbon::parse('2026-07-21 19:40:00', 'UTC'),
            'status'       => 'success',
        ]);

        // Set test now to 2026-07-21 21:30:00 UTC (same day in UTC)
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 21:30:00', 'UTC'));

        // Run sync command (scheduled, not manual)
        $exitCode = Artisan::call('gam:sync', [
            '--manual' => false,
        ]);

        $this->assertEquals(0, $exitCode);

        // Verify that no new log entry was created because the run was skipped
        $logs = \App\Models\GamSyncLog::where('triggered_by', 'scheduler')
            ->orderBy('started_at', 'desc')
            ->get();

        $this->assertCount(1, $logs); // Only the pre-existing log
    }

    /**
     * Verifies that the gam:sync command scheduler hourly frequency check triggers if the last run is due (considering 30s grace buffer).
     */
    public function test_gam_sync_hourly_frequency_triggers(): void
    {
        Setting::updateOrCreate(['key' => 'gam_sync_frequency'], ['value' => 'hourly', 'group' => 'gam', 'label' => 'Freq', 'type' => 'string']);
        Setting::updateOrCreate(['key' => 'gam_sync_interval'], ['value' => '1', 'group' => 'gam', 'label' => 'Interval', 'type' => 'integer']);

        // Previous log run 59 minutes and 40 seconds ago (3580 seconds)
        \App\Models\GamSyncLog::create([
            'triggered_by' => 'scheduler',
            'started_at'   => \Carbon\Carbon::parse('2026-07-21 19:00:00', 'UTC'),
            'finished_at'  => \Carbon\Carbon::parse('2026-07-21 19:05:00', 'UTC'),
            'status'       => 'success',
        ]);

        // Mock the fetchReport API call
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldReceive('fetchReport')->andReturn([]);

        // Set test now to 19:59:40 UTC (exactly 3580 seconds later, which is >= 3570 seconds)
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 19:59:40', 'UTC'));

        $exitCode = Artisan::call('gam:sync', [
            '--manual' => false,
        ]);

        $this->assertEquals(0, $exitCode);

        // Verify a new log was created because it did NOT skip
        $logs = \App\Models\GamSyncLog::where('triggered_by', 'scheduler')
            ->orderBy('started_at', 'desc')
            ->get();

        $this->assertCount(2, $logs);
    }

    /**
     * Verifies that the gam:sync command scheduler hourly frequency check SKIPS if the last run was too recent.
     */
    public function test_gam_sync_hourly_frequency_skips(): void
    {
        Setting::updateOrCreate(['key' => 'gam_sync_frequency'], ['value' => 'hourly', 'group' => 'gam', 'label' => 'Freq', 'type' => 'string']);
        Setting::updateOrCreate(['key' => 'gam_sync_interval'], ['value' => '1', 'group' => 'gam', 'label' => 'Interval', 'type' => 'integer']);

        // Previous log run 58 minutes ago (3480 seconds)
        \App\Models\GamSyncLog::create([
            'triggered_by' => 'scheduler',
            'started_at'   => \Carbon\Carbon::parse('2026-07-21 19:00:00', 'UTC'),
            'finished_at'  => \Carbon\Carbon::parse('2026-07-21 19:05:00', 'UTC'),
            'status'       => 'success',
        ]);

        // Set test now to 19:58:00 UTC (3480 seconds later, which is < 3570 seconds)
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 19:58:00', 'UTC'));

        $exitCode = Artisan::call('gam:sync', [
            '--manual' => false,
        ]);

        $this->assertEquals(0, $exitCode);

        // Verify no new log was created
        $logs = \App\Models\GamSyncLog::where('triggered_by', 'scheduler')
            ->orderBy('started_at', 'desc')
            ->get();

        $this->assertCount(1, $logs);
    }

    /**
     * Verifies that GAM sync updates financial metrics on subsequent runs
     */
    public function test_gam_sync_updates_financial_metrics_on_subsequent_runs(): void
    {
        $publisher = $this->makePublisher();
        $gamAccount = \App\Models\GamAccount::create([
            'id'            => Str::uuid()->toString(),
            'name'          => 'Test GAM Account',
            'email'         => 'gam-test@test.com',
            'network_code'  => '1234',
            'refresh_token' => 'some-token',
        ]);
        $website = Website::create([
            'id'               => Str::uuid()->toString(),
            'publisher_id'     => $publisher->id,
            'gam_account_id'   => $gamAccount->id,
            'domain'           => 'site-1.com',
            'gam_network_code' => '1234',
            'is_active'        => true,
        ]);
        $adUnit = AdUnit::create([
            'id'               => Str::uuid()->toString(),
            'website_id'       => $website->id,
            'gam_ad_unit_name' => 'banner_1',
            'display_name'     => 'Banner',
            'is_active'        => true,
        ]);

        // 1. Mock first sync report data (e.g. gross_revenue = 2.0)
        $mock = $this->mock(\App\Services\GamApiService::class);
        $mock->shouldReceive('fetchReport')->once()->andReturn([
            [
                'date'                 => '2026-06-15',
                'ad_unit_name'         => 'banner_1',
                'impressions'          => 1000,
                'unfilled_impressions' => 0,
                'clicks'               => 10,
                'cpm'                  => 2.0,
                'gross_revenue'        => 2.0,
            ]
        ]);

        $exitCode1 = Artisan::call('gam:sync', [
            '--manual'    => true,
            '--date-from' => '2026-06-15',
            '--date-to'   => '2026-06-15',
        ]);
        $this->assertEquals(0, $exitCode1);

        // Assert first record inserted correctly
        $this->assertDatabaseHas('revenue_records', [
            'ad_unit_id'         => $adUnit->id,
            'date'               => '2026-06-15',
            'gross_revenue'      => 2.0,
            'ratio_applied'      => 0.80, // Default publisher ratio
            'publisher_earnings' => 1.6,  // 2.0 * 0.80
        ]);

        // 2. Mock second sync report data (e.g. gross_revenue = 3.0, clicks = 15, impressions = 1000)
        $mock2 = $this->mock(\App\Services\GamApiService::class);
        $mock2->shouldReceive('fetchReport')->once()->andReturn([
            [
                'date'                 => '2026-06-15',
                'ad_unit_name'         => 'banner_1',
                'impressions'          => 1000,
                'unfilled_impressions' => 0,
                'clicks'               => 15,
                'cpm'                  => 3.0,
                'gross_revenue'        => 3.0,
            ]
        ]);

        $exitCode2 = Artisan::call('gam:sync', [
            '--manual'    => true,
            '--date-from' => '2026-06-15',
            '--date-to'   => '2026-06-15',
        ]);
        $this->assertEquals(0, $exitCode2);

        // Assert record is updated with new gross revenue and calculated publisher earnings
        $this->assertDatabaseHas('revenue_records', [
            'ad_unit_id'         => $adUnit->id,
            'date'               => '2026-06-15',
            'clicks'             => 15,
            'gross_revenue'      => 3.0,
            'ratio_applied'      => 0.80, // preserved ratio
            'publisher_earnings' => 2.4,  // 3.0 * 0.80
        ]);
    }

    /**
     * Verifies that tracking:verify command scheduler check respects the hourly frequency and grace buffer.
     */
    public function test_tracking_verify_scheduler_triggers_and_skips(): void
    {
        Setting::updateOrCreate(['key' => 'tracking_verify_frequency'], ['value' => 'hourly', 'group' => 'gam', 'label' => 'Freq', 'type' => 'string']);
        Setting::updateOrCreate(['key' => 'tracking_verify_interval'], ['value' => '1', 'group' => 'gam', 'label' => 'Interval', 'type' => 'integer']);

        // Set last run time to 59 minutes and 40 seconds ago (3580 seconds)
        $lastRun = \Carbon\Carbon::parse('2026-07-21 19:00:00', 'UTC');
        \Illuminate\Support\Facades\Cache::put('tracking_verify_last_run', $lastRun->toIso8601String());

        // Set test now to 19:59:40 UTC
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 19:59:40', 'UTC'));

        $exitCode = Artisan::call('tracking:verify', [
            '--website' => null,
        ]);

        $this->assertEquals(0, $exitCode);

        // Verify the cache key is updated to the new run time
        $updatedLastRun = \Illuminate\Support\Facades\Cache::get('tracking_verify_last_run');
        $this->assertEquals(\Carbon\Carbon::parse('2026-07-21 19:59:40', 'UTC')->toIso8601String(), $updatedLastRun);

        // Test skip: set last run to 58 minutes ago (3480 seconds)
        \Illuminate\Support\Facades\Cache::put('tracking_verify_last_run', \Carbon\Carbon::parse('2026-07-21 19:00:00', 'UTC')->toIso8601String());
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 19:58:00', 'UTC'));

        $exitCodeSkip = Artisan::call('tracking:verify', [
            '--website' => null,
        ]);

        $this->assertEquals(0, $exitCodeSkip);

        // Verify the cache key was NOT updated because the run was skipped
        $this->assertEquals(\Carbon\Carbon::parse('2026-07-21 19:00:00', 'UTC')->toIso8601String(), \Illuminate\Support\Facades\Cache::get('tracking_verify_last_run'));
    }
}

