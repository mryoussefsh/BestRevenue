<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// GAM Sync — statically scheduled to run every minute.
// The command itself (GamSync.php) handles the scheduling logic internally
// based on the frequency and interval configured in admin settings.
// FIX [GS-2]: Added withoutOverlapping(5) to prevent concurrent sync executions.
// FIX [SCH-4 / FIX-22]: Use a dated daily log file.
$syncLogFile = storage_path('logs/gam_sync_' . now()->format('Y-m-d') . '.log');

Schedule::command('gam:sync')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->appendOutputTo($syncLogFile);

// Period Auto-Close — runs daily
// FIX [GS-2]: Added withoutOverlapping(10) to the period close command as well.
// FIX [FIX-22]: Dated log file for period close as well.
$periodLogFile = storage_path('logs/period_close_' . now()->format('Y-m-d') . '.log');

Schedule::command('period:auto-close')
    ->daily()
    ->withoutOverlapping(10)
    ->appendOutputTo($periodLogFile);

// FIX [A-1]: Prune expired Sanctum tokens daily.
// Since we now enforce 'expiration' => 60 in sanctum.php, old tokens accumulate
// in personal_access_tokens. This command cleans up tokens expired > 24 hours ago.
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// FIX [SCH-4 / FIX-22]: Clean up log files older than 14 days daily.
// Covers gam_sync_*.log and period_close_*.log dated files.
Schedule::call(function () {
    $logDir = storage_path('logs');
    $cutoff = now()->subDays(14)->timestamp;
    $patterns = ['gam_sync_*.log', 'period_close_*.log'];

    foreach ($patterns as $pattern) {
        foreach (glob("{$logDir}/{$pattern}") as $file) {
            if (filemtime($file) < $cutoff) {
                @unlink($file);
            }
        }
    }
})->daily()->name('prune-old-sync-logs')->withoutOverlapping(2);

// ── Traffic Intelligence System ─────────────────────────────────────────────

use App\Jobs\FlushHourlyTrafficJob;
use App\Jobs\BuildDailyTrafficSummaryJob;
use App\Jobs\RecalculateBaselinesJob;
use App\Jobs\DetectTrafficAnomaliesJob;

// Flush Redis hourly counters → traffic_hourly_stats (runs every hour)
Schedule::job(new FlushHourlyTrafficJob())
    ->hourly()
    ->withoutOverlapping(5)
    ->name('traffic-flush-hourly');

// Build daily traffic summary from Redis ZSETs → traffic_daily_stats (runs at 00:05 daily)
Schedule::job(new BuildDailyTrafficSummaryJob())
    ->dailyAt('00:05')
    ->withoutOverlapping(10)
    ->name('traffic-build-daily-summary');

// Rebuild baselines from last 4 weeks of hourly data (runs every Sunday at 02:00)
Schedule::job(new RecalculateBaselinesJob())
    ->weeklyOn(0, '02:00')
    ->withoutOverlapping(30)
    ->name('traffic-recalculate-baselines');

// Run anomaly detection across all active publishers (every 15 minutes)
Schedule::job(new DetectTrafficAnomaliesJob())
    ->everyFifteenMinutes()
    ->withoutOverlapping(10)
    ->name('traffic-detect-anomalies');

// Verify tracking code on active websites — statically scheduled to run every minute.
// The command itself (VerifyWebsiteTracking.php) handles the scheduling logic internally
// based on the frequency and interval configured in admin settings.
Schedule::command('tracking:verify')
    ->everyMinute()
    ->withoutOverlapping(15)
    ->name('tracking-verify-websites');

// Prune old traffic intelligence data daily
Schedule::command('traffic:prune')
    ->daily()
    ->withoutOverlapping(10)
    ->name('traffic-prune-old-data');

// Run queue worker every minute on shared hosting to process queued tasks (database queue)
Schedule::command('queue:work --stop-when-empty')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->name('queue-work');
