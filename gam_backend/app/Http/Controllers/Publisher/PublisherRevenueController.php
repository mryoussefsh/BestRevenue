<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use App\Models\RevenueRecord;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublisherRevenueController extends Controller
{
    /**
     * GET /api/v1/publisher/revenue
     */
    public function index(Request $request): JsonResponse
    {
        $publisher = $request->user()->publisher;
        if (!$publisher) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }
        $publisherId = $publisher->id;

        $cacheVersion = RevenueRecord::getCacheVersion();
        $cacheKey = "publisher_revenue_{$publisherId}_v_{$cacheVersion}_" . md5(json_encode($request->all()));

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($request, $publisherId, $publisher) {
            $lastSyncTime = RevenueRecord::join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
                ->join('websites', 'ad_units.website_id', '=', 'websites.id')
                ->where('websites.publisher_id', $publisherId)
                ->max('revenue_records.synced_at');

            if (!$lastSyncTime) {
                $lastSyncTime = \App\Models\GamAccount::whereHas('websites', function($q) use ($publisherId) {
                    $q->where('publisher_id', $publisherId);
                })->max('last_synced_at');
            }

            $query = RevenueRecord::select('revenue_records.*')
                ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
                ->join('websites', 'ad_units.website_id', '=', 'websites.id')
                ->where('websites.publisher_id', $publisherId)
                ->with([
                    'adUnit:id,website_id,display_name',
                    'adUnit.website:id,domain'
                ]);

            if ($request->filled('website_id')) {
                $query->where('ad_units.website_id', $request->query('website_id'));
            }

            if ($request->filled('ad_unit_id')) {
                $query->where('revenue_records.ad_unit_id', $request->query('ad_unit_id'));
            }

            if ($request->filled('date_from')) {
                $query->where('revenue_records.date', '>=', $request->query('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->where('revenue_records.date', '<=', $request->query('date_to'));
            }

            // Clone query for aggregates before status filter
            $totalsQuery = clone $query;

            if ($request->filled('status')) {
                $status = $request->query('status');
                $approvedLimitDate = \App\Models\RevenueRecord::getApprovedLimitDate()->format('Y-m-d');
                if ($status === 'closed') {
                    $query->whereNotNull('revenue_records.period_closing_id');
                } elseif ($status === 'approved') {
                    $query->whereNull('revenue_records.period_closing_id')
                          ->where('revenue_records.date', '<=', $approvedLimitDate);
                } elseif ($status === 'pending') {
                    $query->whereNull('revenue_records.period_closing_id')
                          ->where('revenue_records.date', '>', $approvedLimitDate);
                }
            }

            $perPage = (int) $request->query('per_page', 100);
            if ($perPage < 1 || $perPage > 2000) {
                $perPage = 100;
            }

            if ($request->boolean('dashboard')) {
                $records = new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage);
            } else {
                $records = $query->orderBy('revenue_records.date', 'desc')
                                 ->orderBy('revenue_records.hour', 'desc')
                                 ->paginate($perPage);
            }

            // Run aggregates on totalsQuery (which excludes status filter, but includes dates/websites)
            $approvedLimitDate = \App\Models\RevenueRecord::getApprovedLimitDate()->format('Y-m-d');
            $totalsQuery->getQuery()->columns = [];
            $totalsQuery->setEagerLoads([]);
            $aggregates = $totalsQuery->selectRaw("
                SUM(CASE WHEN revenue_records.period_closing_id IS NOT NULL THEN revenue_records.publisher_earnings ELSE 0 END) as closed_earnings,
                SUM(CASE WHEN revenue_records.period_closing_id IS NULL AND revenue_records.date <= '{$approvedLimitDate}' THEN revenue_records.publisher_earnings ELSE 0 END) as approved_earnings,
                SUM(CASE WHEN revenue_records.period_closing_id IS NULL AND revenue_records.date > '{$approvedLimitDate}' THEN revenue_records.publisher_earnings ELSE 0 END) as pending_earnings,
                SUM(ROUND(revenue_records.impressions * revenue_records.ratio_applied, 0)) as total_impressions,
                SUM(ROUND(revenue_records.unfilled_impressions * revenue_records.ratio_applied, 0)) as total_unfilled,
                SUM(revenue_records.clicks) as total_clicks,
                SUM(revenue_records.impressions) as raw_total_impressions_internal,
                SUM(ROUND(revenue_records.active_view_eligible_impressions * revenue_records.ratio_applied, 0)) as total_active_view_eligible,
                SUM(ROUND(revenue_records.active_view_viewable_impressions * revenue_records.ratio_applied, 0)) as total_active_view_viewable
            ")->first();

            // Compute daily performance records grouped by date for the dashboard
            $dailyStatsQuery = clone $query;
            $dailyStatsQuery->getQuery()->columns = [];
            $dailyStatsQuery->setEagerLoads([]);
            $dailyStats = $dailyStatsQuery->selectRaw("
                revenue_records.date,
                SUM(ROUND(revenue_records.impressions * revenue_records.ratio_applied, 0)) as impressions,
                SUM(ROUND(revenue_records.unfilled_impressions * revenue_records.ratio_applied, 0)) as unfilled_impressions,
                SUM(revenue_records.clicks) as clicks,
                SUM(revenue_records.publisher_earnings) as earnings,
                SUM(CASE WHEN revenue_records.period_closing_id IS NOT NULL OR revenue_records.date <= '{$approvedLimitDate}' THEN revenue_records.publisher_earnings ELSE 0 END) as approved,
                SUM(CASE WHEN revenue_records.period_closing_id IS NULL AND revenue_records.date > '{$approvedLimitDate}' THEN revenue_records.publisher_earnings ELSE 0 END) as pending,
                SUM(revenue_records.impressions) as raw_impressions
            ")
            ->groupBy('revenue_records.date')
            ->orderBy('revenue_records.date', 'asc')
            ->get();

            $dailyStatsMapped = $dailyStats->map(function ($row) {
                $rawImpressions = (int) $row->raw_impressions;
                $revenueEligibleImpressions = (int) $row->impressions;
                $clicks = (int) $row->clicks;
                $earnings = (float) $row->earnings;

                $ctr = $rawImpressions > 0 ? round(($clicks / $rawImpressions) * 100, 6) : 0.0;
                $cpm = $revenueEligibleImpressions > 0 ? round(($earnings / $revenueEligibleImpressions) * 1000, 4) : 0.0;

                return [
                    'date' => $row->date ? $row->date->format('Y-m-d') : null,
                    'impressions' => $revenueEligibleImpressions,
                    'unfilled_impressions' => (int) $row->unfilled_impressions,
                    'clicks' => $clicks,
                    'ctr' => $ctr,
                    'cpm' => $cpm,
                    'approved' => (float) $row->approved,
                    'pending' => (float) $row->pending,
                    'earnings' => $earnings,
                ];
            })->values()->all();

            return [
                'current_page' => $records->currentPage(),
                'data' => $records->map(function ($record) {
                    $revEligible         = (int) round($record->impressions * $record->ratio_applied);
                    $revEligibleUnfilled = (int) round($record->unfilled_impressions * $record->ratio_applied);
                    $revEligibleCpm      = $revEligible > 0
                        ? round($record->publisher_earnings / $revEligible * 1000, 4)
                        : 0.0;
                    $revEligibleAvElig   = (int) round($record->active_view_eligible_impressions * $record->ratio_applied);
                    $revEligibleAvView   = (int) round($record->active_view_viewable_impressions  * $record->ratio_applied);

                    return [
                        'id'                          => $record->id,
                        'date'                        => $record->date ? $record->date->format('Y-m-d') : null,
                        'hour'                        => $record->hour,
                        'revenue_eligible_impressions'=> $revEligible,
                        'revenue_eligible_unfilled'   => $revEligibleUnfilled,
                        'revenue_eligible_av_eligible'=> $revEligibleAvElig,
                        'revenue_eligible_av_viewable'=> $revEligibleAvView,
                        'clicks'                      => $record->clicks,
                        'ctr'                         => (float) $record->ctr,
                        'publisher_earnings'          => (float) $record->publisher_earnings,
                        'publisher_cpm'               => $revEligibleCpm,
                        'is_closed'                   => $record->period_closing_id !== null,
                        'is_approved'                 => $record->is_approved,
                        'approval_status'             => $record->approval_status,
                        'ad_unit'                     => $record->adUnit ? [
                            'id'           => $record->adUnit->id,
                            'display_name' => $record->adUnit->display_name,
                            'website'      => $record->adUnit->website ? [
                                'id'     => $record->adUnit->website->id,
                                'domain' => $record->adUnit->website->domain,
                            ] : null
                        ] : null
                    ];
                })->all(),
                'last_page' => $records->lastPage(),
                'total'     => $records->total(),
                'pending_balance_adjustment' => (float) $publisher->pending_balance_adjustment,
                'payouts_sum' => (float) \App\Models\Payout::where('publisher_id', $publisher->id)->where('status', '!=', 'rejected')->sum('final_amount'),
                'last_sync_at' => $lastSyncTime ? \Carbon\Carbon::parse($lastSyncTime)->toIso8601String() : null,
                'aggregates' => [
                    'closed_earnings'   => (float) ($aggregates->closed_earnings ?? 0),
                    'approved_earnings' => (float) ($aggregates->approved_earnings ?? 0),
                    'pending_earnings'  => (float) ($aggregates->pending_earnings ?? 0),
                    'total_impressions' => (int) ($aggregates->total_impressions ?? 0),
                    'total_unfilled'    => (int) ($aggregates->total_unfilled ?? 0),
                    'total_clicks'      => (int) ($aggregates->total_clicks ?? 0),
                    'total_ctr'         => (float) (
                        ($aggregates->raw_total_impressions_internal ?? 0) > 0
                            ? round(($aggregates->total_clicks / $aggregates->raw_total_impressions_internal) * 100, 6)
                            : 0.0
                    ),
                    'total_active_view_eligible' => (int) ($aggregates->total_active_view_eligible ?? 0),
                    'total_active_view_viewable' => (int) ($aggregates->total_active_view_viewable ?? 0),
                ],
                'daily_stats' => $dailyStatsMapped,
            ];
        });

        return response()->json($data);
    }

    /**
     * GET /api/v1/publisher/revenue/pdf
     */
    public function exportPdf(Request $request)
    {
        $publisher = $request->user()->publisher;
        $dateFrom = $request->query('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo   = $request->query('date_to',   now()->endOfMonth()->format('Y-m-d'));
        $locale   = $request->query('locale', 'en'); // en or ar

        // FIX [PUB-VIEW-2]: Enforce a maximum date range to prevent full-table loads.
        // Loading 12 months × N ad units of records into memory can exhaust PHP memory.
        $diffDays = \Carbon\Carbon::parse($dateFrom)->diffInDays(\Carbon\Carbon::parse($dateTo));
        if ($diffDays > 93) {
            return response()->json([
                'message' => 'Date range cannot exceed 3 months (93 days) for PDF export. Please split into smaller date ranges.',
            ], 422);
        }

        $query = RevenueRecord::select('revenue_records.*')
            ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
            ->join('websites', 'ad_units.website_id', '=', 'websites.id')
            ->where('websites.publisher_id', $publisher->id)
            ->whereBetween('revenue_records.date', [$dateFrom, $dateTo]);

        if ($request->filled('website_id')) {
            $query->where('ad_units.website_id', $request->query('website_id'));
        }

        if ($request->filled('ad_unit_id')) {
            $query->where('revenue_records.ad_unit_id', $request->query('ad_unit_id'));
        }

        if ($request->filled('status')) {
            $status = $request->query('status');
            $approvedLimitDate = \App\Models\RevenueRecord::getApprovedLimitDate()->format('Y-m-d');
            if ($status === 'closed') {
                $query->whereNotNull('revenue_records.period_closing_id');
            } elseif ($status === 'approved') {
                $query->whereNull('revenue_records.period_closing_id')
                      ->where('revenue_records.date', '<=', $approvedLimitDate);
            } elseif ($status === 'pending') {
                $query->whereNull('revenue_records.period_closing_id')
                      ->where('revenue_records.date', '>', $approvedLimitDate);
            }
        }

        $records = $query->limit(5000)->get();

        $isTruncated   = count($records) >= 5000;
        $totalEarnings = $records->sum('publisher_earnings');

        $mappedRecords = $records->map(function ($record) {
            $revEligible = (int) round($record->impressions * $record->ratio_applied);
            return (object) [
                'id' => $record->id,
                'date' => $record->date,
                'hour' => $record->hour,
                'impressions' => $revEligible, // keep 'impressions' key for blade view compatibility
                'publisher_earnings' => $record->publisher_earnings,
                'adUnit' => $record->adUnit,
            ];
        });

        $totalImpressions = $mappedRecords->sum('impressions');

        $logoUrl = \App\Models\Setting::get('site_logo');
        $siteLogoBase64 = null;
        if ($logoUrl && extension_loaded('gd')) {
            if (str_contains($logoUrl, '/storage/')) {
                $relativePath = explode('/storage/', $logoUrl)[1] ?? null;
                if ($relativePath) {
                    $localPath = storage_path('app/public/' . $relativePath);
                    if (file_exists($localPath)) {
                        $type = pathinfo($localPath, PATHINFO_EXTENSION);
                        $fileData = @file_get_contents($localPath);
                        if ($fileData) {
                            $siteLogoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($fileData);
                        }
                    }
                }
            }
            if (!$siteLogoBase64) {
                $siteLogoBase64 = $logoUrl;
            }
        }

        $siteDescription = \App\Models\Setting::get('site_description', 'Enterprise-grade multi-account Google Ad Manager revenue sharing and publisher portal.');
        $siteName = \App\Models\Setting::get('site_name', 'Mindora X');

        $data = [
            'publisher'        => $publisher,
            'dateFrom'         => $dateFrom,
            'dateTo'           => $dateTo,
            'records'          => $mappedRecords,
            'totalEarnings'    => $totalEarnings,
            'totalImpressions' => $totalImpressions,
            'locale'           => $locale,
            'isTruncated'      => $isTruncated,
            'siteLogo'         => $siteLogoBase64,
            'siteDescription'  => $siteDescription,
            'siteName'         => $siteName,
        ];

        // Ensure the view exists: resources/views/pdf/statement.blade.php
        $pdf = Pdf::loadView('pdf.statement', $data);

        return $pdf->download("earnings_statement_{$dateFrom}_to_{$dateTo}.pdf");
    }
}
