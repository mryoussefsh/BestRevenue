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
        'period_closing_id',
        'period_year',
        'period_month',
        'amount',
        'adjustment',
        'final_amount',
        'status',
        'admin_note',
        'payment_method',
        'payment_reference',
        'approved_by',
        'approved_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'       => 'decimal:2',
            'adjustment'   => 'decimal:2',
            'final_amount' => 'decimal:2',
            'approved_at'  => 'datetime',
            'paid_at'      => 'datetime',
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
}
