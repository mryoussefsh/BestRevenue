<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Carbon\Carbon;

class GamAccount extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'name',
        'email',
        'network_code',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'status',
        'last_synced_at',
        'notes',
        'ads_txt',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
        'last_synced_at'   => 'datetime',
        // Tokens are encrypted at rest using Laravel's built-in encryption
        'access_token'     => 'encrypted',
        'refresh_token'    => 'encrypted',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function websites()
    {
        return $this->hasMany(Website::class, 'gam_account_id');
    }

    // ─── Helpers ──────────────────────────────────────────────────

    public function isTokenExpired(): bool
    {
        if (!$this->token_expires_at) return false;
        return $this->token_expires_at->isPast();
    }

    public function getStatusBadge(): string
    {
        if ($this->status === 'disconnected') return 'disconnected';
        if ($this->isTokenExpired()) return 'expired';
        return 'active';
    }

    // Expose safe fields for API responses
    public function toApiArray(): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'email'           => $this->email,
            'network_code'    => $this->network_code,
            'status'          => $this->getStatusBadge(),
            'last_synced_at'  => $this->last_synced_at,
            'token_expires_at'=> $this->token_expires_at,
            'websites_count'  => $this->websites_count ?? 0,
            'notes'           => $this->notes,
            'ads_txt'         => $this->ads_txt,
            'created_at'      => $this->created_at,
        ];
    }
}
