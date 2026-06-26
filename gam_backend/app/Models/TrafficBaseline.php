<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrafficBaseline extends Model
{
    protected $fillable = [
        'website_id',
        'publisher_id',
        'day_of_week',
        'hour',
        'avg_visits',
        'avg_unique_visitors',
        'top_country_code',
        'normal_country_concentration',
        'sample_weeks',
        'last_calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week'                  => 'integer',
            'hour'                         => 'integer',
            'avg_visits'                   => 'decimal:2',
            'avg_unique_visitors'          => 'decimal:2',
            'normal_country_concentration' => 'decimal:2',
            'sample_weeks'                 => 'integer',
            'last_calculated_at'           => 'datetime',
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

