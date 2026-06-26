<?php

namespace App\Notifications;

use App\Models\TrafficAnomaly;
use App\Services\TrafficService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Redis;

/**
 * TrafficAnomalyNotification
 *
 * Channels:
 *   - database  → always (drives the admin bell notification)
 *   - mail      → only for severity high or critical
 *
 * Email throttle:
 *   Max 1 email per publisher per hour regardless of anomaly count.
 *   Uses Redis key: traffic:email_throttle:{publisher_id} with 1h TTL.
 */
class TrafficAnomalyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly TrafficAnomaly $anomaly
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Email only for high/critical severity
        if (in_array($this->anomaly->severity, ['high', 'critical'], true)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    // ─── Database notification ────────────────────────────────────────────

    public function toArray(object $notifiable): array
    {
        $publisher = $this->anomaly->publisher;

        return [
            'type'            => 'traffic_anomaly',
            'anomaly_id'      => $this->anomaly->id,
            'anomaly_type'    => $this->anomaly->anomaly_type,
            'type_label'      => $this->anomaly->getTypeLabel(),
            'severity'        => $this->anomaly->severity,
            'publisher_id'    => $this->anomaly->publisher_id,
            'publisher_name'  => $publisher?->name ?? 'Unknown Publisher',
            'metric_name'     => $this->anomaly->metric_name,
            'baseline_value'  => (float) $this->anomaly->baseline_value,
            'current_value'   => (float) $this->anomaly->current_value,
            'deviation_pct'   => (float) $this->anomaly->deviation_pct,
            'detected_at'     => $this->anomaly->detected_at?->toIso8601String(),
            'detail_url'      => config('app.frontend_url', 'http://localhost:5173')
                                 . '/admin/traffic/publishers/' . $this->anomaly->publisher_id,
            'resolve_url'     => config('app.frontend_url', 'http://localhost:5173')
                                 . '/admin/traffic/anomalies',
        ];
    }

    // ─── Email notification ───────────────────────────────────────────────

    public function toMail(object $notifiable): ?MailMessage
    {
        // Throttle: max 1 email per publisher per hour
        $throttleKey = TrafficService::keyEmailThrottle($this->anomaly->publisher_id);

        if (\Illuminate\Support\Facades\Cache::has($throttleKey)) {
            return null; // silently skip — throttled
        }

        // Set throttle key with 1-hour TTL
        \Illuminate\Support\Facades\Cache::put($throttleKey, 1, 3600);

        $publisher    = $this->anomaly->publisher;
        $publisherName = $publisher?->name ?? 'Unknown Publisher';
        $typeLabel    = $this->anomaly->getTypeLabel();
        $severity     = strtoupper($this->anomaly->severity);
        $detailUrl    = config('app.frontend_url', 'http://localhost:5173')
                        . '/admin/traffic/publishers/' . $this->anomaly->publisher_id;
        $resolveUrl   = config('app.frontend_url', 'http://localhost:5173')
                        . '/admin/traffic/anomalies';
        $baselineFmt  = number_format((float) $this->anomaly->baseline_value, 0);
        $currentFmt   = number_format((float) $this->anomaly->current_value, 0);
        $deviationX   = number_format((float) $this->anomaly->deviation_pct / 100, 1);
        $detectedAt   = $this->anomaly->detected_at?->format('Y-m-d H:i') . ' UTC';

        $siteName = \App\Models\Setting::get('site_name', config('app.name'));

        return (new MailMessage)
            ->subject("[{$severity}] Traffic Anomaly: {$typeLabel} — {$publisherName}")
            ->greeting("Traffic Alert: {$typeLabel}")
            ->line("**Publisher:** {$publisherName}")
            ->line("**Anomaly:** {$typeLabel}")
            ->line("**Severity:** {$severity}")
            ->line("**Detected:** {$detectedAt}")
            ->line("**What was detected:** Visits jumped from ~{$baselineFmt} (baseline) to {$currentFmt} ({$deviationX}× normal).")
            ->action('View Publisher Traffic Detail', $detailUrl)
            ->action('Mark as Reviewed', $resolveUrl)
            ->line("This is an automated alert from the {$siteName} Traffic Intelligence System.")
            ->line('You can configure alert thresholds and email preferences in the admin settings.');
    }
}
