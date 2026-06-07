<?php

namespace App\Console\Commands;

use App\Models\Adjustment;
use App\Models\PeriodClosing;
use App\Models\Payout;
use App\Models\RevenueRecord;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * FIX [PC-2]: Recovery command for PeriodClosing records stuck in 'closing' state.
 *
 * When the period:auto-close process dies mid-loop (e.g., PHP killed, DB timeout,
 * server crash), the PeriodClosing record stays in 'closing' status permanently.
 * Re-running period:auto-close won't help because it finds the existing record
 * and exits early.
 *
 * This command provides two recovery modes:
 *   --abort: Roll back the partial closing (unlock records, delete payouts, delete PeriodClosing)
 *   --complete: Finalize the closing by re-running the missing steps
 *
 * Usage:
 *   php artisan period:recover --year=2026 --month=5 --abort
 *   php artisan period:recover --year=2026 --month=5 --complete
 */
class PeriodClosingRecover extends Command
{
    protected $signature = 'period:recover
        {--year= : The year of the stuck period (e.g. 2026)}
        {--month= : The month of the stuck period (1-12)}
        {--abort : Abort the stuck closing — unlock all records, delete partial payouts}
        {--complete : Complete the stuck closing — finalize it as closed}
        {--list : List all periods currently in closing state}';

    protected $description = 'Recover a PeriodClosing record stuck in "closing" status.';

    public function handle(): int
    {
        // List mode
        if ($this->option('list')) {
            $stuckPeriods = PeriodClosing::where('status', 'closing')->get();
            if ($stuckPeriods->isEmpty()) {
                $this->info('No periods are currently stuck in "closing" status. ✓');
                return 0;
            }
            $this->warn("Found {$stuckPeriods->count()} stuck period(s):");
            $this->table(
                ['ID', 'Year', 'Month', 'Created At'],
                $stuckPeriods->map(fn($p) => [$p->id, $p->period_year, $p->period_month, $p->created_at])
            );
            return 0;
        }

        // Require year and month
        $year  = $this->option('year');
        $month = $this->option('month');

        if (!$year || !$month) {
            $this->error('Please provide --year and --month options.');
            return 1;
        }

        $year  = (int) $year;
        $month = (int) $month;

        $closing = PeriodClosing::where('period_year', $year)
            ->where('period_month', $month)
            ->first();

        if (!$closing) {
            $this->error("No PeriodClosing found for {$year}-{$month}.");
            return 1;
        }

        if ($closing->status !== 'closing') {
            $this->info("Period {$year}-{$month} is in status '{$closing->status}' — not stuck. No action needed.");
            return 0;
        }

        // Mode: abort
        if ($this->option('abort')) {
            return $this->abortClosing($closing, $year, $month);
        }

        // Mode: complete
        if ($this->option('complete')) {
            return $this->completeClosing($closing, $year, $month);
        }

        $this->error('Please specify --abort or --complete.');
        return 1;
    }

    /**
     * Roll back a stuck closing: unlock records, delete partial payouts, delete PeriodClosing.
     */
    private function abortClosing(PeriodClosing $closing, int $year, int $month): int
    {
        $this->warn("Aborting stuck closing for {$year}-{$month} (ID: {$closing->id})...");

        if (!$this->confirm("This will UNLOCK all revenue records and DELETE all partial payouts for {$year}-{$month}. Continue?")) {
            $this->info('Aborted by user.');
            return 0;
        }

        DB::beginTransaction();
        try {
            // Delete carry-over adjustments created in this closing
            $deletedAdj = Adjustment::where('period_closing_id', $closing->id)
                ->where('status', 'pending')
                ->delete();

            // Reset applied adjustments back to pending
            $resetAdj = Adjustment::where('period_closing_id', $closing->id)
                ->where('status', 'applied')
                ->update(['status' => 'pending', 'period_closing_id' => null]);

            // Delete partial payouts
            $deletedPayouts = Payout::where('period_closing_id', $closing->id)->delete();

            // Unlock revenue records
            $unlocked = RevenueRecord::where('period_closing_id', $closing->id)
                ->update(['period_closing_id' => null]);

            // Delete the stuck PeriodClosing
            $closing->delete();

            DB::commit();

            \App\Services\AuditLogService::log(
                'period_closing_aborted',
                'PeriodClosing',
                $closing->id,
                $closing->toArray(),
                ['action' => 'abort', 'records_unlocked' => $unlocked, 'payouts_deleted' => $deletedPayouts]
            );

            $this->info("✓ Abort complete for {$year}-{$month}:");
            $this->table(
                ['Records Unlocked', 'Payouts Deleted', 'Adjustments Reset', 'Adj Carry-overs Deleted'],
                [[$unlocked, $deletedPayouts, $resetAdj, $deletedAdj]]
            );

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Abort failed: " . $e->getMessage());
            return 1;
        }
    }

    /**
     * Complete a stuck closing: finalize status to 'closed' with current aggregate totals.
     * This is for cases where all publishers processed correctly but the final status
     * update failed.
     */
    private function completeClosing(PeriodClosing $closing, int $year, int $month): int
    {
        $this->info("Completing stuck closing for {$year}-{$month} (ID: {$closing->id})...");

        DB::beginTransaction();
        try {
            // Recalculate totals from the already-locked revenue records
            $stats = RevenueRecord::where('period_closing_id', $closing->id)
                ->select(
                    DB::raw('SUM(gross_revenue) as total_gross'),
                    DB::raw('SUM(publisher_earnings) as total_earnings'),
                    DB::raw('SUM(impressions) as total_impressions')
                )
                ->first();

            $closing->update([
                'total_gross_revenue'      => (float) ($stats->total_gross ?? 0),
                'total_publisher_earnings' => (float) ($stats->total_earnings ?? 0),
                'total_impressions'        => (int) ($stats->total_impressions ?? 0),
                'status'                   => 'closed',
                'closed_at'                => now(),
            ]);

            DB::commit();

            \App\Services\AuditLogService::log(
                'period_closing_recovered',
                'PeriodClosing',
                $closing->id,
                ['status' => 'closing'],
                ['status' => 'closed', 'action' => 'force-complete']
            );

            $this->info("✓ Period {$year}-{$month} has been marked as 'closed' successfully.");
            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Complete failed: " . $e->getMessage());
            return 1;
        }
    }
}
