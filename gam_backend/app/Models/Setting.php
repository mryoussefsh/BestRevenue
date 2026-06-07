<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false; // only updated_at

    const UPDATED_AT = 'updated_at';
    const CREATED_AT = null;

    protected $fillable = ['key', 'value', 'group', 'label', 'type'];

    /**
     * Boot the model. Automatically invalidate settings cache on save or delete.
     */
    protected static function booted(): void
    {
        static::saved(function ($setting) {
            Cache::forget("setting_{$setting->key}");
        });

        static::deleted(function ($setting) {
            Cache::forget("setting_{$setting->key}");
        });
    }

    /**
     * Get a setting value by key, with optional default.
     *
     * FIX [R-4 / FIX-24]: Wrapped in a 5-minute cache to avoid a DB round-trip
     * on every request. Settings like payout_threshold and approve_earnings_day
     * are read in every period close loop iteration and every dashboard load.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $cacheKey = "setting_{$key}";

        $setting = Cache::remember($cacheKey, 300, function () use ($key) {
            return static::find($key);
        });

        if (!$setting) return $default;

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $setting->value,
            'json'    => json_decode($setting->value, true),
            default   => $setting->value,
        };
    }

    /**
     * Set a setting value by key.
     *
     * FIX [R-4 / FIX-24]: Invalidate the cache after saving so reads immediately
     * reflect the new value without waiting for TTL expiry.
     */
    public static function set(string $key, mixed $value): void
    {
        $setting = static::find($key);
        if ($setting) {
            $setting->value = is_array($value) ? json_encode($value) : $value;
            $setting->updated_at = now();
            $setting->save();

            // Invalidate so the next ::get() call reads the fresh value from DB.
            Cache::forget("setting_{$key}");
        }
    }
}
