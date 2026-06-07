<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Adjustment extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    // FIX [SEC-7]: 'id' removed from $fillable — HasUuids trait auto-generates UUIDs.
    // Having 'id' fillable allows ID spoofing via mass assignment if user input ever reaches create().
    // The forceCreate() calls in PeriodAutoClose.php bypass $fillable and still work correctly.
    protected $fillable = [
        'publisher_id',
        'amount',
        'notes',
        'status',
        'period_closing_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    // Relationships

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function periodClosing(): BelongsTo
    {
        return $this->belongsTo(PeriodClosing::class);
    }

    protected static function booted()
    {
        static::saved(function ($adjustment) {
            $adjustment->syncPublisherPendingBalance();
        });

        static::deleted(function ($adjustment) {
            $adjustment->syncPublisherPendingBalance();
        });
    }

    public function syncPublisherPendingBalance()
    {
        if ($this->publisher_id) {
            \Illuminate\Support\Facades\DB::afterCommit(function () {
                Publisher::syncPendingBalance($this->publisher_id);
            });
        }
    }
}
