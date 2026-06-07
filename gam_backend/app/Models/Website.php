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
    ];

    protected function casts(): array
    {
        return [
            'ratio_override' => 'decimal:4',
            'is_active'      => 'boolean',
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
}
