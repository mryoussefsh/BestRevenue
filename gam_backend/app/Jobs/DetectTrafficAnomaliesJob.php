<?php

namespace App\Jobs;

use App\Models\Website;
use App\Services\AnomalyDetectionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * DetectTrafficAnomaliesJob
 *
 * Runs every 15 minutes via Scheduler.
 * Loops over all active websites and performs 4 anomaly checks.
 * Anomaly recording, deduplication, and severity escalation are
 * delegated to AnomalyDetectionService.
 */
class DetectTrafficAnomaliesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 300;

    public function handle(AnomalyDetectionService $detector): void
    {
        $date = now()->format('Y-m-d');
        $hour = (int) now()->format('G');

        Log::info("DetectTrafficAnomaliesJob: Running anomaly detection for {$date} hour {$hour}");

        $websites = Website::where('is_active', true)
            ->with('publisher:id,status,name')
            ->get(['id', 'publisher_id', 'domain']);
        $detected   = 0;

        foreach ($websites as $website) {
            // Skip if publisher is inactive
            if ($website->publisher?->status !== 'active') {
                continue;
            }

            try {
                $detected += $detector->checkVolumeAnomaly($website, $date, $hour);
                $detected += $detector->checkCountryFlood($website, $date);
                $detected += $detector->checkReferrerFlood($website, $date);
                $detected += $detector->checkNewCountrySpike($website, $date);
            } catch (\Throwable $e) {
                Log::error("DetectTrafficAnomaliesJob: Error checking website {$website->id} ({$website->domain}): " . $e->getMessage());
            }
        }

        Log::info("DetectTrafficAnomaliesJob: Detection complete. {$detected} new anomalies recorded.");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('DetectTrafficAnomaliesJob: Failed — ' . $exception->getMessage());
    }
}

