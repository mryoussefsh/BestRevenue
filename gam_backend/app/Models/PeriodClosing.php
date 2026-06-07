<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodClosing extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'period_year',
        'period_month',
        'status',
        'closed_at',
        'closed_by',
        'total_gross_revenue',
        'total_publisher_earnings',
        'total_impressions',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'period_year'               => 'integer',
            'period_month'              => 'integer',
            'closed_at'                 => 'datetime',
            'total_gross_revenue'       => 'decimal:6',
            'total_publisher_earnings'  => 'decimal:6',
            'total_impressions'         => 'integer',
        ];
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public function revenueRecords(): HasMany
    {
        return $this->hasMany(RevenueRecord::class);
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Human-readable period label: e.g. "May 2026"
     */
    public function getPeriodLabelAttribute(): string
    {
        return \Carbon\Carbon::create($this->period_year, $this->period_month, 1)
            ->format('F Y');
    }
}
