<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessTrafficEventJob;
use App\Models\TrafficHourlyStat;
use App\Models\Website;
use App\Services\TrafficService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * TrackingController
 *
 * Handles the public tracking endpoint: POST /api/v1/track
 * This is the ONLY public endpoint in the Traffic Intelligence system.
 *
 * Design:
 *   - Accepts website_id (sent by publisher-tracker.js as data-website-id).
 *   - Resolves publisher_id server-side from the website record — the client
 *     never sends publisher_id directly (prevents spoofing).
 *   - Returns 204 immediately after dispatching the queued job.
 *   - All heavy processing (GeoIP, Redis writes) runs asynchronously.
 *   - Rate limited: 60 req/min per IP via route definition.
 *   - CORS: Returns Access-Control-Allow-Origin: * so publisher browsers on any
 *     domain can POST the beacon to our server without being blocked.
 *   - Redis fallback: When Redis is unavailable (shared hosting), writes
 *     visit counts directly to traffic_hourly_stats (MySQL) so the realtime
 *     monitor shows live data without needing a queue worker or Redis.
 */
class TrackingController extends Controller
{
    /**
     * Handle CORS preflight OPTIONS request.
     * Browsers send this before cross-origin POSTs with Content-Type: application/json.
     */
    public function preflight(): Response
    {
        return response()->noContent()
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Accept')
            ->header('Access-Control-Max-Age', '86400'); // cache preflight for 24h
    }

    public function track(Request $request): Response
    {
        // ── Check if traffic tracking is enabled globally ─────────────
        if (!\App\Models\Setting::get('traffic_tracking_enabled', true)) {
            return response()->noContent()
                ->header('Access-Control-Allow-Origin', '*');
        }

        // ── Validate input ────────────────────────────────────────────
        $validated = $request->validate([
            'website_id'   => 'required|string|max:36',
            'referrer'     => 'nullable|string|max:2048',
            'screen_width' => 'nullable|integer|min:0|max:9999',
        ]);

        // ── Resolve website — must be active, publisher must be active ─
        $website = Website::with('publisher:id,status')
            ->where('id', $validated['website_id'])
            ->where('is_active', true)
            ->first();

        if (!$website || $website->publisher?->status !== 'active') {
            // Return 204 always — never reveal website/publisher status to the tracker
            return response()->noContent()
                ->header('Access-Control-Allow-Origin', '*');
        }

        // Dynamically mark tracking status as active on successful track requests
        if ($website->tracking_status !== 'active') {
            $website->tracking_status = 'active';
            $website->tracking_checked_at = now();
            $website->save();
        }

        // ── Resolve request metadata server-side ──────────────────────
        $ip              = $request->ip();
        $userAgent       = $request->userAgent() ?? '';
        $referrer        = $validated['referrer'] ?? $request->header('Referer', '');
        $screenWidth     = (int) ($validated['screen_width'] ?? 0);
        $date            = now()->format('Y-m-d');
        $hour            = (int) now()->format('G');

        $deviceType       = TrafficService::parseDeviceType($userAgent, $screenWidth);
        $countryCode      = TrafficService::resolveCountryCode($ip);
        $referrerCategory = TrafficService::parseReferrerCategory($referrer);
        $browser          = TrafficService::parseBrowser($userAgent);
        $sessionId        = TrafficService::generateSessionId($ip, $userAgent, $date);

        if (TrafficService::isRedisAvailable()) {
            // ── Redis path: dispatch async job (non-blocking) ─────────
            ProcessTrafficEventJob::dispatch(
                $website->id,
                $website->publisher_id,
                $countryCode,
                $referrerCategory,
                $deviceType,
                $browser,
                $sessionId,
                $date,
                $hour
            );
        } else {
            // ── MySQL fallback: no Redis / no queue worker (shared hosting) ──
            // Track active visitor in Cache
            TrafficService::trackActiveVisitorFallback($website->id, $sessionId);
            $activeCount = TrafficService::getActiveVisitorsCountFallback($website->id);

            // Track unique visitor in Cache
            $uniqInfo = TrafficService::trackUniqueVisitorFallback($website->id, $sessionId, $date, $hour);

            // Track country, referrer, browser metadata in Cache
            TrafficService::incrementCacheMetadata($website->id, $date, $countryCode, $referrerCategory, $browser);

            // Write visit count directly to traffic_hourly_stats so the realtime
            // monitor shows live data without needing Redis or a queue worker.
            TrafficHourlyStat::updateOrCreate(
                [
                    'website_id'  => $website->id,
                    'date'        => $date,
                    'hour'        => $hour,
                    'device_type' => $deviceType,
                ],
                [
                    'publisher_id' => $website->publisher_id,
                ]
            );

            // Increment the visit counter atomically
            TrafficHourlyStat::where('website_id', $website->id)
                ->where('date', $date)
                ->where('hour', $hour)
                ->where('device_type', $deviceType)
                ->increment('visits');

            // If hourly unique, increment unique_visitors
            if ($uniqInfo['hourly_unique']) {
                TrafficHourlyStat::where('website_id', $website->id)
                    ->where('date', $date)
                    ->where('hour', $hour)
                    ->where('device_type', $deviceType)
                    ->increment('unique_visitors');
            }

            // Update active visitors peak if current active count is higher
            TrafficHourlyStat::where('website_id', $website->id)
                ->where('date', $date)
                ->where('hour', $hour)
                ->where('device_type', $deviceType)
                ->where('active_visitors_peak', '<', $activeCount)
                ->update(['active_visitors_peak' => $activeCount]);
        }

        return response()->noContent() // HTTP 204
            ->header('Access-Control-Allow-Origin', '*');
    }
}
