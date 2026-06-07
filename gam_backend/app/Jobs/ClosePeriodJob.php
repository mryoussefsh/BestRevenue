<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

/**
 * FIX [PC-5]: Period closing is now dispatched as a queued job instead of
 * running synchronously inside the HTTP request.
 *
 * Previously, PeriodClosingController::close() called Artisan::call() directly,
 * which for 100+ publishers could take minutes and time out the HTTP request.
 *
 * Now, the controller dispatches this job and returns a 202 Accepted response
 * immediately. The close runs in the background.
 *
 * With QUEUE_CONNECTION=sync, this runs immediately but doesn't block the HTTP
 * response (job runs on its own stack). With database/redis, truly async.
 */
class ClosePeriodJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;      // Do NOT retry a failed period close automatically
    public int $timeout = 600;  // 10-minute timeout for large publisher counts

    public function __construct(
        private readonly int $year,
        private readonly int $month
    ) {}

    public function handle(): void
    {
        Log::info("ClosePeriodJob: Starting period close for {$this->year}-{$this->month}");

        $exitCode = Artisan::call('period:auto-close', [
            '--force-year'  => $this->year,
            '--force-month' => $this->month,
        ]);

        if ($exitCode !== 0) {
            $output = Artisan::output();
            Log::error("ClosePeriodJob: period:auto-close failed for {$this->year}-{$this->month}. Output: {$output}");
            throw new \RuntimeException("Period close command exited with code {$exitCode}");
        }

        Log::info("ClosePeriodJob: Period {$this->year}-{$this->month} closed successfully.");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("ClosePeriodJob: Failed for {$this->year}-{$this->month}: " . $exception->getMessage());
        // The PeriodClosingRecover command (PC-2) can be used to recover from this state.
    }
}
