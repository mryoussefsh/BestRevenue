<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrafficQualityScore extends Model
{
    protected $fillable = [
        'website_id',
        'publisher_id',
        'date',
        'quality_score',
        'anomaly_count',
        'high_severity_anomalies',
        'dominant_country_pct',
        'referrer_diversity_score',
        'device_diversity_score',
        'flags',
    ];

    protected function casts(): array
    {
        return [
            'date'                     => 'date:Y-m-d',
            'quality_score'            => 'decimal:2',
            'anomaly_count'            => 'integer',
            'high_severity_anomalies'  => 'integer',
            'dominant_country_pct'     => 'decimal:2',
            'referrer_diversity_score' => 'decimal:2',
            'device_diversity_score'   => 'decimal:2',
            'flags'                    => 'array',
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

