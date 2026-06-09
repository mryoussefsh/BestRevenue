<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePublisherRequest;
use App\Http\Requests\Admin\UpdatePublisherRequest;
use App\Http\Resources\Admin\PublisherResource;
use App\Mail\AccountSuspendedMail;
use App\Mail\PayoutCreatedMail;
use App\Mail\WelcomeMail;
use App\Models\Publisher;
use App\Models\RatioHistory;
use App\Models\User;
use App\Models\Payout;
use App\Models\PeriodClosing;
use App\Models\RevenueRecord;
use App\Models\Setting;
use App\Services\AuditLogService;
use App\Services\ManualPaymentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PublisherController extends Controller
{
    /**
     * GET /api/v1/admin/publishers
     */
    public function index(Request $request)
    {
        $query = Publisher::withCount('websites')->with('user');

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        $publishers = $query->latest()->paginate(100);

        return PublisherResource::collection($publishers);
    }

    /**
     * POST /api/v1/admin/publishers
     */
    public function store(StorePublisherRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();

        try {
            // Create the Publisher
            $publisher = Publisher::create([
                'id'            => Str::uuid()->toString(),
                'name'          => $data['name'],
                'email'         => $data['email'],
                'default_ratio' => $data['default_ratio'],
                'status'        => $data['status'],
                'payment_info'  => $data['payment_info'] ?? null,
                'notes'         => $data['notes'] ?? null,
                'phone'         => $data['phone'] ?? null,
                'telegram'      => $data['telegram'] ?? null,
                'country'       => $data['country'] ?? null,
                'reg_ip'        => $data['reg_ip'] ?? $request->ip(),
                'last_ip'       => $data['last_ip'] ?? $request->ip(),
            ]);

            // Create the User for this publisher
            User::create([
                'id'           => Str::uuid()->toString(),
                'name'         => $data['name'],
                'email'        => $data['email'],
                'password'     => Hash::make($data['password']),
                'role'         => 'publisher',
                'publisher_id' => $publisher->id,
                'is_active'    => $data['status'] === 'active',
            ]);

            // Log ratio history
            RatioHistory::create([
                'id'          => Str::uuid()->toString(),
                'entity_type' => 'publisher',
                'entity_id'   => $publisher->id,
                'old_ratio'   => null,
                'new_ratio'   => $data['default_ratio'],
                'changed_by'  => $request->user()->id,
                'changed_at'  => now(),
            ]);

            DB::commit();

            AuditLogService::log('created', 'Publisher', $publisher->id, null, $publisher->toArray());

            return response()->json([
                'message'   => 'Publisher created successfully.',
                'publisher' => new PublisherResource($publisher->load('user')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create publisher.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/publishers/{id}
     */
    public function show(string $id)
    {
        $publisher = Publisher::with('user')->withCount('websites')->findOrFail($id);
        return new PublisherResource($publisher);
    }

    /**
     * PUT /api/v1/admin/publishers/{id}
     */
    public function update(UpdatePublisherRequest $request, string $id): JsonResponse
    {
        $publisher = Publisher::findOrFail($id);
        $data = $request->validated();

        $oldData = $publisher->toArray();
        $oldRatio = $publisher->default_ratio;
        $newRatio = array_key_exists('default_ratio', $data) ? $data['default_ratio'] : null;

        DB::beginTransaction();

        try {
            $publisher->update([
                'name'         => $data['name'] ?? $publisher->name,
                'email'        => $data['email'] ?? $publisher->email,
                'status'       => $data['status'] ?? $publisher->status,
                'payment_info' => array_key_exists('payment_info', $data) ? $data['payment_info'] : $publisher->payment_info,
                'notes'        => array_key_exists('notes', $data) ? $data['notes'] : $publisher->notes,
                'phone'        => array_key_exists('phone', $data) ? $data['phone'] : $publisher->phone,
                'telegram'     => array_key_exists('telegram', $data) ? $data['telegram'] : $publisher->telegram,
                'country'      => array_key_exists('country', $data) ? $data['country'] : $publisher->country,
                'reg_ip'       => array_key_exists('reg_ip', $data) ? $data['reg_ip'] : $publisher->reg_ip,
                'last_ip'      => array_key_exists('last_ip', $data) ? $data['last_ip'] : $publisher->last_ip,
            ]);

            if ($newRatio !== null && (float)$newRatio !== (float)$oldRatio) {
                $publisher->update(['default_ratio' => $newRatio]);

                RatioHistory::create([
                    'id'          => Str::uuid()->toString(),
                    'entity_type' => 'publisher',
                    'entity_id'   => $publisher->id,
                    'old_ratio'   => $oldRatio,
                    'new_ratio'   => $newRatio,
                    'changed_by'  => $request->user()->id,
                    'changed_at'  => now(),
                ]);
            }

            // Sync user data
            if ($user = $publisher->user) {
                $userUpdates = [
                    'name'      => $publisher->name,
                    'email'     => $publisher->email,
                    'is_active' => $publisher->status === 'active',
                ];
                if (!empty($data['password'])) {
                    $userUpdates['password'] = Hash::make($data['password']);
                }
                $user->update($userUpdates);
            }

            DB::commit();

            AuditLogService::log('updated', 'Publisher', $publisher->id, $oldData, $publisher->toArray());

            return response()->json([
                'message'   => 'Publisher updated successfully.',
                'publisher' => new PublisherResource($publisher->load('user')),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update publisher.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/publishers/{id}
     *
     * FIX [PUB-1]: Block deletion if the publisher has active (non-rejected, non-paid) payouts.
     * Deleting a publisher cascades to their financial records, which is a compliance risk.
     * Admins must first reject or resolve all pending/approved payouts before deletion.
     */
    public function destroy(string $id): JsonResponse
    {
        $publisher = Publisher::findOrFail($id);

        // FIX [PUB-1]: Block deletion if ANY payout, adjustment, or revenue record exists
        // to protect financial history and avoid cascade deletes corrupting audit trails.
        $payoutsCount = \App\Models\Payout::where('publisher_id', $id)->count();
        $adjustmentsCount = \App\Models\Adjustment::where('publisher_id', $id)->count();
        $revenueRecordsCount = \App\Models\RevenueRecord::whereHas('adUnit.website', function ($q) use ($id) {
            $q->where('publisher_id', $id);
        })->count();

        if ($payoutsCount > 0 || $adjustmentsCount > 0 || $revenueRecordsCount > 0) {
            return response()->json([
                'message' => 'Cannot delete publisher: historical financial records exist (payouts, adjustments, or synced revenue records). Please suspend the publisher instead to deactivate their account.',
            ], 422);
        }

        $oldData = $publisher->toArray();

        DB::beginTransaction();

        try {
            if ($user = $publisher->user) {
                $user->delete();
            }
            $publisher->delete();

            DB::commit();

            AuditLogService::log('deleted', 'Publisher', $id, $oldData, [
                'had_locked_records' => 0,
            ]);

            return response()->json(['message' => 'Publisher deleted successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete publisher.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/publishers/{id}/set-ratio
     */
    public function setRatio(Request $request, string $id): JsonResponse
    {
        $request->validate([
            // FIX-26-b: min:0.01 prevents setting 0% publisher share via dedicated endpoint
            'ratio' => 'required|numeric|min:0.01|max:1',
        ]);

        $publisher = Publisher::findOrFail($id);
        $oldRatio = $publisher->default_ratio;
        $newRatio = $request->ratio;

        if ($oldRatio == $newRatio) {
            return response()->json(['message' => 'Ratio is already set to this value.'], 400);
        }

        DB::beginTransaction();

        try {
            $publisher->update(['default_ratio' => $newRatio]);

            RatioHistory::create([
                'id'          => Str::uuid()->toString(),
                'entity_type' => 'publisher',
                'entity_id'   => $publisher->id,
                'old_ratio'   => $oldRatio,
                'new_ratio'   => $newRatio,
                'changed_by'  => $request->user()->id,
                'changed_at'  => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Ratio updated successfully.',
                'new_ratio' => $newRatio,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update ratio.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/publishers/{id}/ratio-history
     *
     * FIX [PUB-3]: Replaced User::pluck('name', 'id')->toArray() which loaded ALL
     * users into memory. Now only loads users referenced in this publisher's ratio history.
     */
     public function ratioHistory(string $id): JsonResponse
    {
        $publisher = Publisher::findOrFail($id);
        $websiteIds = $publisher->websites()->pluck('id')->toArray();

        $history = RatioHistory::where(function ($query) use ($id) {
            $query->where('entity_type', 'publisher')
                  ->where('entity_id', $id);
        })->orWhere(function ($query) use ($websiteIds) {
            $query->where('entity_type', 'website')
                  ->whereIn('entity_id', $websiteIds);
        })
        ->orderBy('changed_at', 'desc')
        ->get();

        $websitesMap = $publisher->websites()->pluck('domain', 'id')->toArray();

        // FIX [PUB-3]: Only load users who appear in this history set, not ALL users
        $changerIds = $history->pluck('changed_by')->filter()->unique()->values();
        $userMap = \App\Models\User::whereIn('id', $changerIds)->pluck('name', 'id')->toArray();

        $formatted = $history->map(function ($item) use ($websitesMap, $userMap) {
            $target = 'General Profile';
            if ($item->entity_type === 'website') {
                $target = 'Website: ' . ($websitesMap[$item->entity_id] ?? 'Deleted Website');
            }

            return [
                'id'          => $item->id,
                'entity_type' => $item->entity_type,
                'entity_id'   => $item->entity_id,
                'target'      => $target,
                'old_ratio'   => $item->old_ratio,
                'new_ratio'   => $item->new_ratio,
                'changed_by'  => $userMap[$item->changed_by] ?? 'System/Admin',
                'changed_at'  => $item->changed_at,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * POST /api/v1/admin/publishers/{id}/suspend
     */
    public function suspend(string $id): JsonResponse
    {
        $publisher = Publisher::findOrFail($id);
        $oldData = $publisher->toArray();

        DB::beginTransaction();

        try {
            $publisher->update(['status' => 'suspended']);
            if ($user = $publisher->user) {
                $user->update(['is_active' => false]);
                // FIX [A-2]: Revoke all existing tokens immediately on suspension.
                // Without this, the suspended publisher's tokens remain valid until
                // the 60-minute Sanctum expiry window elapses.
                $user->tokens()->delete();
            }

            DB::commit();

            \App\Services\AuditLogService::log('suspended', 'Publisher', $publisher->id, $oldData, $publisher->toArray());

            try { Mail::to($publisher->email)->send(new AccountSuspendedMail($publisher)); } catch (\Exception $e) {}

            return response()->json(['message' => 'Publisher suspended successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to suspend publisher.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/publishers/{id}/activate
     * Activate a pending or suspended publisher.
     */
    public function activate(string $id): JsonResponse
    {
        $publisher = Publisher::findOrFail($id);
        $oldData = $publisher->toArray();

        DB::beginTransaction();

        try {
            $publisher->update(['status' => 'active']);
            if ($user = $publisher->user) {
                $user->update(['is_active' => true]);
            }

                    DB::commit();

            \App\Services\AuditLogService::log('activated', 'Publisher', $publisher->id, $oldData, $publisher->toArray());

            try { Mail::to($publisher->email)->send(new WelcomeMail($publisher)); } catch (\Exception $e) {}

            return response()->json(['message' => 'Publisher activated successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to activate publisher.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/publishers/{id}/adjust-balance
     */
    public function adjustBalance(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric',
            'notes'  => 'required|string',
        ]);

        $publisher = Publisher::findOrFail($id);
        $oldBalance = (float) $publisher->adjustments()->where('status', 'pending')->sum('amount');
        $amount = (float) $request->amount;
        $newBalance = $oldBalance + $amount;

        DB::beginTransaction();

        try {
            $adjustment = \App\Models\Adjustment::create([
                'id'           => Str::uuid()->toString(),
                'publisher_id' => $publisher->id,
                'amount'       => $amount,
                'notes'        => $request->notes,
                'status'       => 'pending',
                'created_by'   => $request->user()->id,
            ]);

            // FIX [PUB-3]: Removed the publisher->notes appending here.
            // The AuditLogService call below captures the full adjustment record.
            // Appending to publisher notes caused unbounded TEXT growth over time.

            DB::commit();

            \App\Services\AuditLogService::log(
                'balance_adjusted',
                'Publisher',
                $publisher->id,
                ['pending_balance_adjustment' => $oldBalance],
                ['pending_balance_adjustment' => $newBalance, 'amount' => $amount, 'notes' => $request->notes, 'adjustment_id' => $adjustment->id]
            );

            return response()->json([
                'message' => 'Balance adjusted successfully.',
                'publisher' => new PublisherResource($publisher->load('user')),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to adjust balance.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/publishers/{id}/impersonate
     */
    public function impersonate(Request $request, string $id): JsonResponse
    {
        $publisher = Publisher::with('user')->findOrFail($id);
        $user = $publisher->user;

        if (!$user) {
            return response()->json(['message' => 'No user account found for this publisher.'], 404);
        }

        // FIX [PUB-4, SEC-12]: Scope impersonation token to publisher-only abilities.
        // Using ['*'] would allow the impersonated session to call admin endpoints.
        // The 'publisher' ability string is checked by RoleMiddleware (role=publisher routes).
        $token = $user->createToken('impersonate-token', ['publisher'], now()->addMinutes(120))->plainTextToken;

        \App\Services\AuditLogService::log(
            'impersonate',
            'Publisher',
            $publisher->id,
            null,
            ['user_id' => $user->id, 'impersonator_id' => $request->user()->id]
        );

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'publisher_id' => $user->publisher_id,
                'pending_balance' => (float) $publisher->adjustments()->where('status', 'pending')->sum('amount'),
                'payment_info' => $publisher->payment_info,
            ]
        ]);
    }

    /**
     * POST /api/v1/admin/publishers/{id}/create-payout
     *
     * REFACTOR [MPAY-1]: Hardened admin payout override.
     *
     * This endpoint creates a Payout record for a specific publisher against an
     * ALREADY-CLOSED PeriodClosing. It is an administrative override tool only.
     *
     * STRICTLY PROHIBITED:
     *   - NEVER creates a PeriodClosing (returns 422 if none exists for the target month).
     *   - NEVER locks RevenueRecords.
     *   - NEVER applies or creates Adjustment records.
     *   - NEVER creates rollover adjustments.
     *   - NEVER updates PeriodClosing aggregate statistics.
     *   - NEVER affects any publisher other than the one specified.
     *
     * For standalone payments without a closed period, use POST publishers/{id}/manual-payment.
     */
    public function createPayout(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'period_year'  => 'required|integer|min:2024',
            'period_month' => 'required|integer|min:1|max:12',
            'amount'       => 'required|numeric|min:0.01',
            'admin_note'   => 'nullable|string',
        ]);

        $year  = (int) $request->period_year;
        $month = (int) $request->period_month;

        // Guard: Cannot create payouts for the current or future months.
        $targetDate = Carbon::create($year, $month, 1)->startOfMonth();
        if ($targetDate->gte(now()->startOfMonth())) {
            return response()->json([
                'message' => 'Cannot create a payout for the current or a future month.',
            ], 422);
        }

        $publisher   = Publisher::findOrFail($id);
        $inputAmount = (float) $request->amount;
        $adminNote   = $request->admin_note;

        DB::beginTransaction();

        try {
            // REFACTOR [MPAY-1]: Require an existing closed PeriodClosing.
            // DO NOT create one if it doesn't exist — that is a Period Closing concern.
            $period = PeriodClosing::lockForUpdate()
                ->where('period_year', $year)
                ->where('period_month', $month)
                ->first();

            if (!$period) {
                DB::rollBack();
                return response()->json([
                    'message' => "No closed PeriodClosing found for {$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . ". "
                               . "Run the full period close first, or use the manual-payment endpoint for out-of-cycle payments.",
                ], 422);
            }

            if ($period->status !== 'closed') {
                DB::rollBack();
                return response()->json([
                    'message' => "PeriodClosing for {$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . " is in '{$period->status}' status. Only 'closed' periods can receive admin payout overrides.",
                ], 422);
            }

            // Guard: one active payout per publisher per closing (atomically checked under lock).
            $existingActivePayout = Payout::where('publisher_id', $publisher->id)
                ->where('period_closing_id', $period->id)
                ->where('status', '!=', 'rejected')
                ->where('is_manual_payment', false)
                ->first();

            if ($existingActivePayout) {
                DB::rollBack();
                return response()->json([
                    'message' => "A non-manual payout already exists for this publisher in period {$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . ".",
                ], 422);
            }

            // Read-only: calculate the publisher's locked earnings for this period.
            // We do NOT lock any revenue records here — they were already locked by the period close.
            $lockedRevenueStats = RevenueRecord::where('period_closing_id', $period->id)
                ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
                ->join('websites', 'ad_units.website_id', '=', 'websites.id')
                ->where('websites.publisher_id', $publisher->id)
                ->select(
                    DB::raw('SUM(revenue_records.publisher_earnings) as total_earnings')
                )
                ->first();

            $lockedEarnings = (float) ($lockedRevenueStats->total_earnings ?? 0);

            // Guard: amount must not exceed locked earnings for this period
            // (adjustments are already applied by the period close; this is a pure earnings payout).
            if ($inputAmount > max(0.0, $lockedEarnings)) {
                DB::rollBack();
                return response()->json([
                    'message' => "The payout amount (\${$inputAmount}) cannot exceed the publisher's locked earnings for this period (\$" . number_format(max(0.0, $lockedEarnings), 2) . ").",
                ], 422);
            }

            $paymentMethod  = null;
            $paymentAccount = null;
            if ($publisher->payment_info && is_array($publisher->payment_info)) {
                $paymentMethod  = $publisher->payment_info['method']  ?? null;
                $paymentAccount = $publisher->payment_info['account'] ?? null;
            }

            // Create the payout record ONLY — no revenue locking, no adjustments, no period updates.
            $payout = Payout::create([
                'id'                => Str::uuid()->toString(),
                'publisher_id'      => $publisher->id,
                'period_closing_id' => $period->id,
                'period_year'       => $year,
                'period_month'      => $month,
                'amount'            => $inputAmount,
                'adjustment'        => 0,
                'final_amount'      => $inputAmount,
                'status'            => 'pending',
                'admin_note'        => $adminNote ?: 'Created via admin payout override.',
                'payment_method'    => $paymentMethod,
                'payment_account'   => $paymentAccount,
                'is_manual_payment' => false,
            ]);

            AuditLogService::log('created', 'Payout', $payout->id, null, array_merge($payout->toArray(), [
                'trigger' => 'admin_payout_override',
            ]));

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create payout.',
                'error'   => $e->getMessage(),
            ], 500);
        }

        // Send email outside transaction so a mail failure does not roll back the payout.
        try {
            Mail::to($publisher->email)->send(new PayoutCreatedMail($payout->load('publisher')));
            AuditLogService::log('email_sent', 'Payout', $payout->id, null, [
                'email_type' => 'payout_created',
                'recipient'  => $publisher->email,
                'trigger'    => 'admin_payout_override',
                'payout_id'  => $payout->id,
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'message' => 'Payout created successfully.',
            'payout'  => $payout,
        ]);
    }

    /**
     * POST /api/v1/admin/publishers/{id}/manual-payment
     *
     * REFACTOR [MPAY-1]: Standalone manual payment — completely independent of Period Closing.
     *
     * Creates a Payout record with is_manual_payment = true and period_closing_id = NULL.
     * Optionally links to an existing Payout record (updates its status to 'paid') for
     * traceability, but NEVER creates or modifies a PeriodClosing.
     *
     * GUARANTEES:
     *   - NEVER creates a PeriodClosing.
     *   - NEVER locks RevenueRecords.
     *   - NEVER applies or creates Adjustment records.
     *   - NEVER affects any publisher other than the one specified.
     */
    public function manualPayment(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'amount'            => 'required|numeric|min:0.01',
            'method'            => 'nullable|string|max:100',
            'reference'         => 'nullable|string|max:255',
            'notes'             => 'nullable|string',
            'payout_id'         => 'nullable|uuid|exists:payouts,id',
            'idempotency_key'   => 'nullable|string|max:64',
        ]);

        $validated['idempotency_key'] = $validated['idempotency_key'] ?? $request->header('Idempotency-Key');

        $publisher = Publisher::findOrFail($id);

        try {
            $service = new ManualPaymentService();
            $manualPayout = $service->create($publisher, $validated, $request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create manual payment.', 'error' => $e->getMessage()], 500);
        }

        return response()->json([
            'message' => 'Manual payment recorded successfully.',
            'payout'  => $manualPayout,
        ], 201);
    }
}
