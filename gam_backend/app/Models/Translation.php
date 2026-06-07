<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Translation extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    const UPDATED_AT = 'updated_at';
    const CREATED_AT = null;

    protected $fillable = ['locale', 'key', 'value', 'group'];

    /**
     * Get all translations for a locale as a flat associative array.
     * e.g. ['nav.dashboard' => 'Dashboard', 'nav.payouts' => 'Payouts']
     */
    public static function getLocaleMap(string $locale): array
    {
        return static::where('locale', $locale)
            ->pluck('value', 'key')
            ->toArray();
    }
}
