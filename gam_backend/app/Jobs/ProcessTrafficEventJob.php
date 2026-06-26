<?php

namespace App\Jobs;

use App\Services\TrafficService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * ProcessTrafficEventJob
 *
 * Handles a single tracking event dispatched from TrackingController.
 * Performs ONLY Redis writes — zero MySQL writes.
 * All MySQL persistence is handled by the scheduled flush jobs.
 *
 * Redis keys are now partitioned by website_id (not publisher_id).
 * publisher_id is carried for MySQL upserts in the flush jobs only.
 */
class ProcessTrafficEventJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 30;

    public function __construct(
        private readonly string $websiteId,        // primary partition key for Redis
        private readonly string $publisherId,      // carried for MySQL rollup writes
        private readonly string $countryCode,
        private readonly string $referrerCategory,
        private readonly string $deviceType,
        private readonly string $browser,
        private readonly string $sessionId,
        private readonly string $date,
        private readonly int    $hour
    ) {}

    public function handle(): void
    {
        if (!TrafficService::isRedisAvailable()) {
            Log::debug('Redis is not available. Skipping traffic stats aggregation in ProcessTrafficEventJob for website: ' . $this->websiteId);
            return;
        }

        $redis = Redis::connection();

        // ── Hourly device counter (keyed by website) ──────────────────
        $hourlyKey = TrafficService::keyHourly($this->websiteId, $this->date, $this->hour, $this->deviceType);
        $redis->hincrby($hourlyKey, 'visits', 1);
        $redis->expire($hourlyKey, 172800); // 48h TTL

        // ── Active visitors HLL (30-min window, keyed by website) ─────
        $hllKey = TrafficService::keyActive($this->websiteId);
        $redis->pfadd($hllKey, [$this->sessionId]);
        $redis->expire($hllKey, 1800); // 30-min TTL

        // ── Daily HLL for unique visitor count (keyed by website) ─────
        $dailyHllKey = TrafficService::keyDailyHll($this->websiteId, $this->date);
        $redis->pfadd($dailyHllKey, [$this->sessionId]);
        $redis->expire($dailyHllKey, 172800); // 48h TTL

        // ── Geo ZSET (keyed by website) ───────────────────────────────
        if ($this->countryCode !== 'XX') {
            $geoKey = TrafficService::keyGeo($this->websiteId, $this->date);
            $redis->zincrby($geoKey, 1, $this->countryCode);
            $redis->expire($geoKey, 172800);
        }

        // ── Referrer ZSET (keyed by website) ─────────────────────────
        $refKey = TrafficService::keyReferrer($this->websiteId, $this->date);
        $redis->zincrby($refKey, 1, $this->referrerCategory);
        $redis->expire($refKey, 172800);

        // ── Browser ZSET (keyed by website) ──────────────────────────
        $browserKey = TrafficService::keyBrowser($this->websiteId, $this->date);
        $redis->zincrby($browserKey, 1, $this->browser);
        $redis->expire($browserKey, 172800);

        // ── Anomaly detection window counter (keyed by website) ───────
        $windowKey = TrafficService::keyAnomalyWindow($this->websiteId, $this->date, $this->hour);
        $redis->hincrby($windowKey, 'visits', 1);
        $redis->hincrby($windowKey, 'sessions', 1);
        $redis->expire($windowKey, 7200); // 2h TTL
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('ProcessTrafficEventJob: Failed for website ' . $this->websiteId . ': ' . $exception->getMessage());
    }
}
