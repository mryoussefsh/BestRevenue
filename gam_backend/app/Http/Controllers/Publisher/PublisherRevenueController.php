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

        $records = $query->orderBy('revenue_records.date', 'desc')
                         ->orderBy('revenue_records.hour', 'desc')
                         ->paginate($perPage);

        // Run aggregates on totalsQuery (which excludes status filter, but includes dates/websites)
        $approvedLimitDate = \App\Models\RevenueRecord::getApprovedLimitDate()->format('Y-m-d');
        $totalsQuery->getQuery()->columns = [];
        $totalsQuery->setEagerLoads([]);
        $aggregates = $totalsQuery->selectRaw("
            SUM(CASE WHEN revenue_records.period_closing_id IS NOT NULL THEN revenue_records.publisher_earnings ELSE 0 END) as closed_earnings,
            SUM(CASE WHEN revenue_records.period_closing_id IS NULL AND revenue_records.date <= '{$approvedLimitDate}' THEN revenue_records.publisher_earnings ELSE 0 END) as approved_earnings,
            SUM(CASE WHEN revenue_records.period_closing_id IS NULL AND revenue_records.date > '{$approvedLimitDate}' THEN revenue_records.publisher_earnings ELSE 0 END) as pending_earnings,
            SUM(revenue_records.impressions) as total_impressions,
            SUM(revenue_records.unfilled_impressions) as total_unfilled,
            SUM(revenue_records.clicks) as total_clicks
        ")->first();

        // Map to hide admin fields
        return response()->json([
            'current_page' => $records->currentPage(),
            'data' => $records->map(function ($record) {
                return [
                    'id'                 => $record->id,
                    'date'               => $record->date ? $record->date->format('Y-m-d') : null,
                    'hour'               => $record->hour,
                    // FIX [PUB-VIEW-1]: 'country' removed — column was dropped in migration
                    // 2026_06_04_225937_remove_country_from_revenue_records_table.php
                    'impressions'        => $record->impressions,
                    'unfilled_impressions' => $record->unfilled_impressions,
                    'active_view_eligible_impressions' => (int) $record->active_view_eligible_impressions,
                    'active_view_viewable_impressions' => (int) $record->active_view_viewable_impressions,
                    'clicks'             => $record->clicks,
                    'ctr'                => (float) $record->ctr,
                    'publisher_earnings' => (float) $record->publisher_earnings,
                    'publisher_cpm'      => (float) $record->publisher_cpm,
                    'is_closed'          => $record->period_closing_id !== null,
                    'is_approved'        => $record->is_approved,
                    'approval_status'    => $record->approval_status,
                    'ad_unit'            => $record->adUnit ? [
                        'id'           => $record->adUnit->id,
                        'display_name' => $record->adUnit->display_name,
                        'website'      => $record->adUnit->website ? [
                            'id'     => $record->adUnit->website->id,
                            'domain' => $record->adUnit->website->domain,
                        ] : null
                    ] : null
                ];
            }),
            'last_page' => $records->lastPage(),
            'total'     => $records->total(),
            'pending_balance_adjustment' => (float) $publisher->pending_balance_adjustment,
            'last_sync_at' => $lastSyncTime ? \Carbon\Carbon::parse($lastSyncTime)->toIso8601String() : null,
            'aggregates' => [
                'closed_earnings'   => (float) ($aggregates->closed_earnings ?? 0),
                'approved_earnings' => (float) ($aggregates->approved_earnings ?? 0),
                'pending_earnings'  => (float) ($aggregates->pending_earnings ?? 0),
                'total_impressions' => (int) ($aggregates->total_impressions ?? 0),
                'total_unfilled'    => (int) ($aggregates->total_unfilled ?? 0),
                'total_clicks'      => (int) ($aggregates->total_clicks ?? 0),
            ]
        ]);
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
        $totalImpressions = $records->sum('impressions');

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
        $siteName = \App\Models\Setting::get('site_name', 'BestRevenue');

        $data = [
            'publisher'        => $publisher,
            'dateFrom'         => $dateFrom,
            'dateTo'           => $dateTo,
            'records'          => $records,
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
