<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'publisher_id',
        'user_id',
        'assigned_to',
        'subject',
        'category',
        'priority',
        'status',
        'last_viewed_by_publisher_at',
        'last_viewed_by_admin_at',
    ];

    protected $casts = [
        'last_viewed_by_publisher_at' => 'datetime',
        'last_viewed_by_admin_at' => 'datetime',
    ];

    public function publisher()
    {
        return $this->belongsTo(Publisher::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at', 'asc');
    }
}
