<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'publisher_id',
        'period_closing_id',   // nullable for standalone manual payments
        'period_year',
        'period_month',
        'amount',
        'adjustment',
        'final_amount',
        'status',
        'admin_note',
        'payment_method',
        'payment_account',
        'payment_reference',
        'approved_by',
        'approved_at',
        'paid_at',
        // REFACTOR [MPAY-1]: Manual payment fields
        'is_manual_payment',   // true = standalone manual payment, no period involved
        'manual_paid_by',      // UUID of admin who initiated the manual payment
        'idempotency_key',
    ];

    protected function casts(): array
    {
        return [
            'amount'            => 'decimal:2',
            'adjustment'        => 'decimal:2',
            'final_amount'      => 'decimal:2',
            'approved_at'       => 'datetime',
            'paid_at'           => 'datetime',
            'is_manual_payment' => 'boolean',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function periodClosing(): BelongsTo
    {
        return $this->belongsTo(PeriodClosing::class);
    }

    /**
     * The admin user who initiated this as a manual payment.
     * Distinct from approved_by which tracks the approval step.
     */
    public function manualPayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manual_paid_by');
    }

    /**
     * Convenience: true if this payout is a standalone manual payment
     * that has no associated PeriodClosing.
     */
    public function isManualPayment(): bool
    {
        return (bool) $this->is_manual_payment;
    }
}
