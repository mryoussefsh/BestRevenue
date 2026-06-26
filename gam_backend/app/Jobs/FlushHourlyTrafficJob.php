<?php

namespace App\Jobs;

use App\Models\TrafficHourlyStat;
use App\Models\Website;
use App\Services\TrafficService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * FlushHourlyTrafficJob
 *
 * Runs every hour via Scheduler.
 * Reads hourly Redis counters for the PREVIOUS hour, iterating by WEBSITE.
 * Upserts traffic_hourly_stats with both website_id and publisher_id.
 * Idempotent — safe to re-run (uses updateOrCreate).
 */
class FlushHourlyTrafficJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 120;

    public function __construct(
        private readonly ?string $targetDate = null,
        private readonly ?int    $targetHour = null
    ) {}

    public function handle(): void
    {
        $now  = now();
        $date = $this->targetDate ?? $now->copy()->subHour()->format('Y-m-d');
        $hour = $this->targetHour ?? (int) $now->copy()->subHour()->format('G');

        Log::info("FlushHourlyTrafficJob: Flushing traffic for {$date} hour {$hour}");

        $redis   = Redis::connection();
        $websites = Website::where('is_active', true)
            ->with('publisher:id,status')
            ->get(['id', 'publisher_id']);

        $devices = ['mobile', 'desktop', 'tablet'];
        $flushed = 0;

        foreach ($websites as $website) {
            // Skip if publisher is inactive
            if ($website->publisher?->status !== 'active') {
                continue;
            }

            foreach ($devices as $device) {
                $key  = TrafficService::keyHourly($website->id, $date, $hour, $device);
                $data = $redis->hgetall($key);

                $visits = (int) ($data['visits'] ?? 0);
                if ($visits === 0) {
                    continue; // skip empty — don't upsert zeros
                }

                $dailyHllKey    = TrafficService::keyDailyHll($website->id, $date);
                $uniqueVisitors = (int) $redis->pfcount($dailyHllKey);

                $activeKey  = TrafficService::keyActive($website->id);
                $activePeak = (int) $redis->pfcount($activeKey);

                TrafficHourlyStat::updateOrCreate(
                    [
                        'website_id'   => $website->id,
                        'date'         => $date,
                        'hour'         => $hour,
                        'device_type'  => $device,
                    ],
                    [
                        'publisher_id'         => $website->publisher_id,
                        'visits'               => $visits,
                        'unique_visitors'      => $uniqueVisitors,
                        'active_visitors_peak' => $activePeak,
                    ]
                );

                $flushed++;
            }
        }

        Log::info("FlushHourlyTrafficJob: Flushed {$flushed} records for {$date} hour {$hour}");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('FlushHourlyTrafficJob: Failed — ' . $exception->getMessage());
    }
}
