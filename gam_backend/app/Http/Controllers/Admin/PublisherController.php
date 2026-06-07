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
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Hash;
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
                'skype'         => $data['skype'] ?? null,
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
                'skype'        => array_key_exists('skype', $data) ? $data['skype'] : $publisher->skype,
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
            ]
        ]);
    }

    /**
     * POST /api/v1/admin/publishers/{id}/create-payout
     */
    public function createPayout(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'period_year'  => 'required|integer|min:2024',
            'period_month' => 'required|integer|min:1|max:12',
            'amount'       => 'required|numeric|min:0',
            'admin_note'   => 'nullable|string',
        ]);

        // FIX [PAY-5]: Prevent creating payouts for the current or future months.
        $year  = (int) $request->period_year;
        $month = (int) $request->period_month;
        $targetDate = Carbon::create($year, $month, 1)->startOfMonth();
        if ($targetDate->gte(now()->startOfMonth())) {
            return response()->json([
                'message' => 'Cannot create a payout for the current or a future month.',
            ], 422);
        }

        $publisher = Publisher::findOrFail($id);

        $inputAmount = (float) $request->amount;
        $adminNote   = $request->admin_note;

        // FIX [PAY-1, PAY-2]: Move the entire PeriodClosing lookup/create INSIDE the
        // DB::beginTransaction() block. Previously, firstOrCreate() ran BEFORE beginTransaction(),
        // meaning a transaction rollback left an orphan PeriodClosing record in the DB.
        //
        // FIX [PAY-2]: If the PeriodClosing is newly created here, it means this period
        // has never been through the full two-pass closing process. Other publishers'
        // revenue records in this period may NOT be locked. We warn via the audit log
        // and the API response, but allow it so admins can still issue individual payouts.
        DB::beginTransaction();

        try {
            // Attempt to find an existing PeriodClosing for this year/month with a lock.
            // If none exists, create it atomically inside this transaction.
            $period = PeriodClosing::lockForUpdate()
                ->where('period_year', $year)
                ->where('period_month', $month)
                ->first();

            $isNewPeriod = false;
            if (!$period) {
                $isNewPeriod = true;
                $period = PeriodClosing::create([
                    'id'         => Str::uuid()->toString(),
                    'period_year'  => $year,
                    'period_month' => $month,
                    'status'     => 'closed',
                    'notes'      => 'Created via manual publisher payout — other publishers in this period may not be locked.',
                    'closed_at'  => now(),
                ]);
            }

            // Check unique constraint: one active payout per publisher per closing
            // (inside the lock so the check and create are atomic)
            $existingActivePayout = Payout::where('publisher_id', $publisher->id)
                ->where('period_closing_id', $period->id)
                ->where('status', '!=', 'rejected')
                ->first();

            if ($existingActivePayout) {
                DB::rollBack();
                return response()->json([
                    'message' => "A payout already exists for this publisher in period $year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "."
                ], 422);
            }

            // Calculate actual approved revenue records up to this period
            $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
            $limitDate = RevenueRecord::getApprovedLimitDate()->startOfDay()->format('Y-m-d');

            $statsQuery = RevenueRecord::whereNull('period_closing_id')
                ->where('date', '<=', $endOfMonth)
                ->where('date', '<=', $limitDate);

            $revenueStats = $statsQuery
                ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
                ->join('websites', 'ad_units.website_id', '=', 'websites.id')
                ->where('websites.publisher_id', $publisher->id)
                ->select(
                    DB::raw('SUM(revenue_records.gross_revenue) as total_gross'),
                    DB::raw('SUM(revenue_records.publisher_earnings) as total_earnings'),
                    DB::raw('SUM(revenue_records.impressions) as total_impressions')
                )
                ->first();

            $pubGross = (float) ($revenueStats->total_gross ?? 0);
            $pubEarnings = (float) ($revenueStats->total_earnings ?? 0);
            $pubImpressions = (int) ($revenueStats->total_impressions ?? 0);

            // Calculate remainder to carry over (only including pending adjustments up to the target period)
            $prePayoutAdjustments = (float) \App\Models\Adjustment::where('publisher_id', $publisher->id)
                ->where('status', 'pending')
                ->where('created_at', '<=', $endOfMonth . ' 23:59:59')
                ->sum('amount');
            $walletBalance = $pubEarnings + $prePayoutAdjustments;

            if ($inputAmount > max(0.0, $walletBalance)) {
                DB::rollBack();
                return response()->json([
                    'message' => "The payout amount cannot exceed the available wallet balance of $" . number_format(max(0.0, $walletBalance), 2) . "."
                ], 422);
            }

            $remainder = $walletBalance - $inputAmount;

            // Lock revenue records for this publisher
            $lockQuery = RevenueRecord::whereNull('period_closing_id')
                ->where('date', '<=', $endOfMonth)
                ->where('date', '<=', $limitDate);

            $lockQuery->whereHas('adUnit.website', function ($q) use ($publisher) {
                $q->where('publisher_id', $publisher->id);
            })->update(['period_closing_id' => $period->id]);

            // Set amount & adjustment to balance out to inputAmount
            $baseAmount = $pubEarnings;
            $payoutAdjustment = $inputAmount - $baseAmount;

            // Mark pending adjustments as applied
            \App\Models\Adjustment::where('publisher_id', $publisher->id)
                ->where('status', 'pending')
                ->where('created_at', '<=', $endOfMonth . ' 23:59:59')
                ->update([
                    'status' => 'applied',
                    'period_closing_id' => $period->id,
                ]);

            Publisher::syncPendingBalance($publisher->id);

            // Create carry-over adjustment for any remainder
            if (abs($remainder) >= 0.01) {
                \App\Models\Adjustment::create([
                    'id'                => Str::uuid()->toString(),
                    'publisher_id'      => $publisher->id,
                    'amount'            => $remainder,
                    'notes'             => "Carry-over balance from payout manual override (Period {$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . ")",
                    'status'            => 'pending',
                    'period_closing_id' => $period->id,
                    'created_by'        => $request->user()->id ?? null,
                ]);
            }

            // Create Payout
            $paymentMethod = null;
            if ($publisher->payment_info && is_array($publisher->payment_info) && isset($publisher->payment_info['method'])) {
                $paymentMethod = $publisher->payment_info['method'];
            }

            $payout = Payout::create([
                'id'                => Str::uuid()->toString(),
                'publisher_id'      => $publisher->id,
                'period_closing_id' => $period->id,
                'period_year'       => $year,
                'period_month'      => $month,
                'amount'            => $baseAmount,
                'adjustment'        => $payoutAdjustment,
                'final_amount'      => $inputAmount,
                'status'            => 'pending',
                'admin_note'        => $adminNote ?: 'Manually created by administrator.',
                'payment_method'    => $paymentMethod,
            ]);

            // FIX [NEW-03]: Use bcadd() for monetary aggregates — consistent with PeriodAutoClose.
            // Float + arithmetic on decimal-precise values accumulates rounding drift.
            $period->update([
                'total_gross_revenue'      => (float) bcadd((string) $period->total_gross_revenue, (string) $pubGross, 6),
                'total_publisher_earnings' => (float) bcadd((string) $period->total_publisher_earnings, (string) $pubEarnings, 6),
                'total_impressions'        => $period->total_impressions + $pubImpressions,
            ]);

            // Fix indentation (cosmetic)
            DB::commit();

            // FIX [PAY-2]: If a new PeriodClosing was created by this manual payout,
            // warn the admin that other publishers' records in this period are NOT locked.
            $warning = null;
            if ($isNewPeriod) {
                $warning = "Warning: A new PeriodClosing record was created for {$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . " because none existed. Other publishers' revenue records for this period are NOT locked. Run the full period close (period:auto-close) to lock all publishers.";
                AuditLogService::log('manual_payout_partial_period', 'PeriodClosing', $period->id, null, [
                    'publisher_id' => $publisher->id,
                    'payout_id'    => $payout->id,
                    'warning'      => 'Period was newly created; other publishers may have unlocked records.',
                ]);
            }

            AuditLogService::log('created', 'Payout', $payout->id, null, $payout->toArray());

            try {
                Mail::to($publisher->email)->send(new PayoutCreatedMail($payout->load('publisher')));
                AuditLogService::log(
                    'email_sent',
                    'Payout',
                    $payout->id,
                    null,
                    [
                        'email_type' => 'payout_created',
                        'recipient'  => $publisher->email,
                        'trigger'    => 'manual_admin',
                        'payout_id'  => $payout->id,
                    ]
                );
            } catch (\Exception $e) {}

            $response = [
                'message' => 'Payout created successfully.',
                'payout'  => $payout,
            ];
            if ($warning) {
                $response['warning'] = $warning;
            }

            return response()->json($response);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create payout.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
