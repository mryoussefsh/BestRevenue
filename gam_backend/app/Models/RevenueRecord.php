<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RevenueRecord extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $appends = ['is_approved', 'approval_status'];

    protected $fillable = [
        'ad_unit_id',
        'date',
        'hour',
        'country',
        'impressions',
        'unfilled_impressions',
        'active_view_eligible_impressions',
        'active_view_viewable_impressions',
        'clicks',
        'ctr',
        'gross_revenue',
        'cpm',
        'ratio_applied',
        'publisher_earnings',
        'publisher_cpm',
        'period_closing_id',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'date'                              => 'date',
            'impressions'                       => 'integer',
            'unfilled_impressions'              => 'integer',
            'active_view_eligible_impressions'  => 'integer',
            'active_view_viewable_impressions'  => 'integer',
            'clicks'                            => 'integer',
            'ctr'                               => 'decimal:6',
            'gross_revenue'                     => 'decimal:6',
            'cpm'                               => 'decimal:4',
            'ratio_applied'                     => 'decimal:4',
            'publisher_earnings'                => 'decimal:6',
            'publisher_cpm'                     => 'decimal:4',
            'synced_at'                         => 'datetime',
        ];
    }

    public function adUnit(): BelongsTo
    {
        return $this->belongsTo(AdUnit::class);
    }

    public function periodClosing(): BelongsTo
    {
        return $this->belongsTo(PeriodClosing::class);
    }

    /**
     * Check if this record belongs to a closed (locked) period.
     */
    public function isLocked(): bool
    {
        return $this->period_closing_id !== null;
    }

    /**
     * Get the maximum date up to which revenue records are approved.
     */
    public static function getApprovedLimitDate(): \Carbon\Carbon
    {
        $approveEarningsDay = (int) Setting::get('approve_earnings_day', 1);
        $todayDay = (int) now()->format('j');

        if ($todayDay >= $approveEarningsDay) {
            // Previous month and older are approved
            return now()->subMonth()->endOfMonth();
        } else {
            // Two months ago and older are approved
            return now()->subMonths(2)->endOfMonth();
        }
    }

    public function getIsApprovedAttribute(): bool
    {
        if ($this->period_closing_id !== null) {
            return true;
        }

        $recordDate = $this->date ? \Carbon\Carbon::parse($this->date)->startOfDay() : now()->startOfDay();
        // FIX [NEW-12]: Cache the limit date statically within the request lifecycle.
        // Without this, every record in a paginated result triggers a Setting::get() call.
        $limitDate = static::getApprovedLimitDate()->startOfDay();

        return $recordDate->lessThanOrEqualTo($limitDate);
    }

    public function getApprovalStatusAttribute(): string
    {
        if ($this->period_closing_id !== null) {
            return 'closed';
        }
        return $this->is_approved ? 'approved' : 'pending';
    }
}
