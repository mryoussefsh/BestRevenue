<?php

namespace App\Console\Commands;

use App\Models\AdUnit;
use App\Models\GamSyncLog;
use App\Models\PeriodClosing;
use App\Models\RevenueRecord;
use App\Models\Setting;
use App\Services\RatioService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GamSync extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gam:sync
        {--manual : Indicates if this was triggered manually}
        {--days= : Override days back to sync}
        {--date-from= : Start of date range YYYY-MM-DD}
        {--date-to= : End of date range YYYY-MM-DD}
        {--publisher-id= : Limit sync to a specific publisher UUID}
        {--gam-account-id= : Limit sync to a specific GAM account UUID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch reports from GAM and update revenue records';

    protected RatioService $ratioService;

    public function __construct(RatioService $ratioService)
    {
        parent::__construct();
        $this->ratioService = $ratioService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isManual        = $this->option('manual');
        $dateFrom        = $this->option('date-from');
        $dateTo          = $this->option('date-to');
        $filterPublisher = $this->option('publisher-id');
        $filterAccount   = $this->option('gam-account-id');
        $timezone        = Setting::get('gam_timezone', 'UTC');

        // Resolve daysBack — prefer explicit date range, then --days, then setting
        if ($dateFrom) {
            $daysBack = abs((int) now()->diffInDays(Carbon::parse($dateFrom))) + 1;
        } else {
            $daysBack = $this->option('days') ?: Setting::get('gam_sync_days_back', 3);
        }

        // Resolve date bounds for row filtering
        $filterDateFrom = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
        $filterDateTo   = $dateTo   ? Carbon::parse($dateTo)->endOfDay()     : null;

        // Create log entry
        $syncLog = new GamSyncLog();
        $syncLog->triggered_by = $isManual ? 'manual' : 'scheduler';
        $syncLog->started_at   = now();
        $syncLog->status       = 'running';
        $syncLog->save();

        $rangeDesc = $dateFrom
            ? "from {$dateFrom} to " . ($dateTo ?? 'today')
            : "{$daysBack} days back";
        $this->info("Starting GAM Sync ({$rangeDesc}, Timezone: {$timezone})");

        try {
            $gamApiService = new \App\Services\GamApiService();

            // If a specific GAM account is requested, only process that one
            $gamAccountsQuery = \App\Models\GamAccount::query();
            if ($filterAccount) {
                $gamAccountsQuery->where('id', $filterAccount);
            }
            $gamAccounts = $gamAccountsQuery->get();

        $rowsFetched = 0;
        $rowsMatched = 0;
        $rowsSkipped = 0;
        $rowsLocked  = 0;
        $hasErrors   = false;

        // FIX [GS-3]: Auto-expire stale 'running' sync logs older than 2 hours.
        // If a previous sync was killed mid-run, its log stays as 'running' forever.
        // This cleanup prevents false monitoring data and allows operators to detect real failures.
        GamSyncLog::where('status', 'running')
            ->where('started_at', '<', now()->subHours(2))
            ->update([
                'status'        => 'failed',
                'finished_at'   => now(),
                'error_message' => 'Auto-expired: sync log was in running state for over 2 hours (process likely died).',
            ]);

        // FIX [GS-1]: DO NOT pre-load closedPeriods here. Instead, reload them fresh
        // before each batch upsert to avoid stale data when a period closes mid-sync.
        // See: $closedPeriods reload inside the batch flush section below.

        // Preload all ad units with relationships (once per sync run)
        $allAdUnits = AdUnit::with('website.publisher', 'website.gamAccount')->get();

        $upsertBatch = [];
        $batchSize = 1000;

        // FIX [GS-1]: Load closedPeriods initially. Refreshed before each batch flush.
        $closedPeriods = PeriodClosing::where('status', 'closed')
            ->get(['period_year', 'period_month'])
            ->map(fn($p) => "{$p->period_year}-{$p->period_month}")
            ->toArray();

        foreach ($gamAccounts as $account) {
                if (!$account->refresh_token || !$account->network_code) {
                    $this->warn("Skipping GAM Account {$account->email} (Missing token or network code).");
                    continue;
                }

                // Skip accounts that have no active ad units registered in BestRevenue
                $registeredCount = \App\Models\AdUnit::whereHas('website', fn($q) => $q->where('gam_account_id', $account->id))
                    ->where('is_active', true)
                    ->count();

                if ($registeredCount === 0) {
                    $this->warn("Skipping GAM Account {$account->email} (No active ad units registered — add ad units first).");
                    continue;
                }

                $this->info("Fetching report for {$account->email} ({$registeredCount} registered ad unit(s))...");

                try {
                    $reportData = $gamApiService->fetchReport($account, $daysBack);
                    $rowsFetched += count($reportData);

                    foreach ($reportData as $row) {
                        // Filter by date range if specified
                        if ($filterDateFrom || $filterDateTo) {
                            $rowDate = Carbon::parse($row['date']);
                            if ($filterDateFrom && $rowDate->lt($filterDateFrom)) { $rowsSkipped++; continue; }
                            if ($filterDateTo   && $rowDate->gt($filterDateTo))   { $rowsSkipped++; continue; }
                        }

                        // 1. Find matching Ad Unit from preloaded collection
                        $adUnit = $allAdUnits->first(function ($u) use ($account, $filterPublisher, $row) {
                            if ($u->gam_ad_unit_name !== $row['ad_unit_name']) return false;
                            if ($u->website->gam_account_id !== $account->id) return false;
                            if ($filterPublisher && $u->website->publisher_id !== $filterPublisher) return false;
                            return true;
                        });

                        if (!$adUnit) {
                            $rowsSkipped++;
                            continue;
                        }

                        $rowsMatched++;

                        // 2. Check if period is closed
                        $date = Carbon::parse($row['date']);
                        if (in_array("{$date->year}-{$date->month}", $closedPeriods)) {
                            $rowsLocked++;
                            continue; // Skip updating closed periods
                        }

                        // 3. Resolve Ratio
                        $ratio = $this->ratioService->resolveRatio($adUnit);

                        // 4. Calculate Earnings
                        $grossRevenue = $row['gross_revenue'];
                        $publisherEarnings = $grossRevenue * $ratio;

                        $ctr = $row['impressions'] > 0 ? ($row['clicks'] / $row['impressions']) : 0;
                        $publisherCpm = $row['impressions'] > 0 ? ($publisherEarnings / $row['impressions'] * 1000) : 0;

                        // 5. Add to batch
                        $upsertBatch[] = [
                            'id'                   => Str::uuid()->toString(),
                            'ad_unit_id'           => $adUnit->id,
                            'date'                 => $row['date'],
                            'hour'                 => 0,
                            'impressions'          => $row['impressions'],
                            'unfilled_impressions' => $row['unfilled_impressions'],
                            'clicks'               => $row['clicks'],
                            'ctr'                  => $ctr,
                            'cpm'                  => $row['cpm'], // Real GAM eCPM
                            'gross_revenue'        => $grossRevenue,
                            'ratio_applied'        => $ratio,
                            'publisher_earnings'   => $publisherEarnings,
                            'publisher_cpm'        => $publisherCpm,
                            'synced_at'            => now(),
                        ];

                        if (count($upsertBatch) >= $batchSize) {
                            // Reload closed periods before each batch flush to catch concurrent closings
                            $closedPeriods = PeriodClosing::where('status', 'closed')
                                ->get(['period_year', 'period_month'])
                                ->map(fn($p) => "{$p->period_year}-{$p->period_month}")
                                ->toArray();

                            $upsertBatch = array_filter($upsertBatch, function ($record) use ($closedPeriods, &$rowsLocked) {
                                $date = Carbon::parse($record['date']);
                                $periodKey = "{$date->year}-{$date->month}";
                                if (in_array($periodKey, $closedPeriods)) {
                                    $rowsLocked++;
                                    return false;
                                }
                                return true;
                            });
                            $upsertBatch = array_values($upsertBatch);

                            if (!empty($upsertBatch)) {
                                $this->flushBatch($upsertBatch);
                            }
                            $upsertBatch = [];
                        }
                    }
                } catch (\Exception $e) {
                    $errorMsg = "Failed to fetch for {$account->email}: " . $e->getMessage();
                    $this->error($errorMsg);
                    $hasErrors = true; // FIX [GS-6]: Track per-account errors for partial status

                    // Append error to log
                    $syncLog->error_message = $syncLog->error_message
                        ? $syncLog->error_message . "\n" . $errorMsg
                        : $errorMsg;
                }
            }

            // Flush remaining upserts
            if (!empty($upsertBatch)) {
                // FIX [GS-1]: Reload closed periods one final time before the last flush
                // to catch any period closings that occurred during this sync run.
                $closedPeriods = PeriodClosing::where('status', 'closed')
                    ->get(['period_year', 'period_month'])
                    ->map(fn($p) => "{$p->period_year}-{$p->period_month}")
                    ->toArray();

                // Filter out any records that fell into a newly-closed period
                $upsertBatch = array_filter($upsertBatch, function ($record) use ($closedPeriods, &$rowsLocked) {
                    $date = Carbon::parse($record['date']);
                    $periodKey = "{$date->year}-{$date->month}";
                    if (in_array($periodKey, $closedPeriods)) {
                        $rowsLocked++;
                        return false;
                    }
                    return true;
                });
                $upsertBatch = array_values($upsertBatch);

                if (!empty($upsertBatch)) {
                    $this->flushBatch($upsertBatch);
                }
            }

            // FIX [GS-6]: Set status to 'partial' if per-account errors occurred, not 'success'
            $syncLog->finished_at = now();
            $syncLog->status      = $hasErrors ? 'partial' : 'success';
            $syncLog->rows_fetched = $rowsFetched;
            $syncLog->rows_matched = $rowsMatched;
            $syncLog->rows_skipped = $rowsSkipped;
            $syncLog->rows_locked  = $rowsLocked;
            $syncLog->save();

            $this->info("GAM Sync Completed" . ($hasErrors ? " with partial errors!" : " Successfully!"));
            $this->table(
                ['Fetched', 'Matched', 'Skipped', 'Locked', 'Status'],
                [[$rowsFetched, $rowsMatched, $rowsSkipped, $rowsLocked, $syncLog->status]]
            );

            return 0;

        } catch (\Exception $e) {
            $syncLog->finished_at = now();
            $syncLog->status = 'failed';
            $syncLog->error_message = $e->getMessage();
            $syncLog->save();

            $this->error("GAM Sync Failed: " . $e->getMessage());

            return 1;
        }
    }

    /**
     * FIX [GS-1, RAT-1]: Two-step batch flush that protects locked and historically-priced records.
     *
     * Step 1 — INSERT new rows (with full financial data) and update TRAFFIC-ONLY columns on
     *           existing rows. This is safe because traffic data (impressions, clicks, ctr, cpm)
     *           can always be refreshed from GAM without affecting financial integrity.
     *
     * Step 2 — For rows that are genuinely NEW (period_closing_id IS NULL AND ratio_applied = 0),
     *           also update the financial columns (gross_revenue, ratio_applied, publisher_earnings,
     *           publisher_cpm). This handles the case where GAM corrects revenue for a past date
     *           that has not yet been financially processed.
     *
     * Rows with period_closing_id IS NOT NULL are never touched (they are locked).
     * Rows with ratio_applied > 0 keep their original ratio (historical ratio preserved).
     *
     * @param array $batch Rows to upsert — must already be filtered (no closed-period rows)
     */
    private function flushBatch(array $batch): void
    {
        if (empty($batch)) {
            return;
        }

        // Step 1: Upsert — always update traffic metrics.
        // On conflict (ad_unit_id, date, hour), only update traffic columns.
        // Financial columns are NOT in the update list here.
        RevenueRecord::upsert(
            $batch,
            ['ad_unit_id', 'date', 'hour'], // unique key
            // FIX [GS-1]: Traffic-only update columns — safe to overwrite always.
            // Financial columns intentionally excluded to prevent overwriting historical ratios.
            ['impressions', 'unfilled_impressions', 'clicks', 'ctr', 'cpm', 'synced_at']
        );

        // Step 2: For records that are OPEN (period_closing_id IS NULL) and have
        // ratio_applied = 0 (never financially processed), also update financial columns.
        //
        // FIX [RAT-1]: Records with ratio_applied > 0 are SKIPPED — historical ratio preserved.
        // We build per-row CASE WHEN expressions with inlined values (VALUES() is invalid outside
        // INSERT...ON DUPLICATE KEY UPDATE context).
        $grossCases    = '';
        $ratioCases    = '';
        $earningsCases = '';
        $cpmCases      = '';
        $inPairs       = [];

        foreach ($batch as $r) {
            $auId  = addslashes($r['ad_unit_id']);
            $date  = addslashes($r['date']);
            $hour  = (int)   $r['hour'];
            $gross = (float) $r['gross_revenue'];
            $ratio = (float) $r['ratio_applied'];
            $earn  = (float) $r['publisher_earnings'];
            $pcpm  = (float) $r['publisher_cpm'];

            $when = "WHEN ad_unit_id = '{$auId}' AND date = '{$date}' AND hour = {$hour} THEN";
            $grossCases    .= " {$when} {$gross}";
            $ratioCases    .= " {$when} {$ratio}";
            $earningsCases .= " {$when} {$earn}";
            $cpmCases      .= " {$when} {$pcpm}";
            $inPairs[]      = "('{$auId}', '{$date}', {$hour})";
        }

        if (empty($inPairs)) {
            return;
        }

        $inClause = implode(', ', $inPairs);

        \Illuminate\Support\Facades\DB::statement("
            UPDATE revenue_records
            SET
                gross_revenue      = CASE {$grossCases}    ELSE gross_revenue      END,
                ratio_applied      = CASE {$ratioCases}    ELSE ratio_applied      END,
                publisher_earnings = CASE {$earningsCases} ELSE publisher_earnings END,
                publisher_cpm      = CASE {$cpmCases}      ELSE publisher_cpm      END
            WHERE period_closing_id IS NULL
              AND (ratio_applied IS NULL OR ratio_applied = 0)
              AND (ad_unit_id, date, hour) IN ({$inClause})
        ");
    }
}
