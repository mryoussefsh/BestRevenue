<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'title',
        'title_ar',
        'slug',
        'content',
        'content_ar',
        'show_in_public_footer',
        'show_in_publisher_footer',
        'show_in_landing_menu',
        'is_active',
    ];

    protected $casts = [
        'show_in_public_footer' => 'boolean',
        'show_in_publisher_footer' => 'boolean',
        'show_in_landing_menu' => 'boolean',
        'is_active' => 'boolean',
    ];
}
