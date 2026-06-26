<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrafficHourlyStat extends Model
{
    protected $fillable = [
        'website_id',
        'publisher_id',
        'date',
        'hour',
        'device_type',
        'visits',
        'unique_visitors',
        'active_visitors_peak',
    ];

    protected function casts(): array
    {
        return [
            'date'                 => 'date:Y-m-d',
            'hour'                 => 'integer',
            'visits'               => 'integer',
            'unique_visitors'      => 'integer',
            'active_visitors_peak' => 'integer',
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

