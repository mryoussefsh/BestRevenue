<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'title', 'content', 'type', 'priority', 'is_active', 
        'start_date', 'end_date', 'allow_dismiss', 'buttons',
        'target_type', 'target_publishers', 'target_countries', 'target_roles'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'allow_dismiss' => 'boolean',
        'buttons' => 'array',
        'target_publishers' => 'array',
        'target_countries' => 'array',
        'target_roles' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function interactions()
    {
        return $this->hasMany(AnnouncementInteraction::class);
    }
}
