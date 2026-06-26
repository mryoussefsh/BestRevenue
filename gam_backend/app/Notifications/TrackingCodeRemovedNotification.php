<?php

namespace App\Notifications;

use App\Models\Website;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TrackingCodeRemovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Website $website
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $publisher = $this->website->publisher;
        return [
            'type'           => 'tracking_code_removed',
            'website_id'     => $this->website->id,
            'domain'         => $this->website->domain,
            'publisher_id'   => $this->website->publisher_id,
            'publisher_name' => $publisher?->name ?? 'Unknown Publisher',
            'message'        => "Tracking script was removed from {$this->website->domain}.",
            'url'            => "/admin/websites"
        ];
    }
}
