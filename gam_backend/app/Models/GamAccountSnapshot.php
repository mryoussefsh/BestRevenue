<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GamAccountSnapshot extends Model
{
    /**
     * Snapshot of a deleted GAM account's metadata, keyed by Google email.
     * Used to restore name, network_code, ads_txt, and notes automatically when
     * the same account is reconnected via OAuth.
     */
    protected $primaryKey = 'email';
    protected $keyType    = 'string';
    public $incrementing  = false;

    protected $fillable = [
        'email',
        'name',
        'network_code',
        'ads_txt',
        'notes',
    ];
}
