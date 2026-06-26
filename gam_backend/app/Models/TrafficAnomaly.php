<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrafficAnomaly extends Model
{
    protected $fillable = [
        'website_id',
        'website_domain',
        'publisher_id',
        'detected_at',
        'anomaly_type',
        'severity',
        'metric_name',
        'baseline_value',
        'current_value',
        'deviation_pct',
        'context',
        'is_resolved',
        'resolved_at',
        'admin_notes',
        'notification_sent',
    ];

    protected function casts(): array
    {
        return [
            'detected_at'       => 'datetime',
            'baseline_value'    => 'decimal:2',
            'current_value'     => 'decimal:2',
            'deviation_pct'     => 'decimal:2',
            'context'           => 'array',
            'is_resolved'       => 'boolean',
            'resolved_at'       => 'datetime',
            'notification_sent' => 'boolean',
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

    // ─── Helpers ──────────────────────────────────────────────────────

    /**
     * Human-readable label for the anomaly type.
     */
    public function getTypeLabel(): string
    {
        return match ($this->anomaly_type) {
            'volume_spike'      => 'Volume Spike',
            'volume_drop'       => 'Volume Drop',
            'country_flood'     => 'Country Flood',
            'referrer_flood'    => 'Referrer Flood',
            'device_anomaly'    => 'Device Anomaly',
            'new_country_spike' => 'New Country Spike',
            default             => ucfirst(str_replace('_', ' ', $this->anomaly_type)),
        };
    }
}

