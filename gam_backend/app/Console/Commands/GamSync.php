<?php

namespace App\Console\Commands;

use App\Models\AdUnit;
use App\Models\GamSyncLog;
use App\Models\PeriodClosing;
use App\Models\RevenueRecord;
use App\Models\Setting;
use App\Services\RatioService;
use App\Services\AuditLogService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GamSync extends Command
{
    /**
     * Captured console output lines for audit logging.
     *
     * @var array
     */
    protected array $capturedOutput = [];

    public function line($string, $style = null, $verbosity = null)
    {
        $prefix = '';
        if ($style === 'error') {
            $prefix = 'ERROR: ';
        } elseif ($style === 'warning' || $style === 'comment') {
            $prefix = 'WARNING: ';
        }
        $this->capturedOutput[] = $prefix . $string;
        parent::line($string, $style, $verbosity);
    }
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

        // Check scheduler logic if it is triggered by Laravel scheduler (not manual)
        if (!$isManual) {
            $frequency = Setting::get('gam_sync_frequency', 'hourly');
            $interval  = (int) Setting::get('gam_sync_interval', 1);

            $lastLog = GamSyncLog::where('triggered_by', 'scheduler')
                ->orderBy('started_at', 'desc')
                ->first();

            if ($lastLog && $lastLog->started_at) {
                $lastRun = Carbon::parse($lastLog->started_at);
                $nowTime = now();

                $shouldSync = false;

                if ($frequency === 'daily') {
                    $tz        = Setting::get('platform_timezone', 'UTC');
                    $lastRunTz = $lastRun->copy()->setTimezone($tz);
                    $nowTimeTz = $nowTime->copy()->setTimezone($tz);

                    if ($lastRunTz->format('Y-m-d') !== $nowTimeTz->format('Y-m-d')) {
                        $shouldSync = true;
                    }
                } elseif ($frequency === 'minutes') {
                    if (abs($nowTime->diffInSeconds($lastRun)) >= ($interval * 60 - 30)) {
                        $shouldSync = true;
                    }
                } else {
                    // Hourly
                    if (abs($nowTime->diffInSeconds($lastRun)) >= ($interval * 3600 - 30)) {
                        $shouldSync = true;
                    }
                }

                if (!$shouldSync) {
                    $this->info("GAM sync is not due yet. Skipping (Frequency: {$frequency}, Interval: {$interval}).");
                    return 0;
                }
            }
        }

        $dateFrom        = $this->option('date-from');
        $dateTo          = $this->option('date-to');
        $filterPublisher = $this->option('publisher-id');
        $filterAccount   = $this->option('gam-account-id');
        $timezone        = Setting::get('platform_timezone', 'UTC');

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

        $rowsFetched = 0;
        $rowsMatched = 0;

        $rangeDesc = $dateFrom
            ? "from {$dateFrom} to " . ($dateTo ?? 'today')
            : "{$daysBack} days back";
        $this->info("Starting GAM Sync ({$rangeDesc}, Timezone: {$timezone})");

        try {
            $gamApiService = app(\App\Services\GamApiService::class);

            // If a specific GAM account is requested, only process that one
            $gamAccountsQuery = \App\Models\GamAccount::query();
            if ($filterAccount) {
                $gamAccountsQuery->where('id', $filterAccount);
            }
            $gamAccounts = $gamAccountsQuery->get();

            $globalSyncEnabled = \App\Models\Setting::get('global_sync_enabled', true);
            if (!$globalSyncEnabled) {
                $this->warn("GAM Sync is globally disabled. Skipping sync run.");
                $syncLog->status = 'completed';
                $syncLog->error_message = 'Sync skipped: Globally disabled.';
                $syncLog->finished_at = now();
                $syncLog->save();
                return 0;
            }

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

        // FIX [GS-1]: Load lockedPeriods initially. Refreshed before each batch flush.
        $lockedPeriods = PeriodClosing::whereIn('status', ['closed', 'closing'])
            ->get(['period_year', 'period_month'])
            ->map(fn($p) => "{$p->period_year}-{$p->period_month}")
            ->toArray();

        foreach ($gamAccounts as $account) {
                if (!$account->sync_enabled) {
                    $this->warn("Skipping GAM Account {$account->email} (Sync is disabled for this account).");
                    continue;
                }
                if (!$account->refresh_token || !$account->network_code) {
                    $this->warn("Skipping GAM Account {$account->email} (Missing token or network code).");
                    continue;
                }

                // Skip accounts that have no active ad units registered in Mindora X
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

                        // 2. Check if period is closed or closing
                        $date = Carbon::parse($row['date']);
                        if (in_array("{$date->year}-{$date->month}", $lockedPeriods)) {
                            $rowsLocked++;
                            continue; // Skip updating closed or closing periods
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
                            'id'                                => Str::uuid()->toString(),
                            'ad_unit_id'                        => $adUnit->id,
                            'date'                              => $row['date'],
                            'hour'                              => 0,
                            'impressions'                       => $row['impressions'],
                            'unfilled_impressions'              => $row['unfilled_impressions'],
                            'active_view_eligible_impressions'  => $row['active_view_eligible_impressions'] ?? 0,
                            'active_view_viewable_impressions'  => $row['active_view_viewable_impressions'] ?? 0,
                            'clicks'                            => $row['clicks'],
                            'ctr'                               => $ctr,
                            'cpm'                               => $row['cpm'], // Real GAM eCPM
                            'gross_revenue'                     => $grossRevenue,
                            'ratio_applied'                     => $ratio,
                            'publisher_earnings'                => $publisherEarnings,
                            'publisher_cpm'                     => $publisherCpm,
                            'synced_at'                         => now(),
                        ];

                        if (count($upsertBatch) >= $batchSize) {
                            // Reload locked periods before each batch flush to catch concurrent closings
                            $lockedPeriods = PeriodClosing::whereIn('status', ['closed', 'closing'])
                                ->get(['period_year', 'period_month'])
                                ->map(fn($p) => "{$p->period_year}-{$p->period_month}")
                                ->toArray();

                            $upsertBatch = array_filter($upsertBatch, function ($record) use ($lockedPeriods, &$rowsLocked) {
                                $date = Carbon::parse($record['date']);
                                $periodKey = "{$date->year}-{$date->month}";
                                if (in_array($periodKey, $lockedPeriods)) {
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
                // FIX [GS-1]: Reload locked periods one final time before the last flush
                // to catch any period closings that occurred during this sync run.
                $lockedPeriods = PeriodClosing::whereIn('status', ['closed', 'closing'])
                    ->get(['period_year', 'period_month'])
                    ->map(fn($p) => "{$p->period_year}-{$p->period_month}")
                    ->toArray();

                // Filter out any records that fell into a newly-locked period
                $upsertBatch = array_filter($upsertBatch, function ($record) use ($lockedPeriods, &$rowsLocked) {
                    $date = Carbon::parse($record['date']);
                    $periodKey = "{$date->year}-{$date->month}";
                    if (in_array($periodKey, $lockedPeriods)) {
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

            // Clear queries cache on sync completion
            RevenueRecord::clearCache();

            $this->info("GAM Sync Completed" . ($hasErrors ? " with partial errors!" : " Successfully!"));
            
            // Format table to captured output
            $tableStr = "| Fetched | Matched | Skipped | Locked | Status |\n"
                      . "|---------|---------|---------|--------|--------|\n"
                      . "| {$rowsFetched} | {$rowsMatched} | {$rowsSkipped} | {$rowsLocked} | {$syncLog->status} |";
            $this->capturedOutput[] = $tableStr;

            $this->table(
                ['Fetched', 'Matched', 'Skipped', 'Locked', 'Status'],
                [[$rowsFetched, $rowsMatched, $rowsSkipped, $rowsLocked, $syncLog->status]]
            );

            // Write to audit log (only for automatic/scheduler syncs)
            if (!$isManual) {
                try {
                    AuditLogService::log(
                        'trigger_sync',
                        'GamAccount',
                        null,
                        null,
                        [
                            'status'         => $syncLog->status,
                            'rows_fetched'   => $rowsFetched,
                            'rows_matched'   => $rowsMatched,
                            'output'         => substr(implode("\n", $this->capturedOutput), 0, 2000),
                            'filters'        => null,
                        ],
                        'System triggered automatic GAM sync'
                    );
                } catch (\Exception $auditEx) {
                    // Ignore audit logging errors
                }
            }

            return 0;

        } catch (\Exception $e) {
            $syncLog->finished_at = now();
            $syncLog->status = 'failed';
            $syncLog->error_message = $e->getMessage();
            $syncLog->save();

            // Clear queries cache in case some batches succeeded before failing
            RevenueRecord::clearCache();

            $this->error("GAM Sync Failed: " . $e->getMessage());

            // Write to audit log (only for automatic/scheduler syncs)
            if (!$isManual) {
                try {
                    AuditLogService::log(
                        'trigger_sync',
                        'GamAccount',
                        null,
                        null,
                        [
                            'status'         => 'failed',
                            'rows_fetched'   => $rowsFetched ?? 0,
                            'rows_matched'   => $rowsMatched ?? 0,
                            'output'         => substr(implode("\n", $this->capturedOutput), 0, 2000),
                            'filters'        => null,
                        ],
                        'System triggered automatic GAM sync'
                    );
                } catch (\Exception $auditEx) {
                    // Ignore audit logging errors
                }
            }

            return 1;
        }
    }

    /**
     * FIX [GS-1, RAT-1, GS-7]: Three-step batch flush that protects locked and historically-priced records.
     *
     * Step 1 — INSERT new rows (with full financial data) and update TRAFFIC + RAW REVENUE columns on
     *           existing rows. gross_revenue is raw GAM data and is always safe to refresh.
     *           ratio_applied and publisher_earnings are NOT in the upsert update list here.
     *
     * Step 2 — For rows that are genuinely NEW (period_closing_id IS NULL AND ratio_applied = 0),
     *           also update ratio_applied, publisher_earnings, and publisher_cpm.
     *           These are the first-time financial calculations for un-priced records.
     *
     * Step 3 (GS-5) — For rows with ratio_applied > 0, recalculate publisher_earnings and
     *           publisher_cpm using the updated gross_revenue (from Step 1) and the preserved
     *           historical ratio_applied from the DB. gross_revenue is already updated in Step 1
     *           so only earnings recalculation is needed here.
     *
     * Rows with period_closing_id IS NOT NULL are never touched (they are locked).
     * Rows with ratio_applied > 0 keep their original ratio (historical ratio preserved).
     *
     * FIX [GS-7]: Root cause of re-sync not updating revenue: gross_revenue was NOT included in
     * the Step 1 upsert update columns. On 2nd+ sync of the same day, Step 2 was skipped (because
     * ratio_applied > 0 already) and Step 3 (GS-5) was the only path to update gross_revenue via
     * raw SQL. If GS-5 failed silently (caught as a per-account error), revenue stayed stale.
     * Fix: always update gross_revenue in Step 1 — it is raw GAM data and safe to overwrite.
     *
     * @param array $batch Rows to upsert — must already be filtered (no closed-period rows)
     */
    private function flushBatch(array $batch): void
    {
        if (empty($batch)) {
            return;
        }

        // Step 1: Upsert — always update traffic metrics AND gross_revenue from GAM.
        // On conflict (ad_unit_id, date, hour), update traffic columns + gross_revenue.
        // gross_revenue is raw GAM data and is always safe to refresh.
        // ratio_applied and publisher_earnings are NOT updated here — handled in Step 2 & GS-5.
        RevenueRecord::upsert(
            $batch,
            ['ad_unit_id', 'date', 'hour'], // unique key
            // FIX [GS-7]: Added gross_revenue to the upsert update list so that re-syncing on the
            // same day always refreshes the raw GAM revenue figure. Steps 2 & GS-5 then recalculate
            // publisher_earnings from the already-updated gross_revenue and preserved ratio_applied.
            ['impressions', 'unfilled_impressions', 'active_view_eligible_impressions', 'active_view_viewable_impressions', 'clicks', 'ctr', 'cpm', 'gross_revenue', 'synced_at']
        );

        // Step 2: For records that are OPEN (period_closing_id IS NULL) and have
        // ratio_applied = 0 (never financially processed), also update financial columns.
        //
        // FIX [RAT-1]: Records with ratio_applied > 0 are SKIPPED — historical ratio preserved.
        // We build per-row CASE WHEN expressions with inlined values (VALUES() is invalid outside
        // INSERT...ON DUPLICATE KEY UPDATE context).
        $ratioCases    = '';
        $earningsCases = '';
        $cpmCases      = '';
        $inPairs       = [];

        foreach ($batch as $r) {
            $auId  = addslashes($r['ad_unit_id']);
            $date  = addslashes($r['date']);
            $hour  = (int)   $r['hour'];
            $ratio = (float) $r['ratio_applied'];
            $earn  = (float) $r['publisher_earnings'];
            $pcpm  = (float) $r['publisher_cpm'];

            $when = "WHEN ad_unit_id = '{$auId}' AND date = '{$date}' AND hour = {$hour} THEN";
            $ratioCases    .= " {$when} {$ratio}";
            $earningsCases .= " {$when} {$earn}";
            $cpmCases      .= " {$when} {$pcpm}";
            $inPairs[]      = "('{$auId}', '{$date}', {$hour})";
        }

        if (empty($inPairs)) {
            return;
        }

        $inClause = implode(', ', $inPairs);

        // Step 2: For NEW / un-priced rows (ratio_applied = 0), set ratio and recalculate earnings.
        // gross_revenue was already updated in Step 1, so we read it from the DB here.
        // FIX [GS-7]: Removed gross_revenue from this SET — it was already applied in Step 1 upsert.
        \Illuminate\Support\Facades\DB::statement("
            UPDATE revenue_records
            SET
                ratio_applied      = CASE {$ratioCases}    ELSE ratio_applied      END,
                publisher_earnings = CASE {$earningsCases} ELSE publisher_earnings END,
                publisher_cpm      = CASE {$cpmCases}      ELSE publisher_cpm      END
            WHERE period_closing_id IS NULL
              AND (ratio_applied IS NULL OR ratio_applied = 0)
              AND (ad_unit_id, date, hour) IN ({$inClause})
        ");

        // FIX [GS-5, GS-7]: For existing records with ratio_applied > 0, recalculate publisher_earnings
        // and publisher_cpm using the fresh gross_revenue (already updated in Step 1) and the
        // historical ratio_applied preserved in the DB.
        // gross_revenue is intentionally read from the DB (not the CASE expression) because
        // Step 1 already wrote the updated value — this is simpler and avoids nested CASE expressions.
        \Illuminate\Support\Facades\DB::statement("
            UPDATE revenue_records
            SET
                publisher_earnings = ROUND(gross_revenue * ratio_applied, 6),
                publisher_cpm      = CASE 
                                       WHEN impressions > 0 THEN ROUND((gross_revenue * ratio_applied) / impressions * 1000, 4) 
                                       ELSE 0 
                                     END
            WHERE period_closing_id IS NULL
              AND ratio_applied > 0
              AND (ad_unit_id, date, hour) IN ({$inClause})
        ");
    }
}
