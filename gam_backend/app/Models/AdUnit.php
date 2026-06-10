<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdUnit extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'website_id',
        'gam_ad_unit_name',
        'gam_ad_unit_id',
        'display_name',
        'ratio_override',
        'is_active',
        'ad_type',
        'ad_subtype',
        'repeat_count',
        'delay_between_ads',
    ];

    protected function casts(): array
    {
        return [
            'ratio_override'    => 'decimal:4',
            'is_active'         => 'boolean',
            'repeat_count'      => 'integer',
            'delay_between_ads' => 'integer',
        ];
    }

    public function website(): BelongsTo
    {
        return $this->belongsTo(Website::class);
    }

    public function revenueRecords(): HasMany
    {
        return $this->hasMany(RevenueRecord::class);
    }
}
