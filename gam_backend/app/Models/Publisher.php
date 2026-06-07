<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Publisher extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'email',
        'default_ratio',
        'status',
        'payment_info',
        'notes',
        'pending_balance_adjustment',
        'phone',
        'telegram',
        'skype',
        'country',
        'reg_ip',
        'last_ip',
    ];

    protected function casts(): array
    {
        return [
            'default_ratio' => 'decimal:4',
            'pending_balance_adjustment' => 'decimal:2',
        ];
    }

    /**
     * Accessor and Mutator for payment_info attribute.
     * Encrypts/decrypts value on save/read, but falls back to plain JSON decoding
     * if decryption fails (e.g. for existing unencrypted seeded records).
     */
    protected function paymentInfo(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: function ($value) {
                if (!$value) {
                    return null;
                }
                try {
                    return decrypt($value);
                } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                    $decoded = json_decode($value, true);
                    return is_array($decoded) ? $decoded : $value;
                }
            },
            set: function ($value) {
                return $value !== null ? encrypt($value) : null;
            }
        );
    }

    // ─── Relationships ────────────────────────────────────────────────

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function websites(): HasMany
    {
        return $this->hasMany(Website::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(Adjustment::class);
    }

    /**
     * Recalculates and updates the cached pending_balance_adjustment column for a publisher.
     *
     * FIX [NEW-10]: Use bcadd() accumulation instead of casting MySQL SUM() to float.
     * MySQL SUM() of DECIMAL columns returns a string; casting to float loses precision
     * for publishers with many decimal-precision adjustment amounts.
     */
    public static function syncPendingBalance(string $publisherId): void
    {
        $adjustments = \App\Models\Adjustment::where('publisher_id', $publisherId)
            ->where('status', 'pending')
            ->pluck('amount');

        $sum = '0';
        foreach ($adjustments as $amount) {
            $sum = bcadd($sum, (string) $amount, 6);
        }

        \DB::table('publishers')
            ->where('id', $publisherId)
            ->update(['pending_balance_adjustment' => (float) $sum]);
    }
}
