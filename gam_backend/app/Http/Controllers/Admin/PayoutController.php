<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\PayoutApprovedMail;
use App\Mail\PayoutRejectedMail;
use App\Mail\PayoutPaidMail;

class PayoutController extends Controller
{
    /**
     * GET /api/v1/admin/payouts
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payout::with(['publisher', 'periodClosing']);

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('publisher_id')) {
            $query->where('publisher_id', $request->query('publisher_id'));
        }

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->query('date_from') . ' 00:00:00');
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->query('date_to') . ' 23:59:59');
        }

        $payouts = $query->orderBy('created_at', 'desc')
                         ->paginate(100);

        return response()->json($payouts);
    }

    /**
     * POST /api/v1/admin/payouts/{id}/approve
     *
     * FIX [PAY-2]: Wrapped in DB::transaction() so the payout update and audit log
     * are atomic. If the audit log fails, the payout status is rolled back.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'admin_note' => 'nullable|string',
        ]);

        $payout = Payout::findOrFail($id);

        if ($payout->status !== 'pending') {
            return response()->json(['message' => 'Only pending payouts can be approved.'], 400);
        }

        $oldStatus = $payout->status;

        DB::beginTransaction();
        try {
            $payout->update([
                'status'       => 'approved',
                'admin_note'   => $request->admin_note ?? $payout->admin_note,
                'approved_by'  => $request->user()->id,
                'approved_at'  => now(),
            ]);

            AuditLogService::log('approved', 'Payout', $payout->id, ['status' => $oldStatus], ['status' => 'approved']);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to approve payout.', 'error' => $e->getMessage()], 500);
        }

        // Send email outside transaction (email failure should not roll back the status change)
        if ($payout->publisher && $payout->publisher->email) {
            try { Mail::to($payout->publisher->email)->send(new PayoutApprovedMail($payout)); } catch (\Exception $e) {}
        }

        return response()->json(['message' => 'Payout approved successfully.', 'payout' => $payout]);
    }

    /**
     * POST /api/v1/admin/payouts/{id}/reject
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'admin_note' => 'required|string',
        ]);

        $payout = Payout::findOrFail($id);

        if ($payout->status === 'paid') {
            return response()->json(['message' => 'Cannot reject a paid payout.'], 400);
        }

        if ($payout->status === 'rejected') {
            return response()->json(['message' => 'Payout is already rejected.'], 400);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();

        try {
            if ($payout->period_closing_id) {
                // Find all locked revenue records for this publisher under this closing
                $revenueQuery = \App\Models\RevenueRecord::where('period_closing_id', $payout->period_closing_id)
                    ->whereHas('adUnit.website', function ($q) use ($payout) {
                        $q->where('publisher_id', $payout->publisher_id);
                    });

                $revenueStats = (clone $revenueQuery)->select(
                    \Illuminate\Support\Facades\DB::raw('SUM(gross_revenue) as total_gross'),
                    \Illuminate\Support\Facades\DB::raw('SUM(publisher_earnings) as total_earnings'),
                    \Illuminate\Support\Facades\DB::raw('SUM(impressions) as total_impressions')
                )->first();

                $pubGross = (float) ($revenueStats->total_gross ?? 0);
                $pubEarnings = (float) ($revenueStats->total_earnings ?? 0);
                $pubImpressions = (int) ($revenueStats->total_impressions ?? 0);

                // Unlock revenue records (set period_closing_id to null)
                $revenueQuery->update(['period_closing_id' => null]);

                // Delete pending carry-over adjustments created in this closing
                \App\Models\Adjustment::where('publisher_id', $payout->publisher_id)
                    ->where('period_closing_id', $payout->period_closing_id)
                    ->where('status', 'pending')
                    ->delete();

                // Reset manual adjustments that were applied in this closing back to pending and unlocked
                \App\Models\Adjustment::where('publisher_id', $payout->publisher_id)
                    ->where('period_closing_id', $payout->period_closing_id)
                    ->where('status', 'applied')
                    ->update([
                        'status' => 'pending',
                        'period_closing_id' => null
                    ]);

                // Deduct these totals from the corresponding PeriodClosing record to keep aggregate statistics accurate
                $periodClosing = $payout->periodClosing;
                if ($periodClosing) {
                    $periodClosing->update([
                        'total_gross_revenue'      => max(0.0, (float) bcsub((string) $periodClosing->total_gross_revenue, (string) $pubGross, 6)),
                        'total_publisher_earnings' => max(0.0, (float) bcsub((string) $periodClosing->total_publisher_earnings, (string) $pubEarnings, 6)),
                        'total_impressions'        => max(0, $periodClosing->total_impressions - $pubImpressions),
                    ]);
                }
            } else {
                // Standalone Manual Payment Rejection:
                // If the negative deduction adjustment is still pending, we delete it.
                // If it is already applied (the period closed), we must refund the amount by creating a positive pending adjustment.
                $deduction = \App\Models\Adjustment::where('publisher_id', $payout->publisher_id)
                    ->where('notes', 'Deduction for standalone manual payment ' . $payout->id)
                    ->first();

                if ($deduction) {
                    if ($deduction->status === 'pending') {
                        $deduction->delete();
                    } elseif ($deduction->status === 'applied') {
                        \App\Models\Adjustment::create([
                            'id'           => \Illuminate\Support\Str::uuid()->toString(),
                            'publisher_id' => $payout->publisher_id,
                            'amount'       => $payout->amount, // positive refund
                            'notes'        => 'Refund for rejected manual payment ' . $payout->id . ' (deduction was applied to closed period)',
                            'status'       => 'pending',
                            'created_by'   => $request->user()->id,
                        ]);
                    }
                }
            }

            // Sync balance after transaction commits
            \Illuminate\Support\Facades\DB::afterCommit(function () use ($payout) {
                \App\Models\Publisher::syncPendingBalance($payout->publisher_id);
            });

            // Update payout status to rejected
            $payout->update([
                'status'     => 'rejected',
                'admin_note' => $request->admin_note,
            ]);

            // FIX [PAY-5/FIX-16]: AuditLog moved INSIDE the transaction so the audit record
            // is atomically committed with the payout status change. If the audit log write
            // fails, the entire transaction rolls back — no ghost rejections without a paper trail.
            AuditLogService::log('rejected', 'Payout', $payout->id, ['status' => $payout->getOriginal('status')], ['status' => 'rejected', 'admin_note' => $request->admin_note]);

            \Illuminate\Support\Facades\DB::commit();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to reject payout and rollback balances.', 'error' => $e->getMessage()], 500);
        }

        // Send email OUTSIDE the transaction — email failure must not roll back the rejection.
        if ($payout->publisher && $payout->publisher->email) {
            try {
                Mail::to($payout->publisher->email)->send(new PayoutRejectedMail($payout));
            } catch (\Exception $e) {
                // Silently swallow — rejection is committed. Log for ops monitoring.
                \Illuminate\Support\Facades\Log::warning('PayoutRejectedMail failed to send for payout ' . $payout->id . ': ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Payout rejected successfully.', 'payout' => $payout]);
    }

    /**
     * POST /api/v1/admin/payouts/{id}/mark-paid
     *
     * FIX [PAY-3]: Wrapped in DB::transaction() so the status update and audit log
     * are atomic. If the audit log fails, the payout status is rolled back.
     */
    public function markPaid(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'payment_reference' => 'required|string',
        ]);

        $payout = Payout::findOrFail($id);

        if ($payout->status !== 'approved') {
            return response()->json(['message' => 'Only approved payouts can be marked as paid.'], 400);
        }

        $oldStatus = $payout->status;

        DB::beginTransaction();
        try {
            $payout->update([
                'status'            => 'paid',
                'payment_reference' => $request->payment_reference,
                'paid_at'           => now(),
            ]);

            AuditLogService::log('paid', 'Payout', $payout->id, ['status' => $oldStatus], ['status' => 'paid', 'payment_reference' => $request->payment_reference]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to mark payout as paid.', 'error' => $e->getMessage()], 500);
        }

        // Send email outside transaction (email failure should not roll back the status change)
        if ($payout->publisher && $payout->publisher->email) {
            try { Mail::to($payout->publisher->email)->send(new PayoutPaidMail($payout)); } catch (\Exception $e) {}
        }

        return response()->json(['message' => 'Payout marked as paid.', 'payout' => $payout]);
    }
}
