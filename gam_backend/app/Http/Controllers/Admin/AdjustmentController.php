<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdjustmentRequest;
use App\Http\Resources\Admin\AdjustmentResource;
use App\Models\Adjustment;
use App\Models\Publisher;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Website;
use App\Models\RevenueRecord;
use Illuminate\Support\Str;

class AdjustmentController extends Controller
{
    /**
     * GET /api/v1/admin/adjustments
     */
    public function index(Request $request)
    {
        $query = Adjustment::with(['publisher', 'creator']);

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                  ->orWhereHas('publisher', function ($pubQ) use ($search) {
                      $pubQ->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('publisher_id')) {
            $query->where('publisher_id', $request->query('publisher_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $adjustments = $query->orderBy('created_at', 'desc')->paginate(15);

        return AdjustmentResource::collection($adjustments);
    }

    /**
     * POST /api/v1/admin/adjustments
     */
    public function store(StoreAdjustmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $publisher = Publisher::findOrFail($data['publisher_id']);
        $amount = (float) $data['amount'];

        DB::beginTransaction();

        try {
            $adjustment = Adjustment::create([
                'id'           => Str::uuid()->toString(),
                'publisher_id' => $publisher->id,
                'amount'       => $amount,
                'notes'        => $data['notes'],
                'status'       => 'pending',
                'created_by'   => $request->user()->id,
            ]);

            // FIX [PUB-3/ADJ-25]: Removed publisher->notes appending.
            // AuditLogService below captures the full adjustment record for compliance.
            // Appending to notes caused unbounded TEXT column growth.

            DB::commit();

            AuditLogService::log(
                'created',
                'Adjustment',
                $adjustment->id,
                null,
                $adjustment->toArray()
            );

            RevenueRecord::clearCache();

            return response()->json([
                'message'    => 'Adjustment created successfully.',
                'adjustment' => new AdjustmentResource($adjustment->load(['publisher', 'creator'])),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create adjustment.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/adjustments/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $adjustment = Adjustment::findOrFail($id);

        if ($adjustment->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending adjustments can be deleted.'
            ], 400);
        }

        // Prevent deletion if linked to an active (non-rejected) manual payout
        if (str_starts_with($adjustment->notes, 'Deduction for standalone manual payment ')) {
            $payoutId = str_replace('Deduction for standalone manual payment ', '', $adjustment->notes);
            $payout = \App\Models\Payout::find($payoutId);
            if ($payout && $payout->status !== 'rejected') {
                return response()->json([
                    'message' => 'This adjustment is linked to a manual payout that is currently ' . $payout->status . '. You cannot delete it directly.'
                ], 400);
            }
        }

        $oldData = $adjustment->toArray();
        $adjustment->delete();

        AuditLogService::log(
            'deleted',
            'Adjustment',
            $id,
            $oldData,
            null
        );

        RevenueRecord::clearCache();

        return response()->json([
            'message' => 'Adjustment deleted successfully.'
        ]);
    }

    /**
     * POST /api/v1/admin/adjustments/apply-ivt
     */
    public function applyIvt(Request $request): JsonResponse
    {
        $request->validate([
            'gam_account_id' => 'required|exists:gam_accounts,id',
            'website_ids'    => 'required|array|min:1',
            'website_ids.*'  => 'required|exists:websites,id',
            'date_from'      => 'required|date',
            'date_to'        => 'required|date|after_or_equal:date_from',
            'ivt_percent'    => 'required|numeric|between:0,100',
            'force'          => 'nullable|boolean',
        ]);

        $gamAccountId = $request->input('gam_account_id');
        $websiteIds = $request->input('website_ids');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $ivtPercent = (float) $request->input('ivt_percent');
        $force = (bool) $request->input('force', false);

        $websites = Website::with('publisher')->where('gam_account_id', $gamAccountId)->whereIn('id', $websiteIds)->get();

        if ($websites->count() !== count(array_unique($websiteIds))) {
            return response()->json([
                'message' => 'Some selected websites do not belong to the selected GAM Account.'
            ], 422);
        }

        // Conflict pre-check if force is false
        if (!$force) {
            $existingDomains = [];
            foreach ($websites as $website) {
                $notePattern = "Invalid Traffic Deduction%for {$website->domain} ({$dateFrom}%";
                $alreadyApplied = Adjustment::where('publisher_id', $website->publisher_id)
                    ->where('notes', 'like', $notePattern)
                    ->where('status', '!=', 'applied')
                    ->exists();
                if ($alreadyApplied) {
                    $existingDomains[] = $website->domain;
                }
            }
            if (!empty($existingDomains)) {
                $totalConflictCount = count($existingDomains);
                if ($totalConflictCount > 5) {
                    $slice = array_slice($existingDomains, 0, 5);
                    $domainsStr = implode(', ', $slice) . ' and ' . ($totalConflictCount - 5) . ' others';
                } else {
                    $domainsStr = implode(', ', $existingDomains);
                }

                return response()->json([
                    'conflict' => true,
                    'message' => 'An IVT deduction already exists for this date range for the following website(s): ' . $domainsStr . '. Do you want to proceed and add a duplicate deduction anyway?'
                ], 409);
            }
        }

        $appliedAdjustments = [];
        $skippedAdjustments = [];

        DB::beginTransaction();

        try {
            foreach ($websites as $website) {
                $adUnitIds = $website->adUnits()->pluck('id');

                if (!$force) {
                    $notePattern = "Invalid Traffic Deduction%for {$website->domain} ({$dateFrom}%";
                    $alreadyApplied = Adjustment::where('publisher_id', $website->publisher_id)
                        ->where('notes', 'like', $notePattern)
                        ->where('status', '!=', 'applied')
                        ->exists();

                    if ($alreadyApplied) {
                        $skippedAdjustments[] = [
                            'website' => $website->domain,
                            'reason'  => 'IVT deduction already exists for this date range. Delete the existing pending deduction first to reapply.',
                        ];
                        continue;
                    }
                }

                // FIX [ADJ-1 / FIX-12]: Only sum revenue from OPEN records (period_closing_id IS NULL).
                // Without this, applying IVT to a closed period's earnings creates a deduction
                // against already-paid revenue, causing effective double-deduction next payout.
                $openEarnings  = (float) RevenueRecord::whereIn('ad_unit_id', $adUnitIds)
                    ->whereBetween('date', [$dateFrom, $dateTo])
                    ->whereNull('period_closing_id')
                    ->sum('publisher_earnings');

                $lockedEarnings = (float) RevenueRecord::whereIn('ad_unit_id', $adUnitIds)
                    ->whereBetween('date', [$dateFrom, $dateTo])
                    ->whereNotNull('period_closing_id')
                    ->sum('publisher_earnings');

                $totalEarnings = $openEarnings; // Only open records are deductible

                if ($totalEarnings >= 0.01) {
                    $deduction = $totalEarnings * ($ivtPercent / 100.0);
                    $amount = round($deduction, 2);

                    if ($amount >= 0.01) {
                        $adjustment = Adjustment::create([
                            'id'           => Str::uuid()->toString(),
                            'publisher_id' => $website->publisher_id,
                            'amount'       => -$amount,
                            'notes'        => "Invalid Traffic Deduction ({$ivtPercent}%) for {$website->domain} ({$dateFrom} to {$dateTo})",
                            'status'       => 'pending',
                            'created_by'   => $request->user()->id,
                        ]);

                        // FIX [PUB-3/ADJ-25]: Removed publisher->notes appending (unbounded growth).
                        // AuditLogService captures the full adjustment record.

                        AuditLogService::log(
                            'created',
                            'Adjustment',
                            $adjustment->id,
                            null,
                            $adjustment->toArray()
                        );

                        $appliedAdjustments[] = [
                            'website'          => $website->domain,
                            'open_earnings'    => $openEarnings,
                            'locked_earnings'  => $lockedEarnings, // informational — not deducted
                            'deduction'        => $amount,
                            'adjustment_id'    => $adjustment->id,
                        ];
                    }
                } elseif ($openEarnings <= 0 && $lockedEarnings > 0) {
                    // All earnings in this range are locked (period already closed).
                    // Warn the admin rather than silently skipping.
                    $skippedAdjustments[] = [
                        'website' => $website->domain,
                        'reason'  => "All revenue for this date range is in a closed period (\${$lockedEarnings} locked). IVT deduction cannot be applied to closed-period revenue.",
                    ];
                }
            }

            DB::commit();

            RevenueRecord::clearCache();

            $response = [
                'message'             => 'IVT deductions applied successfully.',
                'applied_adjustments' => $appliedAdjustments,
            ];
            if (!empty($skippedAdjustments)) {
                $response['skipped'] = $skippedAdjustments;
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to apply IVT deductions.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/adjustments/apply-bonus
     */
    public function applyBonus(Request $request): JsonResponse
    {
        $request->validate([
            'gam_account_id' => 'required|exists:gam_accounts,id',
            'website_ids'    => 'required|array|min:1',
            'website_ids.*'  => 'required|exists:websites,id',
            'date_from'      => 'required|date',
            'date_to'        => 'required|date|after_or_equal:date_from',
            'bonus_percent'  => 'required|numeric|between:0,100',
        ]);

        $gamAccountId = $request->input('gam_account_id');
        $websiteIds = $request->input('website_ids');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $bonusPercent = (float) $request->input('bonus_percent');

        $websites = Website::with('publisher')->where('gam_account_id', $gamAccountId)->whereIn('id', $websiteIds)->get();

        if ($websites->count() !== count(array_unique($websiteIds))) {
            return response()->json([
                'message' => 'Some selected websites do not belong to the selected GAM Account.'
            ], 422);
        }

        $appliedAdjustments = [];
        $skippedAdjustments = [];

        DB::beginTransaction();

        try {
            foreach ($websites as $website) {
                $adUnitIds = $website->adUnits()->pluck('id');

                // FIX [ADJ-2 / FIX-13]: Idempotency check — prevent double-applying bonus.
                $notePattern = "Bonus%for {$website->domain} ({$dateFrom}%";
                $alreadyApplied = Adjustment::where('publisher_id', $website->publisher_id)
                    ->where('notes', 'like', $notePattern)
                    ->where('status', '!=', 'applied')
                    ->exists();

                if ($alreadyApplied) {
                    $skippedAdjustments[] = [
                        'website' => $website->domain,
                        'reason'  => 'Bonus already exists for this date range. Delete the existing pending bonus first to reapply.',
                    ];
                    continue;
                }

                // FIX [ADJ-1 / FIX-12]: Only sum revenue from OPEN records.
                $openEarnings = (float) RevenueRecord::whereIn('ad_unit_id', $adUnitIds)
                    ->whereBetween('date', [$dateFrom, $dateTo])
                    ->whereNull('period_closing_id')
                    ->sum('publisher_earnings');

                $totalEarnings = $openEarnings;

                if ($totalEarnings >= 0.01) {
                    $bonusAmount = $totalEarnings * ($bonusPercent / 100.0);
                    $amount = round($bonusAmount, 2);

                    if ($amount >= 0.01) {
                        $adjustment = Adjustment::create([
                            'id'           => Str::uuid()->toString(),
                            'publisher_id' => $website->publisher_id,
                            'amount'       => $amount, // Positive for bonus
                            'notes'        => "Bonus ({$bonusPercent}%) for {$website->domain} ({$dateFrom} to {$dateTo})",
                            'status'       => 'pending',
                            'created_by'   => $request->user()->id,
                        ]);

                        // FIX [PUB-3/ADJ-25]: Removed publisher->notes appending.

                        AuditLogService::log(
                            'created',
                            'Adjustment',
                            $adjustment->id,
                            null,
                            $adjustment->toArray()
                        );

                        $appliedAdjustments[] = [
                            'website'       => $website->domain,
                            'open_earnings' => $openEarnings,
                            'bonus'         => $amount,
                            'adjustment_id' => $adjustment->id,
                        ];
                    }
                }
            }

            DB::commit();

            RevenueRecord::clearCache();

            $response = [
                'message'             => 'Bonuses applied successfully.',
                'applied_adjustments' => $appliedAdjustments,
            ];
            if (!empty($skippedAdjustments)) {
                $response['skipped'] = $skippedAdjustments;
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to apply bonuses.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
