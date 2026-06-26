<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PeriodClosing;
use App\Models\RevenueRecord;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RevenueController extends Controller
{
    /**
     * DELETE /api/v1/admin/revenue/wipe
     *
     * FIX [RW-1]: Added multiple safety guards before allowing revenue wipe:
     * 1. Requires explicit confirmation token (confirm=WIPE)
     * 2. Blocks deletion if any closed periods exist (financial history protection)
     * 3. Creates a mandatory audit log entry with count of records deleted
     * 4. Returns a detailed summary instead of silently truncating
     */
    public function wipe(Request $request): JsonResponse
    {
        // Guard 1: Require explicit confirmation token
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json([
                'message' => 'Revenue wipe requires explicit confirmation. Pass {"confirm": "WIPE"} in the request body.',
            ], 422);
        }

        // Guard 2: Block wipe if any closed period closings exist
        $closedPeriodCount = PeriodClosing::where('status', 'closed')->count();
        if ($closedPeriodCount > 0) {
            return response()->json([
                'message' => "Cannot wipe revenue data: {$closedPeriodCount} closed period(s) exist. " .
                             "Wiping would corrupt financial history. Delete the period closings first if you are absolutely certain.",
                'closed_periods' => $closedPeriodCount,
            ], 422);
        }

        // Gather stats before deletion for the audit log
        $totalRecords = RevenueRecord::count();
        $totalSyncLogs = \App\Models\GamSyncLog::count();

        // Guard 3: Audit log BEFORE deletion (so even if deletion fails, the intent is logged)
        AuditLogService::log(
            'revenue_wipe',
            'RevenueRecord',
            null,
            ['revenue_records_count' => $totalRecords, 'sync_logs_count' => $totalSyncLogs],
            ['action' => 'TRUNCATE ALL', 'requested_by_ip' => $request->ip(), 'confirm_token_provided' => true]
        );

        // Perform the truncation
        RevenueRecord::truncate();
        \App\Models\GamSyncLog::truncate();

        \App\Models\RevenueRecord::clearCache();

        return response()->json([
            'message'             => 'All revenue records and sync logs have been permanently deleted.',
            'records_deleted'     => $totalRecords,
            'sync_logs_deleted'   => $totalSyncLogs,
        ]);
    }

    /**
     * GET /api/v1/admin/revenue
     */
    public function index(Request $request): JsonResponse
    {
        $cacheVersion = \App\Models\RevenueRecord::getCacheVersion();
        $cacheKey = "admin_revenue_v_{$cacheVersion}_" . md5(json_encode($request->all()));

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($request) {
            $query = RevenueRecord::select('revenue_records.*')
                ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
                ->join('websites', 'ad_units.website_id', '=', 'websites.id')
                ->join('publishers', 'websites.publisher_id', '=', 'publishers.id')
                ->leftJoin('period_closings', 'revenue_records.period_closing_id', '=', 'period_closings.id')
                ->with([
                    'adUnit' => function ($q) {
                        $q->select('id', 'website_id', 'display_name', 'gam_ad_unit_name');
                    },
                    'adUnit.website' => function ($q) {
                        $q->select('id', 'publisher_id', 'domain');
                    },
                    'adUnit.website.publisher' => function ($q) {
                        $q->select('id', 'name', 'email');
                    },
                    'periodClosing:id,status'
                ]);

            if ($request->filled('publisher_id') || $request->filled('website_id') || $request->filled('ad_unit_id')) {
                $adUnitQuery = \App\Models\AdUnit::query();
                
                if ($request->filled('ad_unit_id')) {
                    $adUnitQuery->where('id', $request->query('ad_unit_id'));
                } elseif ($request->filled('website_id')) {
                    $adUnitQuery->where('website_id', $request->query('website_id'));
                } elseif ($request->filled('publisher_id')) {
                    $publisherId = $request->query('publisher_id');
                    $adUnitQuery->whereIn('website_id', function ($q) use ($publisherId) {
                        $q->select('id')->from('websites')->where('publisher_id', $publisherId);
                    });
                }
                
                $adUnitIds = $adUnitQuery->pluck('id')->toArray();
                $query->whereIn('revenue_records.ad_unit_id', $adUnitIds);
            }

            if ($request->filled('ad_unit_name')) {
                $name = $request->query('ad_unit_name');
                $query->where(function ($q) use ($name) {
                    $q->where('ad_units.display_name', 'like', "%{$name}%")
                      ->orWhere('ad_units.gam_ad_unit_name', 'like', "%{$name}%");
                });
            }

            if ($request->filled('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('ad_units.display_name', 'like', "%{$search}%")
                      ->orWhere('ad_units.gam_ad_unit_name', 'like', "%{$search}%")
                      ->orWhere('websites.domain', 'like', "%{$search}%")
                      ->orWhere('publishers.name', 'like', "%{$search}%")
                      ->orWhere('publishers.email', 'like', "%{$search}%");
                });
            }

            if ($request->filled('date_from')) {
                $query->where('revenue_records.date', '>=', $request->query('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->where('revenue_records.date', '<=', $request->query('date_to'));
            }

            if ($request->filled('gam_account_id')) {
                $query->where('websites.gam_account_id', $request->query('gam_account_id'));
            }

            if ($request->filled('status')) {
                $status = $request->query('status');
                if ($status === 'closed') {
                    $query->whereNotNull('revenue_records.period_closing_id');
                } elseif ($status === 'approved') {
                    $limitDate = RevenueRecord::getApprovedLimitDate()->startOfDay();
                    $query->whereNull('revenue_records.period_closing_id')
                          ->where('revenue_records.date', '<=', $limitDate);
                } elseif ($status === 'pending') {
                    $limitDate = RevenueRecord::getApprovedLimitDate()->startOfDay();
                    $query->whereNull('revenue_records.period_closing_id')
                          ->where('revenue_records.date', '>', $limitDate);
                }
            }

            // FIX: Reduced from 2000 to 500 records per page to prevent JSON serialization memory spikes
            $records = $query->orderBy('revenue_records.date', 'desc')
                             ->orderBy('revenue_records.hour', 'desc')
                             ->paginate(500);

            return $records->toArray();
        });

        return response()->json($data);
    }
}
