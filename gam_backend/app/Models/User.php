<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, Notifiable, HasRoles;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'publisher_id',
        'is_active',
    ];

    protected $appends = [
        'roles_list',
        'permissions_list',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────

    public function publisher()
    {
        return $this->belongsTo(Publisher::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPublisher(): bool
    {
        return $this->role === 'publisher';
    }

    // Accessors for Spatie Roles and Permissions serialization
    public function getRolesListAttribute(): array
    {
        return $this->getRoleNames()->toArray();
    }

    public function getPermissionsListAttribute(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }
}
