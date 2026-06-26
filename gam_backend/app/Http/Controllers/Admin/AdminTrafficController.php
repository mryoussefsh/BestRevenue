<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Models\Website;
use App\Models\TrafficAnomaly;
use App\Models\TrafficBaseline;
use App\Models\TrafficDailyStat;
use App\Models\TrafficHourlyStat;
use App\Models\TrafficQualityScore;
use App\Services\TrafficService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Safe Redis helper — returns null when Redis is unavailable (no extension / not configured).
 * All callers must handle null gracefully and fall back to MySQL aggregate tables.
 */
function safeRedis(): mixed
{
    try {
        if (!extension_loaded('redis') && !class_exists(\Predis\Client::class)) {
            return null;
        }
        return \Illuminate\Support\Facades\Redis::connection();
    } catch (\Throwable) {
        return null;
    }
}

/**
 * AdminTrafficController
 *
 * All 6 admin endpoints for the Traffic Intelligence system.
 * Accessible only to admin users (enforced by route middleware).
 * Publishers have ZERO access to any of these endpoints.
 */
class AdminTrafficController extends Controller
{
    // ─── 1. GET /api/v1/admin/traffic/overview ────────────────────────────

    /**
     * Main control center — all publishers combined.
     * Reads from both Redis (live data) and MySQL aggregate tables.
     */
    public function overview(): JsonResponse
    {
        $redis    = safeRedis(); // null when Redis unavailable — all reads fall back to MySQL
        $websites = Website::where('is_active', true)->get(['id', 'publisher_id', 'domain']);
        $today    = now()->format('Y-m-d');

        // ── Live active visitors ───────────────────────────────────────
        // If Redis is available: sum HLL pfcount per website.
        // If Redis is unavailable: use today's hourly stats peak sum as proxy.
        $totalActiveVisitors = 0;
        if ($redis) {
            foreach ($websites as $web) {
                $totalActiveVisitors += (int) $redis->pfcount(TrafficService::keyActive($web->id));
            }
        } else {
            foreach ($websites as $web) {
                $totalActiveVisitors += TrafficService::getActiveVisitorsCountFallback($web->id);
            }
        }

        // ── Platform visits today ─────────────────────────────────────
        $platformVisitsToday = TrafficDailyStat::where('date', $today)->sum('visits');
        if ($platformVisitsToday === 0) {
            $platformVisitsToday = TrafficHourlyStat::where('date', $today)->sum('visits');
        }

        // ── Platform visits this week ─────────────────────────────────
        $weekStart = now()->startOfWeek()->format('Y-m-d');
        $platformVisitsThisWeek = TrafficDailyStat::where('date', '>=', $weekStart)
            ->where('date', '<=', $today)->sum('visits');

        // ── Platform visits this month ────────────────────────────────
        $monthStart = now()->startOfMonth()->format('Y-m-d');
        $platformVisitsThisMonth = TrafficDailyStat::where('date', '>=', $monthStart)
            ->where('date', '<=', $today)->sum('visits');

        // ── Open anomalies ────────────────────────────────────────────
        $openAnomalies = TrafficAnomaly::with(['publisher:id,name,email', 'website:id,domain'])
            ->where('is_resolved', false)
            ->orderByRaw("FIELD(severity, 'critical', 'high', 'medium', 'low')")
            ->orderBy('detected_at', 'desc')
            ->limit(50)
            ->get();

        $anomalySummary = [
            'critical' => $openAnomalies->where('severity', 'critical')->count(),
            'high'     => $openAnomalies->where('severity', 'high')->count(),
            'medium'   => $openAnomalies->where('severity', 'medium')->count(),
            'low'      => $openAnomalies->where('severity', 'low')->count(),
        ];

        $publishersWithAnomalies = $openAnomalies->pluck('publisher_id')->unique()->values();
        $websitesWithAnomalies = $openAnomalies->pluck('website_id')->unique()->values();

        // ── Top websites by today's traffic ───────────────────────────
        $topPublishersByTraffic = TrafficDailyStat::with(['publisher:id,name,email', 'website:id,domain'])
            ->where('date', $today)
            ->orderBy('visits', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($s) => [
                'website_id'      => $s->website_id,
                'website_domain'  => $s->website?->domain ?? 'Unknown',
                'publisher_id'    => $s->publisher_id,
                'publisher_name'  => $s->publisher?->name,
                'publisher_email' => $s->publisher?->email,
                'visits_today'    => $s->visits,
                'unique_visitors' => $s->unique_visitors,
                'quality_score'   => TrafficQualityScore::where('website_id', $s->website_id)
                    ->where('date', $today)->value('quality_score'),
                'open_anomalies'  => $openAnomalies->where('website_id', $s->website_id)->count(),
            ]);

        return response()->json([
            'total_active_visitors'      => $totalActiveVisitors,
            'platform_visits_today'      => (int) $platformVisitsToday,
            'platform_visits_this_week'  => (int) $platformVisitsThisWeek,
            'platform_visits_this_month' => (int) $platformVisitsThisMonth,
            'open_anomalies'             => $openAnomalies->map(fn($a) => [
                'id'             => $a->id,
                'website_id'     => $a->website_id,
                'website_domain' => $a->website_domain ?? $a->website?->domain,
                'publisher_id'   => $a->publisher_id,
                'publisher_name' => $a->publisher?->name,
                'anomaly_type'   => $a->anomaly_type,
                'type_label'     => $a->getTypeLabel(),
                'severity'       => $a->severity,
                'metric_name'    => $a->metric_name,
                'baseline_value' => (float) $a->baseline_value,
                'current_value'  => (float) $a->current_value,
                'deviation_pct'  => (float) $a->deviation_pct,
                'detected_at'    => $a->detected_at?->toIso8601String(),
            ]),
            'anomaly_summary'           => $anomalySummary,
            'publishers_with_anomalies' => $publishersWithAnomalies,
            'websites_with_anomalies'   => $websitesWithAnomalies,
            'top_publishers_by_traffic' => $topPublishersByTraffic,
            'redis_available'           => $redis !== null,
        ]);
    }

    // ─── 2. GET /api/v1/admin/traffic/realtime ────────────────────────────

    /**
     * Live data from Redis only — never MySQL.
     * Polled every 30 seconds by the admin dashboard.
     */
    public function realtime(): JsonResponse
    {
        $redis    = safeRedis(); // null when Redis unavailable
        $websites = Website::where('is_active', true)->with('publisher:id,name,status')->get(['id', 'publisher_id', 'domain']);
        $today    = now()->format('Y-m-d');
        $hour     = (int) now()->format('G');
        $result   = [];

        // Load open anomaly website IDs for card highlighting
        $anomalousWebIds = TrafficAnomaly::where('is_resolved', false)
            ->pluck('website_id')->unique()->flip();

        foreach ($websites as $web) {
            // Skip if publisher is inactive
            if ($web->publisher?->status !== 'active') {
                continue;
            }

            if ($redis) {
                // ── Redis path (live data) ────────────────────────────
                $activeVisitors  = (int) $redis->pfcount(TrafficService::keyActive($web->id));
                $windowKey       = TrafficService::keyAnomalyWindow($web->id, $today, $hour);
                $windowData      = $redis->hgetall($windowKey);
                $visitsLast15Min = (int) ($windowData['visits'] ?? 0);

                $geoKey  = TrafficService::keyGeo($web->id, $today);
                $topGeo  = $redis->zrevrange($geoKey, 0, 0, ['WITHSCORES' => true]);
                $allGeo  = $redis->zrevrange($geoKey, 0, -1, ['WITHSCORES' => true]);
                $geoTotal = array_sum(array_values($allGeo));
                $topCountry = null;
                if (!empty($topGeo)) {
                    $topCode = (string) key($topGeo);
                    $topPct  = $geoTotal > 0 ? round((current($topGeo) / $geoTotal) * 100, 1) : 0;
                    $topCountry = ['code' => $topCode, 'pct' => $topPct];
                }

                $refKey     = TrafficService::keyReferrer($web->id, $today);
                $topRef     = $redis->zrevrange($refKey, 0, 0, ['WITHSCORES' => true]);
                $topReferrer = !empty($topRef) ? (string) key($topRef) : null;

                $deviceBreakdown = [];
                foreach (['mobile', 'desktop', 'tablet'] as $device) {
                    $hData = $redis->hgetall(TrafficService::keyHourly($web->id, $today, $hour, $device));
                    $deviceBreakdown[$device] = (int) ($hData['visits'] ?? 0);
                }
            } else {
                // ── MySQL fallback (no Redis) — read from hourly aggregate ──
                $hourlyRows = TrafficHourlyStat::where('website_id', $web->id)
                    ->where('date', $today)->where('hour', $hour)->get();

                $activeVisitors  = TrafficService::getActiveVisitorsCountFallback($web->id);
                if ($activeVisitors === 0) {
                    $activeVisitors = $hourlyRows->max('active_visitors_peak') ?? 0;
                }
                $visitsLast15Min = $hourlyRows->sum('visits');

                // Pull top country and referrer from Cache fallback if available, otherwise fall back to latest daily stat
                $cacheMetadata = TrafficService::getCacheMetadata($web->id, $today);

                $topCountry = null;
                if (!empty($cacheMetadata['top_countries'])) {
                    $top = $cacheMetadata['top_countries'][0];
                    $total = array_sum(array_column($cacheMetadata['top_countries'], 'visits'));
                    if ($total > 0) {
                        $topCountry = ['code' => $top['code'], 'pct' => round(($top['visits'] / $total) * 100, 1)];
                    }
                }

                $topReferrer = null;
                if (!empty($cacheMetadata['top_referrers'])) {
                    $topReferrer = $cacheMetadata['top_referrers'][0]['source'];
                }

                if (!$topCountry || !$topReferrer) {
                    $latestDaily = TrafficDailyStat::where('website_id', $web->id)
                        ->where('date', '<=', $today)->orderBy('date', 'desc')->first();
                    if (!$topCountry && $latestDaily && !empty($latestDaily->top_countries)) {
                        $top = $latestDaily->top_countries[0] ?? null;
                        $total = array_sum(array_column($latestDaily->top_countries, 'visits'));
                        if ($top && $total > 0) {
                            $topCountry = ['code' => $top['code'], 'pct' => round(($top['visits'] / $total) * 100, 1)];
                        }
                    }
                    if (!$topReferrer && $latestDaily && !empty($latestDaily->top_referrers)) {
                        $topReferrer = $latestDaily->top_referrers[0]['source'] ?? null;
                    }
                }

                $deviceBreakdown = [
                    'mobile'  => (int) $hourlyRows->where('device_type', 'mobile')->sum('visits'),
                    'desktop' => (int) $hourlyRows->where('device_type', 'desktop')->sum('visits'),
                    'tablet'  => (int) $hourlyRows->where('device_type', 'tablet')->sum('visits'),
                ];
            }

            $result[] = [
                'website_id'        => $web->id,
                'website_domain'    => $web->domain,
                'publisher_id'      => $web->publisher_id,
                'publisher_name'    => $web->publisher?->name ?? 'Publisher',
                'active_visitors'   => (int) $activeVisitors,
                'visits_last_15min' => (int) $visitsLast15Min,
                'top_country'       => $topCountry,
                'top_referrer'      => $topReferrer,
                'device_breakdown'  => $deviceBreakdown,
                'has_open_anomaly'  => isset($anomalousWebIds[$web->id]),
            ];
        }

        return response()->json([
            'websites'        => $result,
            'publishers'      => $result, // backward compatibility
            'as_of'           => now()->toIso8601String(),
            'redis_available' => $redis !== null,
        ]);
    }

    // ─── 3. GET /api/v1/admin/traffic/publishers/{publisher_id} ──────────

    /**
     * Deep-dive for one publisher — reads from MySQL aggregate tables only.
     */
    public function publisherDetail(Request $request, string $publisherId): JsonResponse
    {
        $publisher = Publisher::findOrFail($publisherId);
        $today     = now()->format('Y-m-d');
        $thirtyDaysAgo = now()->subDays(30)->format('Y-m-d');

        // Load the publisher's websites
        $websites = Website::where('publisher_id', $publisherId)->get(['id', 'domain', 'is_active']);

        // Check if a specific website is requested
        $websiteId = $request->query('website_id');
        if ($websiteId && !$websites->contains('id', $websiteId)) {
            $websiteId = null; // invalid website for this publisher
        }

        // ── Daily stats for last 30 days (chart data) ─────────────────
        $dailyQuery = TrafficDailyStat::where('publisher_id', $publisherId)
            ->where('date', '>=', $thirtyDaysAgo);
        if ($websiteId) {
            $dailyQuery->where('website_id', $websiteId);
        }
        $dailyStats = $dailyQuery->orderBy('date')->get();

        // ── Hourly breakdown for today ─────────────────────────────────
        $hourlyQuery = TrafficHourlyStat::where('publisher_id', $publisherId)
            ->where('date', $today);
        if ($websiteId) {
            $hourlyQuery->where('website_id', $websiteId);
        }
        $hourlyStats = $hourlyQuery->orderBy('hour')->get();

        // ── Quality score history (last 30 days) ──────────────────────
        $qualityQuery = TrafficQualityScore::where('publisher_id', $publisherId)
            ->where('date', '>=', $thirtyDaysAgo);
        if ($websiteId) {
            $qualityQuery->where('website_id', $websiteId);
        }
        $qualityHistory = $qualityQuery->orderBy('date')->get();

        // ── All anomalies (paginated, newest first) ───────────────────
        $anomalyQuery = TrafficAnomaly::where('publisher_id', $publisherId);
        if ($websiteId) {
            $anomalyQuery->where('website_id', $websiteId);
        }
        $anomalies = $anomalyQuery->orderBy('detected_at', 'desc')->paginate(20);

        // ── Baseline vs actual for current hour ───────────────────────
        $dayOfWeek = (int) now()->dayOfWeek;
        $hour      = (int) now()->format('G');

        $baselineQuery = TrafficBaseline::where('publisher_id', $publisherId)
            ->where('day_of_week', $dayOfWeek)
            ->where('hour', $hour);
        if ($websiteId) {
            $baselineQuery->where('website_id', $websiteId);
        }
        $baseline = $baselineQuery->first();

        $currentHourQuery = TrafficHourlyStat::where('publisher_id', $publisherId)
            ->where('date', $today)
            ->where('hour', $hour);
        if ($websiteId) {
            $currentHourQuery->where('website_id', $websiteId);
        }
        $currentHourVisits = $currentHourQuery->sum('visits');

        // If no specific website is selected (all websites rollup), and we have multiple rows per date,
        // we should roll up/sum them for the daily/hourly charts to render correctly.
        if (!$websiteId && $websites->count() > 1) {
            // Group and sum daily stats
            $rolledDailyStats = [];
            foreach ($dailyStats->groupBy(fn($s) => $s->date->format('Y-m-d')) as $dateStr => $group) {
                // Merge JSON arrays for top_countries, top_referrers, top_browsers
                $countriesMap = [];
                $referrersMap = [];
                $browsersMap  = [];
                foreach ($group as $s) {
                    foreach ($s->top_countries ?? [] as $c) {
                        $countriesMap[$c['code']] = ($countriesMap[$c['code']] ?? 0) + $c['visits'];
                    }
                    foreach ($s->top_referrers ?? [] as $r) {
                        $referrersMap[$r['source']] = ($referrersMap[$r['source']] ?? 0) + $r['visits'];
                    }
                    foreach ($s->top_browsers ?? [] as $b) {
                        $browsersMap[$b['browser']] = ($browsersMap[$b['browser']] ?? 0) + $b['visits'];
                    }
                }
                
                arsort($countriesMap);
                arsort($referrersMap);
                arsort($browsersMap);

                $topCountries = [];
                foreach (array_slice($countriesMap, 0, 10, true) as $code => $count) {
                    $topCountries[] = ['code' => (string) $code, 'visits' => (int) $count];
                }
                $topReferrers = [];
                foreach (array_slice($referrersMap, 0, 6, true) as $source => $count) {
                    $topReferrers[] = ['source' => (string) $source, 'visits' => (int) $count];
                }
                $topBrowsers = [];
                foreach ($browsersMap as $browser => $count) {
                    $topBrowsers[] = ['browser' => (string) $browser, 'visits' => (int) $count];
                }

                $rolledDailyStats[] = (object) [
                    'date' => $group->first()->date,
                    'visits' => $group->sum('visits'),
                    'unique_visitors' => $group->sum('unique_visitors'),
                    'mobile_visits' => $group->sum('mobile_visits'),
                    'desktop_visits' => $group->sum('desktop_visits'),
                    'tablet_visits' => $group->sum('tablet_visits'),
                    'top_countries' => $topCountries,
                    'top_referrers' => $topReferrers,
                    'top_browsers' => $topBrowsers,
                    'countries_count' => count($countriesMap),
                ];
            }
            $dailyStats = collect($rolledDailyStats);

            // Group and sum hourly stats
            $rolledHourlyStats = [];
            foreach ($hourlyStats->groupBy('hour') as $h => $group) {
                foreach (['mobile', 'desktop', 'tablet'] as $dev) {
                    $rolledHourlyStats[] = (object) [
                        'hour' => (int) $h,
                        'device_type' => $dev,
                        'visits' => $group->where('device_type', $dev)->sum('visits'),
                    ];
                }
            }
            // Add a total summary for each hour
            $hourlyStats = collect($rolledHourlyStats)->groupBy('hour')->map(fn($group, $h) => (object)[
                'hour' => (int) $h,
                'mobile' => $group->where('device_type', 'mobile')->sum('visits'),
                'desktop' => $group->where('device_type', 'desktop')->sum('visits'),
                'tablet' => $group->where('device_type', 'tablet')->sum('visits'),
                'total' => $group->sum('visits'),
            ])->values();

            // Average quality history across websites
            $rolledQualityHistory = [];
            foreach ($qualityHistory->groupBy(fn($q) => $q->date->format('Y-m-d')) as $dateStr => $group) {
                $rolledQualityHistory[] = (object) [
                    'date' => $group->first()->date,
                    'quality_score' => $group->avg('quality_score'),
                    'anomaly_count' => $group->sum('anomaly_count'),
                    'high_severity_anomalies' => $group->sum('high_severity_anomalies'),
                    'dominant_country_pct' => $group->avg('dominant_country_pct'),
                    'flags' => $group->flatMap(fn($q) => $q->flags ?? [])->unique()->values()->all(),
                ];
            }
            $qualityHistory = collect($rolledQualityHistory);

            // Roll up baseline average
            $baselineSum = TrafficBaseline::where('publisher_id', $publisherId)
                ->where('day_of_week', $dayOfWeek)
                ->where('hour', $hour)
                ->sum('avg_visits');
            $baseline = (object) [
                'avg_visits' => $baselineSum,
                'sample_weeks' => $baseline ? $baseline->sample_weeks : 0,
            ];
        } else {
            // Eagerly structure hourlyStats for a single website
            $hourlyStats = $hourlyStats->groupBy('hour')->map(fn($rows, $h) => (object)[
                'hour'    => (int) $h,
                'mobile'  => $rows->where('device_type', 'mobile')->sum('visits'),
                'desktop' => $rows->where('device_type', 'desktop')->sum('visits'),
                'tablet'  => $rows->where('device_type', 'tablet')->sum('visits'),
                'total'   => $rows->sum('visits'),
            ])->values();
        }

        return response()->json([
            'publisher'        => [
                'id'    => $publisher->id,
                'name'  => $publisher->name,
                'email' => $publisher->email,
            ],
            'websites'         => $websites->map(fn($w) => [
                'id'        => $w->id,
                'domain'    => $w->domain,
                'is_active' => $w->is_active,
            ]),
            'selected_website_id' => $websiteId,
            'daily_stats'      => $dailyStats->map(fn($s) => [
                'date'            => $s->date?->format('Y-m-d'),
                'visits'          => $s->visits,
                'unique_visitors' => $s->unique_visitors,
                'mobile_visits'   => $s->mobile_visits,
                'desktop_visits'  => $s->desktop_visits,
                'tablet_visits'   => $s->tablet_visits,
                'top_countries'   => $s->top_countries,
                'top_referrers'   => $s->top_referrers,
                'top_browsers'    => $s->top_browsers,
                'countries_count' => $s->countries_count,
            ]),
            'hourly_stats_today' => $hourlyStats,
            'quality_history'  => $qualityHistory->map(fn($q) => [
                'date'                     => $q->date?->format('Y-m-d'),
                'quality_score'            => (float) $q->quality_score,
                'anomaly_count'            => $q->anomaly_count,
                'high_severity_anomalies'  => $q->high_severity_anomalies,
                'dominant_country_pct'     => (float) $q->dominant_country_pct,
                'flags'                    => $q->flags,
            ]),
            'anomalies'        => $anomalies->through(fn($a) => [
                'id'             => $a->id,
                'website_id'     => $a->website_id,
                'website_domain' => $a->website_domain ?? $a->website?->domain,
                'anomaly_type'   => $a->anomaly_type,
                'type_label'     => $a->getTypeLabel(),
                'severity'       => $a->severity,
                'metric_name'    => $a->metric_name,
                'baseline_value' => (float) $a->baseline_value,
                'current_value'  => (float) $a->current_value,
                'deviation_pct'  => (float) $a->deviation_pct,
                'is_resolved'    => $a->is_resolved,
                'resolved_at'    => $a->resolved_at?->toIso8601String(),
                'admin_notes'    => $a->admin_notes,
                'detected_at'    => $a->detected_at?->toIso8601String(),
                'context'        => $a->context,
            ]),
            'baseline_vs_actual' => [
                'baseline_avg_visits' => $baseline ? (float) $baseline->avg_visits : null,
                'current_hour_visits' => (int) $currentHourVisits,
                'hour'                => $hour,
                'day_of_week'         => $dayOfWeek,
                'sample_weeks'        => $baseline?->sample_weeks,
            ],
        ]);
    }

    // ─── 4. GET /api/v1/admin/traffic/anomalies ───────────────────────────

    /**
     * Full anomaly log with filters.
     * Supports: ?severity=high,critical &publisher_id=X &website_id=Y &resolved=false &from=Y &to=Z
     */
    public function anomalies(Request $request): JsonResponse
    {
        $query = TrafficAnomaly::with(['publisher:id,name,email', 'website:id,domain'])
            ->orderByRaw("FIELD(severity, 'critical', 'high', 'medium', 'low')")
            ->orderBy('detected_at', 'desc');

        if ($request->filled('severity')) {
            $severities = explode(',', $request->query('severity'));
            $query->whereIn('severity', $severities);
        }

        if ($request->filled('publisher_id')) {
            $query->where('publisher_id', $request->query('publisher_id'));
        }

        if ($request->filled('website_id')) {
            $query->where('website_id', $request->query('website_id'));
        }

        if ($request->filled('resolved')) {
            $isResolved = filter_var($request->query('resolved'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_resolved', $isResolved);
        }

        if ($request->filled('from')) {
            $query->where('detected_at', '>=', $request->query('from') . ' 00:00:00');
        }

        if ($request->filled('to')) {
            $query->where('detected_at', '<=', $request->query('to') . ' 23:59:59');
        }

        $anomalies = $query->paginate(25);

        return response()->json($anomalies->through(fn($a) => [
            'id'             => $a->id,
            'website_id'     => $a->website_id,
            'website_domain' => $a->website_domain ?? $a->website?->domain,
            'publisher_id'   => $a->publisher_id,
            'publisher_name' => $a->publisher?->name,
            'publisher_email'=> $a->publisher?->email,
            'anomaly_type'   => $a->anomaly_type,
            'type_label'     => $a->getTypeLabel(),
            'severity'       => $a->severity,
            'metric_name'    => $a->metric_name,
            'baseline_value' => (float) $a->baseline_value,
            'current_value'  => (float) $a->current_value,
            'deviation_pct'  => (float) $a->deviation_pct,
            'context'        => $a->context,
            'is_resolved'    => $a->is_resolved,
            'resolved_at'    => $a->resolved_at?->toIso8601String(),
            'admin_notes'    => $a->admin_notes,
            'detected_at'    => $a->detected_at?->toIso8601String(),
        ]));
    }

    // ─── 5. PATCH /api/v1/admin/traffic/anomalies/{id}/resolve ───────────

    public function resolveAnomaly(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        $anomaly = TrafficAnomaly::findOrFail($id);

        if ($anomaly->is_resolved) {
            return response()->json(['message' => 'Anomaly is already resolved.'], 422);
        }

        $oldData = [
            'is_resolved' => false,
            'resolved_at' => null,
            'admin_notes' => null,
        ];

        $anomaly->update([
            'is_resolved' => true,
            'resolved_at' => now(),
            'admin_notes' => $request->input('admin_notes'),
        ]);

        \App\Services\AuditLogService::log(
            'resolved',
            'TrafficAnomaly',
            $anomaly->id,
            $oldData,
            [
                'is_resolved' => true,
                'resolved_at' => $anomaly->resolved_at?->toIso8601String(),
                'admin_notes' => $anomaly->admin_notes,
            ]
        );

        return response()->json([
            'message' => 'Anomaly marked as resolved.',
            'anomaly' => [
                'id'          => $anomaly->id,
                'is_resolved' => true,
                'resolved_at' => $anomaly->resolved_at?->toIso8601String(),
                'admin_notes' => $anomaly->admin_notes,
            ],
        ]);
    }

    // ─── 6. GET /api/v1/admin/traffic/quality-scores ─────────────────────

    /**
     * Website quality score leaderboard.
     * Sortable by: quality_score / anomaly_count / high_severity_anomalies
     * Default: worst first (ascending quality_score) for payout review.
     */
    public function qualityScores(Request $request): JsonResponse
    {
        $sortBy    = $request->query('sort_by', 'quality_score');
        $sortDir   = in_array($sortBy, ['anomaly_count', 'high_severity_anomalies']) ? 'desc' : 'asc';
        $allowedSorts = ['quality_score', 'anomaly_count', 'high_severity_anomalies'];

        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy  = 'quality_score';
            $sortDir = 'asc';
        }

        $today  = now()->format('Y-m-d');

        $scores = TrafficQualityScore::with(['publisher:id,name,email', 'website:id,domain'])
            ->where('date', $today)
            ->orderBy($sortBy, $sortDir)
            ->paginate(50);

        return response()->json($scores->through(fn($s) => [
            'website_id'               => $s->website_id,
            'website_domain'           => $s->website?->domain ?? 'Unknown',
            'publisher_id'             => $s->publisher_id,
            'publisher_name'           => $s->publisher?->name,
            'publisher_email'          => $s->publisher?->email,
            'date'                     => $s->date?->format('Y-m-d'),
            'quality_score'            => (float) $s->quality_score,
            'anomaly_count'            => $s->anomaly_count,
            'high_severity_anomalies'  => $s->high_severity_anomalies,
            'dominant_country_pct'     => (float) $s->dominant_country_pct,
            'referrer_diversity_score' => (float) $s->referrer_diversity_score,
            'device_diversity_score'   => (float) $s->device_diversity_score,
            'flags'                    => $s->flags ?? [],
        ]));
    }
}

