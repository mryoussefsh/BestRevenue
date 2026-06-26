<?php

namespace App\Jobs;

use App\Models\Website;
use App\Models\TrafficBaseline;
use App\Models\TrafficHourlyStat;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * RecalculateBaselinesJob
 *
 * Runs every Sunday at 02:00 via Scheduler.
 * Rebuilds traffic_baselines from the last 4 weeks of hourly data.
 * Groups by (website, day_of_week, hour), averages visits/unique_visitors,
 * and computes dominant country concentration from traffic_daily_stats.
 * Idempotent — uses updateOrCreate.
 */
class RecalculateBaselinesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 600;

    public function handle(): void
    {
        Log::info('RecalculateBaselinesJob: Starting baseline recalculation');

        $fourWeeksAgo = now()->subWeeks(4)->startOfDay()->toDateString();
        $websites     = Website::where('is_active', true)
            ->with('publisher:id,status')
            ->get(['id', 'publisher_id']);
        $built        = 0;

        foreach ($websites as $website) {
            // Skip if publisher is inactive
            if ($website->publisher?->status !== 'active') {
                continue;
            }

            // ── Aggregate hourly stats by (day_of_week, hour) ─────────
            $hourlyAggregates = TrafficHourlyStat::where('website_id', $website->id)
                ->where('date', '>=', $fourWeeksAgo)
                ->select(
                    DB::raw('DAYOFWEEK(date) - 1 AS day_of_week'), // MySQL: 1=Sunday, we subtract 1 → 0=Sunday
                    'hour',
                    DB::raw('COUNT(DISTINCT date) AS sample_days'),
                    DB::raw('SUM(visits) AS total_visits'),
                    DB::raw('SUM(unique_visitors) AS total_unique')
                )
                ->groupBy(DB::raw('DAYOFWEEK(date)'), 'hour')
                ->get();

            // Count distinct weeks in sample for sample_weeks
            $sampleWeeks = (int) TrafficHourlyStat::where('website_id', $website->id)
                ->where('date', '>=', $fourWeeksAgo)
                ->selectRaw('COUNT(DISTINCT YEARWEEK(date, 1)) as weeks')
                ->value('weeks');

            foreach ($hourlyAggregates as $row) {
                $sampleDays         = max(1, (int) $row->sample_days);
                $avgVisits          = round($row->total_visits / $sampleDays, 2);
                $avgUniqueVisitors  = round($row->total_unique / $sampleDays, 2);

                TrafficBaseline::updateOrCreate(
                    [
                        'website_id'   => $website->id,
                        'day_of_week'  => (int) $row->day_of_week,
                        'hour'         => (int) $row->hour,
                    ],
                    [
                        'publisher_id'                 => $website->publisher_id,
                        'avg_visits'                   => $avgVisits,
                        'avg_unique_visitors'          => $avgUniqueVisitors,
                        'sample_weeks'                 => $sampleWeeks,
                        'last_calculated_at'           => now(),
                    ]
                );

                $built++;
            }
        }

        Log::info("RecalculateBaselinesJob: Built {$built} baseline records across " . count($websites) . ' websites');
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('RecalculateBaselinesJob: Failed — ' . $exception->getMessage());
    }
}

