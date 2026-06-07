<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RatioHistory extends Model
{
    use HasUuids;

    protected $table = 'ratio_history';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'old_ratio',
        'new_ratio',
        'changed_by',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'old_ratio'  => 'decimal:4',
            'new_ratio'  => 'decimal:4',
            'changed_at' => 'datetime',
        ];
    }
}
