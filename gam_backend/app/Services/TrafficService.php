<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * TrafficService
 *
 * Central helper for the Traffic Intelligence system.
 *
 * Responsibilities:
 *   — IP → country_code resolution with Redis cache (Issue 3: SHA256-keyed, 24h TTL)
 *   — Device type classification from User-Agent + screen width
 *   — Referrer categorization from referrer URL
 *   — Browser parsing from User-Agent
 *   — Session ID generation (SHA256 of IP + UA + date, never stored raw)
 *   — Redis key builders (single source of truth for all key patterns)
 */
class TrafficService
{
    public static bool $forceRedisUnavailable = false;

    public static function isRedisAvailable(): bool
    {
        if (self::$forceRedisUnavailable) {
            return false;
        }

        static $available = null;
        if ($available !== null) {
            return $available;
        }

        try {
            if (!class_exists(\Redis::class) && env('REDIS_CLIENT', 'phpredis') === 'phpredis') {
                $available = false;
                return false;
            }
            // Try connection
            Redis::connection();
            $available = true;
        } catch (\Throwable $e) {
            $available = false;
        }

        return $available;
    }

    // ─── GeoIP Resolution ────────────────────────────────────────────────

    /**
     * Resolve a country code from an IP address.
     *
     * Uses Laravel Cache wrapper:
     *   Key:   geoip:{sha256(ip)}  →  never stores the raw IP
     *   TTL:   86400 seconds (24 hours)
     *   Miss:  call ip-api.com, cache result, return code
     *   Fail:  return 'XX'
     */
    public static function resolveCountryCode(string $ip): string
    {
        // Sanitize: strip port if present (e.g. IPv6 or proxy headers)
        $ip = trim(explode(',', $ip)[0]); // take first IP from X-Forwarded-For chain

        $isLocal = (
            $ip === '127.0.0.1' ||
            $ip === '::1' ||
            str_starts_with($ip, '192.168.') ||   // RFC 1918 class C
            str_starts_with($ip, '10.')        ||  // RFC 1918 class A
            str_starts_with($ip, '100.64.')    ||  // RFC 6598 carrier-grade NAT
            preg_match('/^172\.(1[6-9]|2\d|3[01])\./', $ip) // RFC 1918 class B: 172.16.0.0–172.31.255.255
        );

        if ($isLocal && !app()->environment('local', 'testing')) {
            return 'XX';
        }

        // Build cache key from hash — never store the raw IP
        $hash     = hash('sha256', $ip);
        $cacheKey = "geoip:{$hash}";

        // Use standard Cache remember so it falls back to 'file' driver if Redis is missing
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400, function () use ($ip, $isLocal) {
            try {
                $url      = $isLocal 
                    ? "http://ip-api.com/json/?fields=countryCode,status"
                    : "http://ip-api.com/json/{$ip}?fields=countryCode,status";
                $response = @file_get_contents($url, false, stream_context_create([
                    'http' => [
                        'timeout'        => 2,          // 2-second timeout — never block a queue job
                        'ignore_errors'  => true,
                    ],
                ]));

                if ($response === false) {
                    return 'XX'; // network failure — do not cache
                }

                $data = json_decode($response, true);

                if (
                    !is_array($data) ||
                    ($data['status'] ?? '') !== 'success' ||
                    empty($data['countryCode'])
                ) {
                    return 'XX'; // API error or rate limit — do not cache
                }

                return strtoupper(substr($data['countryCode'], 0, 2));
            } catch (\Throwable $e) {
                Log::warning('TrafficService: GeoIP resolution failed for hashed IP — ' . $e->getMessage());
                return 'XX';
            }
        });
    }

    // ─── Device Type ──────────────────────────────────────────────────────

    /**
     * Classify device type from User-Agent string and screen width.
     * Screen width ≤ 768 → mobile (overrides UA when ambiguous).
     */
    public static function parseDeviceType(string $userAgent, int $screenWidth = 0): string
    {
        $ua = strtolower($userAgent);

        // Tablet signals — check before mobile (iPad reports as mobile in some UAs)
        if (
            str_contains($ua, 'ipad') ||
            str_contains($ua, 'tablet') ||
            str_contains($ua, 'kindle') ||
            str_contains($ua, 'playbook') ||
            (str_contains($ua, 'android') && !str_contains($ua, 'mobile'))
        ) {
            return 'tablet';
        }

        // Mobile signals
        if (
            str_contains($ua, 'mobile') ||
            str_contains($ua, 'iphone') ||
            str_contains($ua, 'ipod') ||
            str_contains($ua, 'blackberry') ||
            str_contains($ua, 'windows phone') ||
            ($screenWidth > 0 && $screenWidth <= 768)
        ) {
            return 'mobile';
        }

        return 'desktop';
    }

    // ─── Referrer Category ────────────────────────────────────────────────

    /**
     * Classify a referrer URL into a known category.
     * Returns one of: Google / Facebook / X / Telegram / Direct / Other
     */
    public static function parseReferrerCategory(string $referrer): string
    {
        if (empty($referrer)) {
            return 'Direct';
        }

        $host = strtolower(parse_url($referrer, PHP_URL_HOST) ?? '');
        $host = ltrim($host, 'www.');

        if (str_contains($host, 'google.')) {
            return 'Google';
        }
        if (str_contains($host, 'facebook.com') || str_contains($host, 'fb.com') || str_contains($host, 'instagram.com')) {
            return 'Facebook';
        }
        if (str_contains($host, 'x.com') || str_contains($host, 'twitter.com') || str_contains($host, 't.co')) {
            return 'X';
        }
        if (str_contains($host, 'telegram.') || str_contains($host, 't.me')) {
            return 'Telegram';
        }

        return 'Other';
    }

    // ─── Browser ──────────────────────────────────────────────────────────

    /**
     * Parse the browser name from a User-Agent string.
     * Returns one of: Chrome / Firefox / Edge / Safari / Other
     */
    public static function parseBrowser(string $userAgent): string
    {
        $ua = strtolower($userAgent);

        // Edge must be checked before Chrome (Edge UA contains "chrome")
        if (str_contains($ua, 'edg/') || str_contains($ua, 'edge/')) {
            return 'Edge';
        }
        if (str_contains($ua, 'chrome') || str_contains($ua, 'chromium')) {
            return 'Chrome';
        }
        if (str_contains($ua, 'firefox')) {
            return 'Firefox';
        }
        // Safari must be checked after Chrome (Safari UA also contains "safari")
        if (str_contains($ua, 'safari')) {
            return 'Safari';
        }

        return 'Other';
    }

    // ─── Session ID ───────────────────────────────────────────────────────

    /**
     * Generate a pseudonymous session ID.
     * SHA256 of (IP + UA + date) — stateless, no cookie, no raw IP stored.
     * Changes daily so there is no cross-day tracking.
     */
    public static function generateSessionId(string $ip, string $userAgent, string $date): string
    {
        return hash('sha256', $ip . '|' . $userAgent . '|' . $date);
    }

    // ─── Redis Key Builders ───────────────────────────────────────────────
    // All keys partition by WEBSITE (not publisher).
    // publisher_id is only stored in MySQL for rollup queries — never in Redis keys.

    /** traffic:active:{website_id} — 30-min HLL for active visitors */
    public static function keyActive(string $websiteId): string
    {
        return "traffic:active:{$websiteId}";
    }

    /** traffic:hourly:{website_id}:{date}:{hour}:{device} — HASH: visits, unique_visitors */
    public static function keyHourly(string $websiteId, string $date, int $hour, string $device): string
    {
        return "traffic:hourly:{$websiteId}:{$date}:{$hour}:{$device}";
    }

    /** traffic:hll:{website_id}:{date} — daily HLL for unique visitor count */
    public static function keyDailyHll(string $websiteId, string $date): string
    {
        return "traffic:hll:{$websiteId}:{$date}";
    }

    /** traffic:geo:{website_id}:{date} — ZSET: country_code → visit count */
    public static function keyGeo(string $websiteId, string $date): string
    {
        return "traffic:geo:{$websiteId}:{$date}";
    }

    /** traffic:ref:{website_id}:{date} — ZSET: referrer_category → count */
    public static function keyReferrer(string $websiteId, string $date): string
    {
        return "traffic:ref:{$websiteId}:{$date}";
    }

    /** traffic:browser:{website_id}:{date} — ZSET: browser → count */
    public static function keyBrowser(string $websiteId, string $date): string
    {
        return "traffic:browser:{$websiteId}:{$date}";
    }

    /** traffic:session:{session_id} — existence flag, 30-min TTL (unchanged) */
    public static function keySession(string $sessionId): string
    {
        return "traffic:session:{$sessionId}";
    }

    /** traffic:anomaly:window:{website_id}:{date}:{hour} — rolling 15-min counters */
    public static function keyAnomalyWindow(string $websiteId, string $date, int $hour): string
    {
        return "traffic:anomaly:window:{$websiteId}:{$date}:{$hour}";
    }

    /** traffic:email_throttle:{publisher_id} — 1h throttle per publisher (not per website) */
    public static function keyEmailThrottle(string $publisherId): string
    {
        return "traffic:email_throttle:{$publisherId}";
    }

    // ─── Cache Fallback (MySQL/Shared Hosting) Helpers ────────────────────

    public static function trackActiveVisitorFallback(string $websiteId, string $sessionId): void
    {
        $cacheKey = "active_visitors_fallback:{$websiteId}";
        $now = time();
        
        $sessions = \Illuminate\Support\Facades\Cache::get($cacheKey, []);
        if (!is_array($sessions)) {
            $sessions = [];
        }
        
        $threshold = $now - 1800; // 30-min window
        $activeSessions = [];
        foreach ($sessions as $sid => $lastSeen) {
            if ($lastSeen >= $threshold) {
                $activeSessions[$sid] = $lastSeen;
            }
        }
        
        $activeSessions[$sessionId] = $now;
        \Illuminate\Support\Facades\Cache::put($cacheKey, $activeSessions, 1800);
    }

    public static function getActiveVisitorsCountFallback(string $websiteId): int
    {
        $cacheKey = "active_visitors_fallback:{$websiteId}";
        $sessions = \Illuminate\Support\Facades\Cache::get($cacheKey, []);
        if (!is_array($sessions)) {
            return 0;
        }
        
        $now = time();
        $threshold = $now - 1800;
        $count = 0;
        foreach ($sessions as $sid => $lastSeen) {
            if ($lastSeen >= $threshold) {
                $count++;
            }
        }
        return $count;
    }

    public static function trackUniqueVisitorFallback(string $websiteId, string $sessionId, string $date, int $hour): array
    {
        $isDailyUnique = false;
        $isHourlyUnique = false;

        // Daily uniqueness check
        $dailyKey = "uniq_vis:{$websiteId}:{$date}:{$sessionId}";
        if (!\Illuminate\Support\Facades\Cache::has($dailyKey)) {
            \Illuminate\Support\Facades\Cache::put($dailyKey, true, 172800); // 48h TTL
            $isDailyUnique = true;

            $dailyCountKey = "uniq_vis_count:{$websiteId}:{$date}";
            $count = (int) \Illuminate\Support\Facades\Cache::get($dailyCountKey, 0) + 1;
            \Illuminate\Support\Facades\Cache::put($dailyCountKey, $count, 172800);
        }

        // Hourly uniqueness check
        $hourlyKey = "uniq_vis:{$websiteId}:{$date}:{$hour}:{$sessionId}";
        if (!\Illuminate\Support\Facades\Cache::has($hourlyKey)) {
            \Illuminate\Support\Facades\Cache::put($hourlyKey, true, 7200); // 2h TTL
            $isHourlyUnique = true;

            $hourlyCountKey = "uniq_vis_count:{$websiteId}:{$date}:{$hour}";
            $count = (int) \Illuminate\Support\Facades\Cache::get($hourlyCountKey, 0) + 1;
            \Illuminate\Support\Facades\Cache::put($hourlyCountKey, $count, 7200);
        }

        return [
            'daily_unique' => $isDailyUnique,
            'hourly_unique' => $isHourlyUnique,
            'daily_unique_count' => (int) \Illuminate\Support\Facades\Cache::get("uniq_vis_count:{$websiteId}:{$date}", 0),
            'hourly_unique_count' => (int) \Illuminate\Support\Facades\Cache::get("uniq_vis_count:{$websiteId}:{$date}:{$hour}", 0),
        ];
    }

    public static function incrementCacheMetadata(string $websiteId, string $date, string $countryCode, string $referrerCategory, string $browser): void
    {
        $ttl = 172800; // 48 hours

        // Country code
        if ($countryCode !== 'XX') {
            $geoKey = "daily_geo:{$websiteId}:{$date}";
            $geo = \Illuminate\Support\Facades\Cache::get($geoKey, []);
            if (!is_array($geo)) $geo = [];
            $geo[$countryCode] = ($geo[$countryCode] ?? 0) + 1;
            \Illuminate\Support\Facades\Cache::put($geoKey, $geo, $ttl);
        }

        // Referrer
        $refKey = "daily_ref:{$websiteId}:{$date}";
        $ref = \Illuminate\Support\Facades\Cache::get($refKey, []);
        if (!is_array($ref)) $ref = [];
        $ref[$referrerCategory] = ($ref[$referrerCategory] ?? 0) + 1;
        \Illuminate\Support\Facades\Cache::put($refKey, $ref, $ttl);

        // Browser
        $browserKey = "daily_browser:{$websiteId}:{$date}";
        $br = \Illuminate\Support\Facades\Cache::get($browserKey, []);
        if (!is_array($br)) $br = [];
        $br[$browser] = ($br[$browser] ?? 0) + 1;
        \Illuminate\Support\Facades\Cache::put($browserKey, $br, $ttl);
    }

    public static function getCacheMetadata(string $websiteId, string $date): array
    {
        $geo = \Illuminate\Support\Facades\Cache::get("daily_geo:{$websiteId}:{$date}", []);
        $ref = \Illuminate\Support\Facades\Cache::get("daily_ref:{$websiteId}:{$date}", []);
        $br  = \Illuminate\Support\Facades\Cache::get("daily_browser:{$websiteId}:{$date}", []);

        if (!is_array($geo)) $geo = [];
        if (!is_array($ref)) $ref = [];
        if (!is_array($br))  $br = [];

        arsort($geo);
        arsort($ref);
        arsort($br);

        $topCountries = [];
        foreach (array_slice($geo, 0, 10, true) as $code => $count) {
            $topCountries[] = ['code' => (string) $code, 'visits' => (int) $count];
        }

        $topReferrers = [];
        foreach (array_slice($ref, 0, 6, true) as $source => $count) {
            $topReferrers[] = ['source' => (string) $source, 'visits' => (int) $count];
        }

        $topBrowsers = [];
        foreach ($br as $browserName => $count) {
            $topBrowsers[] = ['browser' => (string) $browserName, 'visits' => (int) $count];
        }

        return [
            'top_countries' => $topCountries,
            'countries_count' => count($geo),
            'top_referrers' => $topReferrers,
            'top_browsers' => $topBrowsers,
        ];
    }
}

