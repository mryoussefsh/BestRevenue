<?php

namespace App\Services;

use App\Models\Website;
use App\Models\TrafficAnomaly;
use App\Models\TrafficBaseline;
use App\Models\TrafficDailyStat;
use App\Notifications\TrafficAnomalyNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Redis;

/**
 * AnomalyDetectionService
 *
 * Implements the 4 anomaly detection checks defined in the specification.
 * Each check method returns int (number of new anomalies recorded).
 *
 * Deduplication rule:
 *   Before inserting, check if an unresolved anomaly of the same
 *   (website_id, anomaly_type, metric_name) was created within the last 2 hours.
 *   If yes → skip insertion but optionally update deviation_pct if worse.
 *
 * Severity escalation:
 *   If an existing unresolved anomaly's deviation_pct worsens significantly,
 *   update severity and re-trigger notification.
 */
class AnomalyDetectionService
{
    // ─── CHECK 1 — Volume Spike / Drop ───────────────────────────────────

    public function checkVolumeAnomaly(Website $website, string $date, int $hour): int
    {
        $redis = Redis::connection();

        // Sum visits from anomaly window for this hour
        $windowKey    = TrafficService::keyAnomalyWindow($website->id, $date, $hour);
        $windowData   = $redis->hgetall($windowKey);
        $currentVisits = (int) ($windowData['visits'] ?? 0);

        if ($currentVisits === 0) {
            return 0;
        }

        // Get baseline for this day_of_week and hour
        $dayOfWeek = (int) now()->dayOfWeek; // 0=Sunday … 6=Saturday
        $baseline  = TrafficBaseline::where('website_id', $website->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('hour', $hour)
            ->first();

        if (!$baseline || $baseline->avg_visits < 1) {
            return 0; // no baseline yet — skip
        }

        $avgVisits    = (float) $baseline->avg_visits;
        $deviationPct = (($currentVisits - $avgVisits) / $avgVisits) * 100;

        // ── Spike detection ───────────────────────────────────────────
        if ($currentVisits > $avgVisits * 3.0) {
            $severity = match (true) {
                $currentVisits >= $avgVisits * 10.0 => 'critical',
                $currentVisits >= $avgVisits * 5.0  => 'high',
                default                             => 'medium',
            };

            $this->recordAnomaly([
                'website_id'     => $website->id,
                'publisher_id'   => $website->publisher_id,
                'website_domain' => $website->domain,
                'anomaly_type'   => 'volume_spike',
                'severity'       => $severity,
                'metric_name'    => 'visits',
                'baseline_value' => $avgVisits,
                'current_value'  => $currentVisits,
                'deviation_pct'  => $deviationPct,
                'context'        => [
                    'website_domain' => $website->domain,
                    'publisher_name' => $website->publisher?->name ?? 'Publisher',
                    'date'           => $date,
                    'hour'           => $hour,
                    'day_of_week'    => $dayOfWeek,
                    'sample_weeks'   => $baseline->sample_weeks,
                ],
            ]);

            return 1;
        }

        // ── Drop detection ────────────────────────────────────────────
        if ($currentVisits < $avgVisits * 0.2 && $avgVisits > 100) {
            $this->recordAnomaly([
                'website_id'     => $website->id,
                'publisher_id'   => $website->publisher_id,
                'website_domain' => $website->domain,
                'anomaly_type'   => 'volume_drop',
                'severity'       => 'low',
                'metric_name'    => 'visits',
                'baseline_value' => $avgVisits,
                'current_value'  => $currentVisits,
                'deviation_pct'  => $deviationPct,
                'context'        => [
                    'website_domain' => $website->domain,
                    'publisher_name' => $website->publisher?->name ?? 'Publisher',
                    'date'           => $date,
                    'hour'           => $hour,
                ],
            ]);

            return 1;
        }

        return 0;
    }

    // ─── CHECK 2 — Country Flood ──────────────────────────────────────────

    public function checkCountryFlood(Website $website, string $date): int
    {
        $redis  = Redis::connection();
        $geoKey = TrafficService::keyGeo($website->id, $date);

        // Get top country and total visits from ZSET
        $topEntry    = $redis->zrevrange($geoKey, 0, 0, ['WITHSCORES' => true]);
        if (empty($topEntry)) {
            return 0;
        }

        $topCountry      = (string) key($topEntry);
        $topCountryCount = (int) current($topEntry);
        $totalVisits     = (int) $redis->zcard($geoKey) > 0
            ? array_sum(array_values($redis->zrevrange($geoKey, 0, -1, ['WITHSCORES' => true])))
            : 0;

        if ($totalVisits < 50) {
            return 0; // not enough data
        }

        $concentration     = ($topCountryCount / $totalVisits) * 100;
        $dayOfWeek         = (int) now()->dayOfWeek;
        $hour              = (int) now()->format('G');

        $baseline = TrafficBaseline::where('website_id', $website->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('hour', $hour)
            ->first();

        $baselineConcentration = $baseline
            ? (float) $baseline->normal_country_concentration
            : 50.0; // assume 50% if no baseline

        if ($concentration <= $baselineConcentration + 30) {
            return 0;
        }

        // Determine severity based on whether top country changed
        $baselineTopCountry = $baseline?->top_country_code;
        $severity = ($baselineTopCountry && $topCountry !== $baselineTopCountry)
            ? 'high'
            : 'medium';

        $this->recordAnomaly([
            'website_id'     => $website->id,
            'publisher_id'   => $website->publisher_id,
            'website_domain' => $website->domain,
            'anomaly_type'   => 'country_flood',
            'severity'       => $severity,
            'metric_name'    => "country:{$topCountry}",
            'baseline_value' => $baselineConcentration,
            'current_value'  => $concentration,
            'deviation_pct'  => $concentration - $baselineConcentration,
            'context'        => [
                'website_domain'        => $website->domain,
                'publisher_name'        => $website->publisher?->name ?? 'Publisher',
                'top_country'           => $topCountry,
                'concentration_pct'     => round($concentration, 2),
                'baseline_country'      => $baselineTopCountry,
                'baseline_concentration'=> $baselineConcentration,
                'total_visits'          => $totalVisits,
                'date'                  => $date,
            ],
        ]);

        return 1;
    }

    // ─── CHECK 3 — Referrer Flood ─────────────────────────────────────────

    public function checkReferrerFlood(Website $website, string $date): int
    {
        $redis  = Redis::connection();
        $refKey = TrafficService::keyReferrer($website->id, $date);

        $topEntry = $redis->zrevrange($refKey, 0, 0, ['WITHSCORES' => true]);
        if (empty($topEntry)) {
            return 0;
        }

        $topReferrer      = (string) key($topEntry);
        $topReferrerCount = (int) current($topEntry);
        $allScores        = $redis->zrevrange($refKey, 0, -1, ['WITHSCORES' => true]);
        $totalVisits      = array_sum(array_values($allScores));

        if ($totalVisits < 50) {
            return 0;
        }

        $concentration = ($topReferrerCount / $totalVisits) * 100;

        // Trigger if one referrer exceeds 80% and baseline was below 50%
        if ($concentration <= 80) {
            return 0;
        }

        // Compare with historical referrer distribution from daily stats
        $recentStats = TrafficDailyStat::where('website_id', $website->id)
            ->where('date', '<', $date)
            ->orderBy('date', 'desc')
            ->limit(28)
            ->get(['top_referrers']);

        // Compute average concentration of this referrer in historical data
        $historicalConcentrations = [];
        foreach ($recentStats as $stat) {
            $refs = $stat->top_referrers ?? [];
            $total = array_sum(array_column($refs, 'visits'));
            foreach ($refs as $ref) {
                if ($ref['source'] === $topReferrer && $total > 0) {
                    $historicalConcentrations[] = ($ref['visits'] / $total) * 100;
                }
            }
        }

        $historicalAvg = !empty($historicalConcentrations)
            ? array_sum($historicalConcentrations) / count($historicalConcentrations)
            : 20.0; // assume 20% if no history

        if ($historicalAvg >= 50) {
            return 0; // this referrer was already dominant — not anomalous
        }

        $deviationPct = $concentration - $historicalAvg;

        $this->recordAnomaly([
            'website_id'     => $website->id,
            'publisher_id'   => $website->publisher_id,
            'website_domain' => $website->domain,
            'anomaly_type'   => 'referrer_flood',
            'severity'       => 'high',
            'metric_name'    => "referrer:{$topReferrer}",
            'baseline_value' => $historicalAvg,
            'current_value'  => $concentration,
            'deviation_pct'  => $deviationPct,
            'context'        => [
                'website_domain'   => $website->domain,
                'publisher_name'   => $website->publisher?->name ?? 'Publisher',
                'top_referrer'     => $topReferrer,
                'concentration_pct'=> round($concentration, 2),
                'historical_avg'   => round($historicalAvg, 2),
                'total_visits'     => $totalVisits,
                'date'             => $date,
            ],
        ]);

        return 1;
    }

    // ─── CHECK 4 — New Country Spike ─────────────────────────────────────

    public function checkNewCountrySpike(Website $website, string $date): int
    {
        $redis  = Redis::connection();
        $geoKey = TrafficService::keyGeo($website->id, $date);

        $allScores   = $redis->zrevrange($geoKey, 0, -1, ['WITHSCORES' => true]);
        $totalVisits = array_sum(array_values($allScores));

        if ($totalVisits < 50) {
            return 0;
        }

        // Get all countries this website has historically seen
        $knownCountries = TrafficDailyStat::where('website_id', $website->id)
            ->where('date', '<', $date)
            ->whereNotNull('top_countries')
            ->orderBy('date', 'desc')
            ->limit(90)
            ->get(['top_countries'])
            ->flatMap(fn($s) => collect($s->top_countries)->pluck('code'))
            ->unique()
            ->all();

        $recorded = 0;

        foreach ($allScores as $countryCode => $count) {
            $pct = ($count / $totalVisits) * 100;
            if ($pct < 5) {
                continue; // below 5% threshold
            }

            if (in_array($countryCode, $knownCountries, true)) {
                continue; // known country — not a new spike
            }

            $this->recordAnomaly([
                'website_id'     => $website->id,
                'publisher_id'   => $website->publisher_id,
                'website_domain' => $website->domain,
                'anomaly_type'   => 'new_country_spike',
                'severity'       => 'medium',
                'metric_name'    => "country:{$countryCode}",
                'baseline_value' => 0,
                'current_value'  => $count,
                'deviation_pct'  => $pct,
                'context'        => [
                    'website_domain'  => $website->domain,
                    'publisher_name'  => $website->publisher?->name ?? 'Publisher',
                    'new_country'     => $countryCode,
                    'visit_count'     => (int) $count,
                    'traffic_share'   => round($pct, 2),
                    'total_visits'    => $totalVisits,
                    'date'            => $date,
                ],
            ]);

            $recorded++;
        }

        return $recorded;
    }

    // ─── Internal: Record Anomaly ─────────────────────────────────────────

    /**
     * Record a new anomaly with deduplication and severity escalation.
     *
     * Deduplication: if an unresolved anomaly of the same
     * (website_id, anomaly_type, metric_name) exists within the last 2 hours,
     * skip insertion but update deviation_pct/severity if worsened.
     *
     * Returns the anomaly (new or existing) or null if fully deduplicated.
     */
    private function recordAnomaly(array $data): ?TrafficAnomaly
    {
        $twoHoursAgo = now()->subHours(2);

        $existing = TrafficAnomaly::where('website_id', $data['website_id'])
            ->where('anomaly_type', $data['anomaly_type'])
            ->where('metric_name', $data['metric_name'])
            ->where('is_resolved', false)
            ->where('created_at', '>=', $twoHoursAgo)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($existing) {
            // ── Severity escalation ───────────────────────────────────
            $prevSeverities = ['low' => 0, 'medium' => 1, 'high' => 2, 'critical' => 3];
            $prevLevel      = $prevSeverities[$existing->severity] ?? 0;
            $newLevel       = $prevSeverities[$data['severity']] ?? 0;

            $deviationWorsened = (float) $data['deviation_pct'] > (float) $existing->deviation_pct * 1.5;

            if ($newLevel > $prevLevel || $deviationWorsened) {
                $existing->update([
                    'severity'      => $data['severity'],
                    'deviation_pct' => $data['deviation_pct'],
                    'current_value' => $data['current_value'],
                    'context'       => $data['context'] ?? $existing->context,
                ]);

                // Re-notify on escalation if severity went up
                if ($newLevel > $prevLevel) {
                    $existing->update(['notification_sent' => false]);
                    $this->sendAnomalyNotification($existing);
                }
            }

            return $existing; // deduplicated — no new record
        }

        // ── Insert new anomaly ────────────────────────────────────────
        $anomaly = TrafficAnomaly::create(array_merge($data, [
            'detected_at'       => now(),
            'is_resolved'       => false,
            'notification_sent' => false,
        ]));

        $this->sendAnomalyNotification($anomaly);

        return $anomaly;
    }

    // ─── Notification ─────────────────────────────────────────────────────

    private function sendAnomalyNotification(TrafficAnomaly $anomaly): void
    {
        try {
            // Load the admin users to notify (all admin users)
            $admins = \App\Models\User::where('role', 'admin')
                ->where('is_active', true)
                ->get();

            if ($admins->isEmpty()) {
                return;
            }

            Notification::send($admins, new TrafficAnomalyNotification($anomaly));

            $anomaly->update(['notification_sent' => true]);
        } catch (\Throwable $e) {
            Log::error('AnomalyDetectionService: Failed to send notification for anomaly ' . $anomaly->id . ': ' . $e->getMessage());
        }
    }
}

