<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Website extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'publisher_id',
        'gam_account_id',
        'domain',
        'ratio_override',
        'gam_network_code',
        'is_active',
        'tracking_status',
        'tracking_checked_at',
        'last_gam_account_email',
    ];

    protected function casts(): array
    {
        return [
            'ratio_override' => 'decimal:4',
            'is_active'      => 'boolean',
            'tracking_checked_at' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function gamAccount(): BelongsTo
    {
        return $this->belongsTo(GamAccount::class, 'gam_account_id');
    }

    public function adUnits(): HasMany
    {
        return $this->hasMany(AdUnit::class);
    }

    public function hourlyStats(): HasMany
    {
        return $this->hasMany(TrafficHourlyStat::class);
    }

    public function dailyStats(): HasMany
    {
        return $this->hasMany(TrafficDailyStat::class);
    }

    public function baselines(): HasMany
    {
        return $this->hasMany(TrafficBaseline::class);
    }

    public function anomalies(): HasMany
    {
        return $this->hasMany(TrafficAnomaly::class);
    }

    public function qualityScores(): HasMany
    {
        return $this->hasMany(TrafficQualityScore::class);
    }

    /**
     * Clear all cached website and ad unit listings query results.
     */
    public static function clearCache(): void
    {
        \Illuminate\Support\Facades\Cache::forever('website_cache_version', time());
    }

    /**
     * Get the current website cache version string.
     */
    public static function getCacheVersion(): string
    {
        return (string) \Illuminate\Support\Facades\Cache::rememberForever('website_cache_version', function () {
            return time();
        });
    }
}
