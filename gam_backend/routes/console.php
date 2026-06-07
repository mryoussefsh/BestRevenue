<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// GAM Sync — dynamically scheduled based on settings
$frequency = 'hourly';
$interval = 1;

try {
    if (\Illuminate\Support\Facades\Schema::hasTable('settings')) {
        $frequency = \App\Models\Setting::get('gam_sync_frequency', 'hourly');
        $interval = (int) \App\Models\Setting::get('gam_sync_interval', 1);
    }
} catch (\Exception $e) {
    // fallback to defaults
}

// FIX [GS-2]: Added withoutOverlapping(5) to prevent concurrent sync executions.
// FIX [SCH-4 / FIX-22]: Use a dated daily log file instead of a single append-forever file.
// gam_sync.log was growing indefinitely; dated files let us purge old entries automatically.
$syncLogFile = storage_path('logs/gam_sync_' . now()->format('Y-m-d') . '.log');

$scheduleEvent = Schedule::command('gam:sync')
    ->withoutOverlapping(5)  // Lock held for max 5 minutes
    ->appendOutputTo($syncLogFile);

if ($frequency === 'daily') {
    $scheduleEvent->daily();
} elseif ($frequency === 'minutes') {
    $scheduleEvent->cron("*/$interval * * * *");
} else {
    $scheduleEvent->cron("0 */$interval * * *");
}

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
