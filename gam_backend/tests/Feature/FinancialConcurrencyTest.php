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
        $this->assertDatabaseCount('adjustments', 1); // One negative deduction adjustment only
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
        $website = Website::create([
            'id'               => Str::uuid()->toString(),
            'publisher_id'     => $publisher->id,
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
            'amount'       => 20.00,
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

        // Verify publisher pending balance adjustment is back to 60.00
        $publisher->refresh();
        $this->assertEquals(60.00, (float) $publisher->pending_balance_adjustment);
    }
}
