<?php

namespace App\Jobs;

use App\Models\Website;
use App\Models\TrafficDailyStat;
use App\Services\TrafficService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * BuildDailyTrafficSummaryJob
 *
 * Runs daily at 00:05 via Scheduler (processes yesterday's data).
 * Reads hourly Redis counters + ZSETs to build traffic_daily_stats
 * including JSON top_countries, top_referrers, top_browsers.
 * Idempotent — uses updateOrCreate.
 */
class BuildDailyTrafficSummaryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 300;

    /**
     * @param string|null $targetDate  Override date for manual re-runs (Y-m-d)
     */
    public function __construct(
        private readonly ?string $targetDate = null
    ) {}

    public function handle(): void
    {
        $date = $this->targetDate ?? now()->subDay()->format('Y-m-d');

        Log::info("BuildDailyTrafficSummaryJob: Building daily summary for {$date}");

        $useRedis = TrafficService::isRedisAvailable();
        $redis    = $useRedis ? Redis::connection() : null;
        $websites = Website::where('is_active', true)
            ->with('publisher:id,status')
            ->get(['id', 'publisher_id']);
        $devices  = ['mobile', 'desktop', 'tablet'];
        $built    = 0;

        foreach ($websites as $website) {
            // Skip if publisher is inactive
            if ($website->publisher?->status !== 'active') {
                continue;
            }

            $websiteId   = $website->id;
            $publisherId = $website->publisher_id;

            if ($useRedis) {
                // ── Hourly totals from Redis (or zero if already expired) ─
                $totalVisits   = 0;
                $mobileVisits  = 0;
                $desktopVisits = 0;
                $tabletVisits  = 0;

                foreach ($devices as $device) {
                    $deviceTotal = 0;
                    for ($h = 0; $h < 24; $h++) {
                        $key    = TrafficService::keyHourly($websiteId, $date, $h, $device);
                        $data   = $redis->hgetall($key);
                        $visits = (int) ($data['visits'] ?? 0);
                        $deviceTotal   += $visits;
                        $totalVisits   += $visits;
                    }

                    match ($device) {
                        'mobile'  => $mobileVisits  = $deviceTotal,
                        'desktop' => $desktopVisits = $deviceTotal,
                        'tablet'  => $tabletVisits  = $deviceTotal,
                        default   => null,
                    };
                }

                // Skip websites with zero traffic today
                if ($totalVisits === 0) {
                    continue;
                }

                // ── Unique visitors from daily HLL ────────────────────────
                $dailyHllKey    = TrafficService::keyDailyHll($websiteId, $date);
                $uniqueVisitors = (int) $redis->pfcount($dailyHllKey);

                // ── Top countries (ZSET → sorted desc → top 10) ──────────
                $geoKey      = TrafficService::keyGeo($websiteId, $date);
                $geoRaw      = $redis->zrevrange($geoKey, 0, 9, ['WITHSCORES' => true]);
                $topCountries = [];
                foreach ($geoRaw as $code => $count) {
                    $topCountries[] = ['code' => (string) $code, 'visits' => (int) $count];
                }

                // Countries count = total members in ZSET
                $countriesCount = (int) $redis->zcard($geoKey);

                // ── Top referrers (ZSET → sorted desc → top 6) ───────────
                $refKey      = TrafficService::keyReferrer($websiteId, $date);
                $refRaw      = $redis->zrevrange($refKey, 0, 5, ['WITHSCORES' => true]);
                $topReferrers = [];
                foreach ($refRaw as $source => $count) {
                    $topReferrers[] = ['source' => (string) $source, 'visits' => (int) $count];
                }

                // ── Top browsers (ZSET → sorted desc → all) ───────────────
                $browserKey  = TrafficService::keyBrowser($websiteId, $date);
                $browserRaw  = $redis->zrevrange($browserKey, 0, -1, ['WITHSCORES' => true]);
                $topBrowsers = [];
                foreach ($browserRaw as $browser => $count) {
                    $topBrowsers[] = ['browser' => (string) $browser, 'visits' => (int) $count];
                }
            } else {
                // ── MySQL / Cache Fallback path ───────────────────────
                // Sum up device visits from MySQL traffic_hourly_stats
                $hourlyStats = \App\Models\TrafficHourlyStat::where('website_id', $websiteId)
                    ->where('date', $date)
                    ->get();

                $mobileVisits  = (int) $hourlyStats->where('device_type', 'mobile')->sum('visits');
                $desktopVisits = (int) $hourlyStats->where('device_type', 'desktop')->sum('visits');
                $tabletVisits  = (int) $hourlyStats->where('device_type', 'tablet')->sum('visits');
                $totalVisits   = $mobileVisits + $desktopVisits + $tabletVisits;

                // Skip websites with zero traffic today
                if ($totalVisits === 0) {
                    continue;
                }

                // Unique visitors from daily cache unique count
                $uniqueVisitors = (int) \Illuminate\Support\Facades\Cache::get("uniq_vis_count:{$websiteId}:{$date}", 0);
                if ($uniqueVisitors === 0) {
                    $uniqueVisitors = (int) $hourlyStats->sum('unique_visitors');
                    if ($uniqueVisitors === 0) {
                        $uniqueVisitors = (int) round($totalVisits * 0.85);
                    }
                }

                // Country, referrer, browser metadata from Cache fallback
                $cacheMeta      = TrafficService::getCacheMetadata($websiteId, $date);
                $topCountries   = $cacheMeta['top_countries'];
                $countriesCount = $cacheMeta['countries_count'];
                $topReferrers   = $cacheMeta['top_referrers'];
                $topBrowsers    = $cacheMeta['top_browsers'];
            }

            TrafficDailyStat::updateOrCreate(
                [
                    'website_id'   => $websiteId,
                    'date'         => $date,
                ],
                [
                    'publisher_id'    => $publisherId,
                    'visits'          => $totalVisits,
                    'unique_visitors' => $uniqueVisitors,
                    'mobile_visits'   => $mobileVisits,
                    'desktop_visits'  => $desktopVisits,
                    'tablet_visits'   => $tabletVisits,
                    'top_countries'   => $topCountries,
                    'top_referrers'   => $topReferrers,
                    'top_browsers'    => $topBrowsers,
                    'countries_count' => $countriesCount,
                ]
            );

            $built++;
        }

        Log::info("BuildDailyTrafficSummaryJob: Built {$built} daily summaries for {$date}");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('BuildDailyTrafficSummaryJob: Failed — ' . $exception->getMessage());
    }
}

