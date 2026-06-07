<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PeriodClosing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class PeriodClosingController extends Controller
{
    /**
     * GET /api/v1/admin/period-closings
     */
    public function index(): JsonResponse
    {
        $closings = PeriodClosing::withSum(['payouts' => function ($query) {
                                     $query->where('status', '!=', 'rejected');
                                 }], 'final_amount')
                                 ->orderBy('period_year', 'desc')
                                 ->orderBy('period_month', 'desc')
                                 ->paginate(50);

        return response()->json($closings);
    }

    /**
     * POST /api/v1/admin/period-closings/close
     *
     * FIX [PC-5]: Dispatches ClosePeriodJob instead of running Artisan::call()
     * synchronously. This prevents HTTP timeout for large publisher counts.
     * Returns 202 Accepted immediately; the close runs in the background.
     */
    public function close(Request $request): JsonResponse
    {
        $request->validate([
            'year'  => 'required|integer|min:2024',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year  = (int) $request->year;
        $month = (int) $request->month;

        // FIX [PC-6]: Validate the target is not the current or a future month (except in local or testing environments)
        $targetDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        if ($targetDate->gte(now()->startOfMonth()) && !app()->environment('local', 'testing')) {
            return response()->json([
                'message' => 'Cannot close the current or a future month.',
            ], 422);
        }

        // 1. Application-level advisory lock using Cache lock
        $lock = \Illuminate\Support\Facades\Cache::lock("period_close_lock_{$year}_{$month}", 600);
        if (!$lock->get()) {
            return response()->json([
                'message' => "Another close operation for {$year}-{$month} is currently in progress (advisory lock).",
            ], 422);
        }

        try {
            $response = \Illuminate\Support\Facades\DB::transaction(function () use ($year, $month, $request) {
                // 2. Database-level protection via row locking inside transaction
                $existing = PeriodClosing::where('period_year', $year)
                    ->where('period_month', $month)
                    ->lockForUpdate()
                    ->first();

                $endOfMonth  = \Carbon\Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
                $periodId = $existing ? $existing->id : null;

                // Identify if there are any remaining publishers with unclosed records
                $revenuePublishers = \App\Models\RevenueRecord::whereNull('period_closing_id')
                    ->where('date', '<=', $endOfMonth)
                    ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
                    ->join('websites', 'ad_units.website_id', '=', 'websites.id')
                    ->distinct()
                    ->pluck('websites.publisher_id')
                    ->toArray();

                $adjustmentPublishers = \App\Models\Adjustment::where('status', 'pending')
                    ->where(function ($q) use ($periodId) {
                        if ($periodId) {
                            $q->whereNull('period_closing_id')
                              ->orWhere('period_closing_id', '!=', $periodId);
                        }
                    })
                    ->where('created_at', '<=', $endOfMonth . ' 23:59:59')
                    ->distinct()
                    ->pluck('publisher_id')
                    ->toArray();

                $publisherIds = array_unique(array_merge($revenuePublishers, $adjustmentPublishers));

                if ($existing && $existing->status === 'closed' && count($publisherIds) === 0) {
                    return response()->json([
                        'message' => "Period {$year}-{$month} is already closed.",
                        'closing' => $existing,
                    ], 422);
                }

                if ($existing && $existing->status === 'closing') {
                    return response()->json([
                        'message' => "Period {$year}-{$month} is currently being closed. Use /period-closings/stuck to check status.",
                    ], 422);
                }

                // If not currently closing/closed (or re-running):
                if ($existing) {
                    $existing->update(['status' => 'closing']);
                } else {
                    PeriodClosing::create([
                        'id'          => \Illuminate\Support\Str::uuid()->toString(),
                        'period_year' => $year,
                        'period_month'=> $month,
                        'status'      => 'closing',
                        'notes'       => 'Initiated via admin controller close',
                    ]);
                }

                return null;
            });

            if ($response instanceof JsonResponse) {
                $lock->release();
                return $response;
            }

            // Dispatch the close job asynchronously
            \App\Jobs\ClosePeriodJob::dispatch($year, $month);

            \App\Services\AuditLogService::log('close_initiated', 'PeriodClosing', null, null, [
                'year'  => $year,
                'month' => $month,
                'initiated_by' => $request->user()?->id,
            ]);

            return response()->json([
                'message' => "Period {$year}-{$month} close has been initiated. It will complete in the background.",
                'year'    => $year,
                'month'   => $month,
            ], 202);

        } catch (\Illuminate\Database\QueryException $e) {
            $lock->release();
            return response()->json([
                'message' => 'Concurrent period closing operation detected. Please try again.',
            ], 422);
        } catch (\Exception $e) {
            $lock->release();
            return response()->json(['message' => 'Failed to close period: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/period-closings/{id}
     */
    public function show(string $id): JsonResponse
    {
        $closing = PeriodClosing::withSum(['payouts' => function ($query) {
                                     $query->where('status', '!=', 'rejected');
                                 }], 'final_amount')->findOrFail($id);
        
        // Load payouts for this closing
        $payouts = $closing->payouts()->with('publisher:id,name,email')->get();

        return response()->json([
            'closing' => $closing,
            'payouts' => $payouts,
        ]);
    }

    /**
     * DELETE /api/v1/admin/period-closings/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $closing = PeriodClosing::findOrFail($id);

        \Illuminate\Support\Facades\DB::beginTransaction();

        try {
            // Get all publishers affected by this closing's adjustments
            $affectedPublisherIds = \App\Models\Adjustment::where('period_closing_id', $id)
                ->distinct()
                ->pluck('publisher_id')
                ->toArray();

            // Delete pending carry-over adjustments created in this closing
            \App\Models\Adjustment::where('period_closing_id', $id)
                ->where('status', 'pending')
                ->delete();

            // 1. Reset manual adjustments applied in this closing
            \App\Models\Adjustment::where('period_closing_id', $id)
                ->where('status', 'applied')
                ->update([
                    'period_closing_id' => null,
                    'status' => 'pending'
                ]);

            // Sync pending balances after transaction commits
            \Illuminate\Support\Facades\DB::afterCommit(function () use ($affectedPublisherIds) {
                foreach ($affectedPublisherIds as $pubId) {
                    \App\Models\Publisher::syncPendingBalance($pubId);
                }
            });

            // 2. Delete payouts created in this closing
            \App\Models\Payout::where('period_closing_id', $id)->delete();

            // 3. Unlock locked revenue records
            \App\Models\RevenueRecord::where('period_closing_id', $id)
                ->update(['period_closing_id' => null]);

            // 4. Delete the period closing record itself
            $closing->delete();

            \Illuminate\Support\Facades\DB::commit();

            \App\Services\AuditLogService::log('deleted', 'PeriodClosing', $id, $closing->toArray(), null);

            return response()->json(['message' => 'Period closing deleted and records unlocked successfully.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to delete period closing.', 'error' => $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX [PC-2]: Recovery endpoints for stuck 'closing' state periods
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/period-closings/stuck
     * Lists all period closings currently stuck in 'closing' state.
     */
    public function listStuck(): JsonResponse
    {
        $stuck = PeriodClosing::where('status', 'closing')
            ->withCount('payouts')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'count' => $stuck->count(),
            'stuck_periods' => $stuck->map(fn($p) => [
                'id'           => $p->id,
                'period_year'  => $p->period_year,
                'period_month' => $p->period_month,
                'created_at'   => $p->created_at,
                'payouts_count'=> $p->payouts_count,
            ]),
        ]);
    }

    /**
     * POST /api/v1/admin/period-closings/{id}/recover-abort
     * Rolls back a stuck 'closing' period: unlocks all records, deletes partial payouts.
     */
    public function recoverAbort(string $id): JsonResponse
    {
        $closing = PeriodClosing::findOrFail($id);

        if ($closing->status !== 'closing') {
            return response()->json([
                'message' => "Period is in '{$closing->status}' status — not stuck. No recovery needed.",
            ], 422);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Get all publishers affected by this closing's adjustments
            $affectedPublisherIds = \App\Models\Adjustment::where('period_closing_id', $id)
                ->distinct()
                ->pluck('publisher_id')
                ->toArray();

            // Reset applied adjustments back to pending
            \App\Models\Adjustment::where('period_closing_id', $id)
                ->where('status', 'applied')
                ->update(['status' => 'pending', 'period_closing_id' => null]);

            // Delete pending carry-over adjustments
            \App\Models\Adjustment::where('period_closing_id', $id)
                ->where('status', 'pending')
                ->delete();

            // Sync pending balances after transaction commits
            \Illuminate\Support\Facades\DB::afterCommit(function () use ($affectedPublisherIds) {
                foreach ($affectedPublisherIds as $pubId) {
                    \App\Models\Publisher::syncPendingBalance($pubId);
                }
            });

            // Delete partial payouts
            $deletedPayouts = \App\Models\Payout::where('period_closing_id', $id)->delete();

            // Unlock revenue records
            $unlocked = \App\Models\RevenueRecord::where('period_closing_id', $id)
                ->update(['period_closing_id' => null]);

            // Delete the stuck PeriodClosing
            $closing->delete();

            \Illuminate\Support\Facades\DB::commit();

            \App\Services\AuditLogService::log(
                'period_closing_aborted',
                'PeriodClosing',
                $id,
                $closing->toArray(),
                ['action' => 'api_abort', 'records_unlocked' => $unlocked, 'payouts_deleted' => $deletedPayouts]
            );

            return response()->json([
                'message'         => 'Period closing aborted successfully. All records unlocked.',
                'records_unlocked'=> $unlocked,
                'payouts_deleted' => $deletedPayouts,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Recovery abort failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/period-closings/{id}/recover-complete
     * Finalizes a stuck 'closing' period by updating its status to 'closed'.
     */
    public function recoverComplete(string $id): JsonResponse
    {
        $closing = PeriodClosing::findOrFail($id);

        if ($closing->status !== 'closing') {
            return response()->json([
                'message' => "Period is in '{$closing->status}' status — not stuck. No recovery needed.",
            ], 422);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Recalculate totals from already-locked records
            $stats = \App\Models\RevenueRecord::where('period_closing_id', $id)
                ->select(
                    \Illuminate\Support\Facades\DB::raw('SUM(gross_revenue) as total_gross'),
                    \Illuminate\Support\Facades\DB::raw('SUM(publisher_earnings) as total_earnings'),
                    \Illuminate\Support\Facades\DB::raw('SUM(impressions) as total_impressions')
                )
                ->first();

            $closing->update([
                'total_gross_revenue'      => (float) ($stats->total_gross ?? 0),
                'total_publisher_earnings' => (float) ($stats->total_earnings ?? 0),
                'total_impressions'        => (int) ($stats->total_impressions ?? 0),
                'status'                   => 'closed',
                'closed_at'                => now(),
            ]);

            \Illuminate\Support\Facades\DB::commit();

            \App\Services\AuditLogService::log(
                'period_closing_recovered',
                'PeriodClosing',
                $id,
                ['status' => 'closing'],
                ['status' => 'closed', 'action' => 'api_force_complete']
            );

            return response()->json([
                'message' => 'Period closing completed successfully.',
                'closing' => $closing->fresh(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Recovery complete failed: ' . $e->getMessage()], 500);
        }
    }
}
