<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GamSyncLog extends Model
{
    public $timestamps = false; // We use started_at and finished_at

    protected $fillable = [
        'triggered_by',
        'started_at',
        'finished_at',
        'status',
        'rows_fetched',
        'rows_matched',
        'rows_skipped',
        'rows_locked',
        'error_message',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];
}
