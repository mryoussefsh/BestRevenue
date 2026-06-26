<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrafficDailyStat extends Model
{
    protected $fillable = [
        'website_id',
        'publisher_id',
        'date',
        'visits',
        'unique_visitors',
        'mobile_visits',
        'desktop_visits',
        'tablet_visits',
        'top_countries',
        'top_referrers',
        'top_browsers',
        'countries_count',
    ];

    protected function casts(): array
    {
        return [
            'date'             => 'date:Y-m-d',
            'visits'           => 'integer',
            'unique_visitors'  => 'integer',
            'mobile_visits'    => 'integer',
            'desktop_visits'   => 'integer',
            'tablet_visits'    => 'integer',
            'top_countries'    => 'array',
            'top_referrers'    => 'array',
            'top_browsers'     => 'array',
            'countries_count'  => 'integer',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function website(): BelongsTo
    {
        return $this->belongsTo(Website::class);
    }
}

