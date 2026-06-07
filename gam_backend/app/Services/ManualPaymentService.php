<?php

namespace App\Services;

use App\Mail\ManualPaymentMail;
use App\Models\Payout;
use App\Models\Publisher;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * REFACTOR [MPAY-1]: ManualPaymentService
 *
 * Handles standalone admin-initiated manual payments completely independently
 * of the Period Closing workflow.
 *
 * Guarantees:
 *   - NEVER creates a PeriodClosing record.
 *   - NEVER locks RevenueRecords.
 *   - NEVER applies or creates Adjustment records.
 *   - NEVER affects any publisher other than the target.
 *   - NEVER triggers month-end accounting logic.
 *
 * When a payout_id is provided and the linked payout is in an applicable state,
 * that payout's status is updated to 'paid' and linked to this manual payment
 * record. This preserves the full financial audit trail without creating any
 * Period Closing side effects.
 */
class ManualPaymentService
{
    /**
     * Create a standalone manual payment.
     *
     * @param  Publisher   $publisher     The publisher being paid.
     * @param  array       $data          Validated input (amount, method, reference?, notes?, payout_id?).
     * @param  User        $admin         The admin user initiating the payment.
     * @return Payout                     The newly created Payout record (is_manual_payment = true).
     *
     * @throws \RuntimeException         If the provided payout_id does not belong to this publisher
     *                                   or is already paid/rejected.
     */
    public function create(Publisher $publisher, array $data, User $admin): Payout
    {
        $amount        = (float) $data['amount'];
        $method        = $data['method'];
        $reference     = $data['reference'] ?? null;
        $notes         = $data['notes'] ?? null;
        $linkedPayoutId = $data['payout_id'] ?? null;

        $linkedPayout = null;

        // Validate the optional linked payout before opening a transaction.
        if ($linkedPayoutId) {
            $linkedPayout = Payout::find($linkedPayoutId);

            if (!$linkedPayout) {
                throw new \RuntimeException("Payout [{$linkedPayoutId}] not found.");
            }

            if ($linkedPayout->publisher_id !== $publisher->id) {
                throw new \RuntimeException("Payout [{$linkedPayoutId}] does not belong to publisher [{$publisher->id}].");
            }

            if ($linkedPayout->status === 'paid') {
                throw new \RuntimeException("Payout [{$linkedPayoutId}] is already marked as paid.");
            }

            if ($linkedPayout->status === 'rejected') {
                throw new \RuntimeException("Payout [{$linkedPayoutId}] is rejected and cannot be linked to a manual payment.");
            }
        }

        DB::beginTransaction();

        try {
            // Create the standalone manual payment record.
            // period_closing_id is intentionally NULL — this is a standalone payment.
            $manualPayout = Payout::create([
                'id'                => Str::uuid()->toString(),
                'publisher_id'      => $publisher->id,
                'period_closing_id' => null,      // ← NEVER set for manual payments
                'period_year'       => now()->year,
                'period_month'      => now()->month,
                'amount'            => $amount,
                'adjustment'        => 0,
                'final_amount'      => $amount,
                'status'            => 'paid',    // Manual payments are immediately "paid"
                'admin_note'        => $notes,
                'payment_method'    => $method,
                'payment_reference' => $reference,
                'paid_at'           => now(),
                'is_manual_payment' => true,
                'manual_paid_by'    => $admin->id,
            ]);

            // If a linked payout was provided, update its status to 'paid' and
            // record the payment details on it. This does NOT create or modify
            // any PeriodClosing record.
            if ($linkedPayout) {
                $oldStatus = $linkedPayout->status;
                $linkedPayout->update([
                    'status'            => 'paid',
                    'payment_reference' => $reference ?? $linkedPayout->payment_reference,
                    'paid_at'           => now(),
                    'admin_note'        => $notes ? ($linkedPayout->admin_note ? $linkedPayout->admin_note . "\n" . $notes : $notes) : $linkedPayout->admin_note,
                ]);

                AuditLogService::log(
                    'paid_via_manual_payment',
                    'Payout',
                    $linkedPayout->id,
                    ['status' => $oldStatus],
                    [
                        'status'             => 'paid',
                        'payment_reference'  => $reference,
                        'manual_payment_id'  => $manualPayout->id,
                        'paid_by_admin'      => $admin->id,
                    ]
                );
            }

            AuditLogService::log(
                'manual_payment_created',
                'Payout',
                $manualPayout->id,
                null,
                [
                    'publisher_id'      => $publisher->id,
                    'amount'            => $amount,
                    'method'            => $method,
                    'reference'         => $reference,
                    'linked_payout_id'  => $linkedPayoutId,
                    'initiated_by'      => $admin->id,
                ]
            );

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        // Send notification email outside the transaction so a mail failure
        // does not roll back the committed payment record.
        if ($publisher->email) {
            try {
                Mail::to($publisher->email)->send(new ManualPaymentMail($manualPayout->load('publisher')));
            } catch (\Exception $e) {
                // Silently swallow — payment is committed. Laravel log will capture the failure.
                \Illuminate\Support\Facades\Log::warning(
                    'ManualPaymentMail failed to send for payout ' . $manualPayout->id . ': ' . $e->getMessage()
                );
            }
        }

        return $manualPayout->load('publisher', 'manualPayer');
    }
}
