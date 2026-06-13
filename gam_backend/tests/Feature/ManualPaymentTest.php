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
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * REFACTOR [MPAY-1]: Full test suite verifying that Manual Payments and Period Closing
 * are completely independent. Every test in this file verifies a specific guarantee
 * documented in ManualPaymentService and the hardened createPayout() endpoint.
 */
class ManualPaymentTest extends TestCase
{
    use RefreshDatabase;

    // ─── Shared test helpers ─────────────────────────────────────────────────

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

    private function makeClosedPeriod(int $year, int $month): PeriodClosing
    {
        return PeriodClosing::create([
            'id'           => Str::uuid()->toString(),
            'period_year'  => $year,
            'period_month' => $month,
            'status'       => 'closed',
            'closed_at'    => now(),
            'notes'        => 'Test period closing',
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

    // ─── Test 1 ──────────────────────────────────────────────────────────────

    /**
     * Manual Payment must NEVER create a PeriodClosing record.
     */
    public function test_manual_payment_does_not_create_period_closing(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher();
        Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 100.00,
            'notes'        => 'Seeded balance',
            'status'       => 'pending',
            'created_at'   => now(),
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $this->assertDatabaseCount('period_closings', 0);

        $this->withoutExceptionHandling();

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 50.00,
            'method' => 'Bank Transfer',
            'reference' => 'TX-001',
            'notes' => 'Test manual payment',
        ]);

        $response->assertStatus(201);

        // CRITICAL: no PeriodClosing should exist
        $this->assertDatabaseCount('period_closings', 0);
    }

    // ─── Test 2 ──────────────────────────────────────────────────────────────

    /**
     * Manual Payment must NEVER lock revenue records.
     */
    public function test_manual_payment_does_not_lock_revenue_records(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-15 12:00:00'));

        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher('pub2@test.com');
        $rev       = $this->makeRevenue($publisher, '2026-06-15', 100.00);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 75.00,
            'method' => 'Wise',
        ]);

        $response->assertStatus(201);

        // Revenue record must remain unlocked (period_closing_id = null)
        $rev->refresh();
        $this->assertNull($rev->period_closing_id, 'Revenue record should NOT be locked by a manual payment.');
    }

    // ─── Test 3 ──────────────────────────────────────────────────────────────

    /**
     * Manual Payment must NEVER apply or create Adjustment records.
     */
    public function test_manual_payment_does_not_touch_adjustments(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher('pub3@test.com');

        // Create a pending adjustment
        $adj = Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 100.00,
            'notes'        => 'Pre-existing bonus',
            'status'       => 'pending',
            'created_at'   => now(),
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 50.00,
            'method' => 'PayPal',
        ]);

        $response->assertStatus(201);

        // Adjustment must remain pending and unchanged
        $adj->refresh();
        $this->assertEquals('pending', $adj->status, 'Adjustment status must not be changed by a manual payment.');
        $this->assertNull($adj->period_closing_id, 'Adjustment period_closing_id must not be set by a manual payment.');

        // Total adjustments count should be 2 (the pre-existing one + the new deduction adjustment)
        $this->assertDatabaseCount('adjustments', 2);
    }

    // ─── Test 4 ──────────────────────────────────────────────────────────────

    /**
     * Manual Payment for Publisher A must NOT affect Publisher B's records.
     */
    public function test_manual_payment_does_not_affect_other_publishers(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-15 12:00:00'));

        $admin  = $this->makeAdmin();
        $pubA   = $this->makePublisher('puba@test.com');
        Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $pubA->id,
            'amount'       => 100.00,
            'notes'        => 'Seeded balance A',
            'status'       => 'pending',
            'created_at'   => now(),
        ]);
        $pubB   = $this->makePublisher('pubb@test.com');
        $revB   = $this->makeRevenue($pubB, '2026-06-15', 100.00);
        $adjB   = Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $pubB->id,
            'amount'       => 20.00,
            'notes'        => 'Publisher B bonus',
            'status'       => 'pending',
            'created_at'   => now(),
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Pay Publisher A
        $response = $this->postJson("/api/v1/admin/publishers/{$pubA->id}/manual-payment", [
            'amount' => 99.00,
            'method' => 'Crypto',
        ]);
        $response->assertStatus(201);

        // Publisher B's records must be completely untouched
        $revB->refresh();
        $this->assertNull($revB->period_closing_id, 'Publisher B revenue must not be locked.');

        $adjB->refresh();
        $this->assertEquals('pending', $adjB->status, 'Publisher B adjustment must remain pending.');
        $this->assertNull($adjB->period_closing_id);

        $this->assertDatabaseCount('period_closings', 0);
    }

    // ─── Test 5 ──────────────────────────────────────────────────────────────

    /**
     * Manual Payment creates a Payout record with is_manual_payment = true
     * and period_closing_id = null.
     */
    public function test_manual_payment_creates_correct_payout_record(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher('pub5@test.com');
        Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 200.00,
            'notes'        => 'Seeded balance 5',
            'status'       => 'pending',
            'created_at'   => now(),
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount'    => 123.45,
            'method'    => 'Wise',
            'reference' => 'WISE-TX-12345',
            'notes'     => 'Q2 manual payment',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('message', 'Manual payment recorded successfully.');

        // Verify the payout record in the database
        $this->assertDatabaseHas('payouts', [
            'publisher_id'      => $publisher->id,
            'period_closing_id' => null,
            'final_amount'      => 123.45,
            'payment_method'    => 'Wise',
            'payment_reference' => 'WISE-TX-12345',
            'status'            => 'pending',
            'is_manual_payment' => 1,
            'manual_paid_by'    => $admin->id,
        ]);
    }

    // ─── Test 6 ──────────────────────────────────────────────────────────────

    /**
     * When a valid payout_id is provided, the linked payout's status is updated to 'paid'
     * without any Period Closing side effects.
     */
    public function test_manual_payment_optionally_links_existing_payout(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher('pub6@test.com');
        $period    = $this->makeClosedPeriod(2026, 5);

        // Create a pending period payout
        $payout = Payout::create([
            'id'                => Str::uuid()->toString(),
            'publisher_id'      => $publisher->id,
            'period_closing_id' => $period->id,
            'period_year'       => 2026,
            'period_month'      => 5,
            'amount'            => 80.00,
            'adjustment'        => 0,
            'final_amount'      => 80.00,
            'status'            => 'approved',
            'payment_method'    => 'Wise',
            'is_manual_payment' => false,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount'    => 80.00,
            'method'    => 'Wise',
            'reference' => 'WISE-TX-LINKED-001',
            'notes'     => 'Paying the approved payout',
            'payout_id' => $payout->id,
        ]);

        $response->assertStatus(201);

        // The linked payout status must now be 'paid'
        $payout->refresh();
        $this->assertEquals('paid', $payout->status);
        $this->assertEquals('WISE-TX-LINKED-001', $payout->payment_reference);

        // A new manual payment payout record was also created
        $this->assertDatabaseHas('payouts', [
            'publisher_id'      => $publisher->id,
            'period_closing_id' => null,
            'is_manual_payment' => 1,
            'status'            => 'pending',
        ]);

        // PeriodClosing must remain untouched
        $period->refresh();
        $this->assertEquals('closed', $period->status);
    }

    // ─── Test 7 ──────────────────────────────────────────────────────────────

    /**
     * Period close must still generate pending payouts correctly after a manual payment
     * was recorded — the two workflows must not interfere.
     */
    public function test_period_close_generates_payouts_independently_of_manual_payments(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-21 12:00:00'));

        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher('pub7@test.com');
        $rev       = $this->makeRevenue($publisher, '2026-06-15', 100.00);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Record a standalone manual payment FIRST — must not affect the period close
        $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 30.00,
            'method' => 'Bank Transfer',
        ])->assertStatus(201);

        // Revenue record must still be unlocked
        $rev->refresh();
        $this->assertNull($rev->period_closing_id);

        // Now run the period close
        $exitCode = Artisan::call('period:auto-close', [
            '--force-year'  => 2026,
            '--force-month' => 6,
        ]);
        $this->assertEquals(0, $exitCode);

        // A real PeriodClosing should now exist
        $closing = PeriodClosing::where('period_year', 2026)->where('period_month', 6)->first();
        $this->assertNotNull($closing);
        $this->assertEquals('closed', $closing->status);

        // A real pending Payout should exist linked to the closing
        $periodPayout = Payout::where('publisher_id', $publisher->id)
            ->where('period_closing_id', $closing->id)
            ->where('is_manual_payment', false)
            ->first();
        $this->assertNotNull($periodPayout);
        $this->assertEquals(70.00, (float) $periodPayout->final_amount);
        $this->assertEquals('pending', $periodPayout->status);

        // The manual payment Payout must still exist independently
        $manualPayout = Payout::where('publisher_id', $publisher->id)
            ->whereNull('period_closing_id')
            ->where('is_manual_payment', true)
            ->first();
        $this->assertNotNull($manualPayout);
        $this->assertEquals(30.00, (float) $manualPayout->final_amount);

        // Revenue record must now be locked by the period close
        $rev->refresh();
        $this->assertEquals($closing->id, $rev->period_closing_id);
    }

    // ─── Test 8 ──────────────────────────────────────────────────────────────

    /**
     * Hardened create-payout must return 422 if no PeriodClosing exists for the target month.
     */
    public function test_create_payout_requires_existing_closed_period_closing(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-15 12:00:00'));

        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher('pub8@test.com');

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // No PeriodClosing exists for 2026-05
        $this->assertDatabaseCount('period_closings', 0);

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year'  => 2026,
            'period_month' => 5,
            'amount'       => 50.00,
        ]);

        // Must be rejected with 422 — NOT silently create a period
        $response->assertStatus(422);
        $response->assertJsonPath('message', fn($msg) => str_contains($msg, 'No closed PeriodClosing found'));

        // No PeriodClosing should exist
        $this->assertDatabaseCount('period_closings', 0);
        $this->assertDatabaseCount('payouts', 0);
    }

    // ─── Test 9 ──────────────────────────────────────────────────────────────

    /**
     * Hardened create-payout must NOT lock revenue records when creating a payout.
     */
    public function test_create_payout_does_not_lock_revenue_records(): void
    {
        \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-07-15 12:00:00'));

        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher('pub9@test.com');
        $period    = $this->makeClosedPeriod(2026, 5);

        // Lock some revenue to this period to simulate earnings
        $rev = $this->makeRevenue($publisher, '2026-05-10', 80.00);
        $rev->update(['period_closing_id' => $period->id]);

        // Create some revenue that is still open (should remain unlocked)
        $openRev = $this->makeRevenue($publisher, '2026-06-10', 40.00);
        $this->assertNull($openRev->period_closing_id);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/create-payout", [
            'period_year'  => 2026,
            'period_month' => 5,
            'amount'       => 50.00,
            'admin_note'   => 'Admin override payout',
        ]);

        $response->assertStatus(200);

        // Open revenue must remain unlocked (create-payout must NOT lock it)
        $openRev->refresh();
        $this->assertNull($openRev->period_closing_id, 'create-payout must NOT lock open revenue records.');

        // No adjustments should have been created
        $this->assertDatabaseCount('adjustments', 0);

        // The payout should be linked to the existing period
        $this->assertDatabaseHas('payouts', [
            'publisher_id'      => $publisher->id,
            'period_closing_id' => $period->id,
            'is_manual_payment' => 0,
            'status'            => 'pending',
        ]);
    }

    /**
     * Standalone manual payment fails if amount exceeds publisher's approved balance.
     */
    public function test_standalone_manual_payment_fails_if_exceeds_approved_balance(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher();

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Give them 10.00 approved balance via adjustment
        Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 10.00,
            'notes'        => 'Small bonus',
            'status'       => 'pending',
            'created_at'   => now(),
        ]);

        // Try paying 50.00 (which exceeds 10.00)
        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 50.00,
            'method' => 'Wise',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Payout amount [$50.00] cannot exceed approved balance [$10.00].');
    }

    /**
     * Standalone manual payment fails if approved balance is zero or less.
     */
    public function test_standalone_manual_payment_fails_if_balance_is_zero(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher();

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Approved balance is 0.00
        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 10.00,
            'method' => 'Wise',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Publisher has no approved balance to payout.');
    }

    /**
     * Cannot directly delete a manual payment adjustment if the payout is still active.
     */
    public function test_cannot_delete_adjustment_linked_to_active_manual_payout(): void
    {
        $admin     = $this->makeAdmin();
        $publisher = $this->makePublisher();

        // Give publisher some balance first so they can request manual payment
        Adjustment::forceCreate([
            'id'           => Str::uuid()->toString(),
            'publisher_id' => $publisher->id,
            'amount'       => 100.00,
            'notes'        => 'Seeded balance',
            'status'       => 'pending',
            'created_at'   => now(),
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        // Create standalone manual payment
        $response = $this->postJson("/api/v1/admin/publishers/{$publisher->id}/manual-payment", [
            'amount' => 50.00,
            'method' => 'Wise',
        ]);
        $response->assertStatus(201);
        $payoutId = $response->json('payout.id');

        // Locate the created adjustment
        $adjustment = Adjustment::where('publisher_id', $publisher->id)
            ->where('notes', 'Deduction for standalone manual payment ' . $payoutId)
            ->firstOrFail();

        // Trying to delete this adjustment directly should fail with 400
        $deleteResponse = $this->deleteJson("/api/v1/admin/adjustments/{$adjustment->id}");
        $deleteResponse->assertStatus(400);
        $deleteResponse->assertJsonPath('message', fn($msg) => str_contains($msg, 'linked to a manual payout that is currently pending'));

        // If the payout is rejected, the adjustment is automatically deleted/handled via the reject workflow
        $rejectResponse = $this->postJson("/api/v1/admin/payouts/{$payoutId}/reject", [
            'admin_note' => 'Rejecting manual payout',
        ]);
        $rejectResponse->assertStatus(200);

        // Verify the adjustment is gone (deleted via the reject workflow)
        $this->assertDatabaseMissing('adjustments', ['id' => $adjustment->id]);
    }
}
