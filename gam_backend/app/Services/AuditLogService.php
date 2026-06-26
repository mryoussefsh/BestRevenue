<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log an action to the audit logs.
     *
     * @param string      $action       e.g. 'created', 'updated', 'deleted', 'approved'
     * @param string      $entityType   e.g. 'Publisher', 'Website', 'Setting'
     * @param string|null $entityId
     * @param array|null  $oldValues
     * @param array|null  $newValues
     * @param string|null $description  Optional override for human-readable description
     */
    public static function log(
        string  $action,
        string  $entityType,
        ?string $entityId   = null,
        ?array  $oldValues  = null,
        ?array  $newValues  = null,
        ?string $description = null
    ): void {
        $user   = Auth::user();
        $userId = $user?->id;

        // Resolve the actor's role label
        $userRole = null;
        if ($user) {
            $userRole = $user->role ?? 'admin';
        }

        // Filter out unchanged values if both arrays are provided
        if ($oldValues !== null && $newValues !== null) {
            $filteredOld = [];
            $filteredNew = [];
            foreach ($newValues as $key => $value) {
                if (!array_key_exists($key, $oldValues) || $oldValues[$key] !== $value) {
                    $filteredNew[$key] = $value;
                    if (array_key_exists($key, $oldValues)) {
                        $filteredOld[$key] = $oldValues[$key];
                    }
                }
            }
            $oldValues = empty($filteredOld) ? null : $filteredOld;
            $newValues = empty($filteredNew) ? null : $filteredNew;

            // If no actual changes, skip logging for 'updated' events
            if ($action === 'updated' && $oldValues === null && $newValues === null) {
                return;
            }
        }

        // Auto-generate description if not provided
        if ($description === null) {
            $description = self::generateDescription($action, $entityType, $entityId, $oldValues, $newValues, $user);
        }

        AuditLog::create([
            'user_id'     => $userId,
            'user_role'   => $userRole,
            'action'      => $action,
            'description' => $description,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'old_values'  => $oldValues,
            'new_values'  => $newValues,
            'ip_address'  => Request::ip(),
        ]);
    }

    /**
     * Generate a human-readable one-line description of the audit event.
     */
    private static function generateDescription(
        string  $action,
        string  $entityType,
        ?string $entityId,
        ?array  $oldValues,
        ?array  $newValues,
        ?object $user
    ): string {
        $actor     = $user ? $user->name : 'System';
        $shortId   = $entityId ? ('#' . substr($entityId, 0, 8)) : '';
        $entity    = $entityType . ($shortId ? " $shortId" : '');

        // Pull useful context from new/old values
        $name            = $newValues['name']              ?? $oldValues['name']              ?? null;
        $email           = $newValues['email']             ?? $oldValues['email']             ?? null;
        $status          = $newValues['status']            ?? null;
        $amount          = $newValues['amount']            ?? $newValues['total_amount']      ?? null;
        $ref             = $newValues['payment_reference'] ?? null;
        $adminNote       = $newValues['admin_note']        ?? null;
        $key             = $newValues['key']               ?? $entityId;
        $settingKey      = ($entityType === 'Setting' && $key) ? str_replace('_', ' ', $key) : $key;
        $periodMonth     = $newValues['month']             ?? $oldValues['month']             ?? null;
        $periodYear      = $newValues['year']              ?? $oldValues['year']              ?? null;

        if ($entityType === 'Publisher' && !$name && !$email && $entityId) {
            $pub = \App\Models\Publisher::find($entityId);
            if ($pub) {
                $name = $pub->name;
                $email = $pub->email;
            }
        }

        $publisherLabel  = $name ? "\"$name\"" : ($email ? $email : $shortId);

        $map = [
            // Publishers
            'Publisher:created'              => "$actor created publisher $publisherLabel",
            'Publisher:updated'              => "$actor updated publisher $publisherLabel",
            'Publisher:deleted'              => "$actor deleted publisher $publisherLabel",
            'Publisher:suspended'            => "$actor suspended publisher $publisherLabel",
            'Publisher:activated'            => "$actor activated publisher $publisherLabel",
            'Publisher:registered'           => "Publisher $publisherLabel self-registered",
            'Publisher:ratio_changed'        => "$actor changed revenue ratio for publisher $publisherLabel",
            'Publisher:password_reset'       => "$actor reset password for publisher $publisherLabel",
            'Publisher:notes_updated'        => "$actor updated notes for publisher $publisherLabel",
            'Publisher:payment_info_updated' => "Publisher $publisherLabel updated their payment method information",
            'Publisher:profile_updated'      => "Publisher $publisherLabel updated their profile details",
            'Publisher:password_changed'     => "Publisher $publisherLabel changed their password",

            // Websites
            'Website:created'          => "$actor created website" . ($name ? " \"$name\"" : " $shortId"),
            'Website:updated'          => "$actor updated website" . ($name ? " \"$name\"" : " $shortId"),
            'Website:deleted'          => "$actor deleted website" . ($name ? " \"$name\"" : " $shortId"),
            'Website:status_changed'   => "$actor changed status of website" . ($name ? " \"$name\"" : " $shortId") . ($status ? " to $status" : ''),

            // Ad Units
            'AdUnit:created'           => "$actor created ad unit $shortId",
            'AdUnit:created_in_gam'    => "$actor created ad unit $shortId in GAM",
            'AdUnit:bulk_created_in_gam' => "$actor bulk-created ad unit $shortId in GAM",
            'AdUnit:updated'           => "$actor updated ad unit $shortId",
            'AdUnit:deleted'           => "$actor deleted ad unit $shortId",

            // Payouts
            'Payout:created'           => "$actor created payout $shortId" . ($amount ? " (\$$amount)" : ''),
            'Payout:approved'          => "$actor approved payout $shortId",
            'Payout:rejected'          => "$actor rejected payout $shortId" . ($adminNote ? " — $adminNote" : ''),
            'Payout:paid'              => "$actor marked payout $shortId as paid" . ($ref ? " (ref: $ref)" : ''),
            'Payout:email_sent'        => "Payment notification email sent for payout $shortId",

            // Adjustments
            'Adjustment:created'       => "$actor created adjustment $shortId" . ($amount ? " (\$$amount)" : ''),
            'Adjustment:deleted'       => "$actor deleted adjustment $shortId",
            'Adjustment:applied'       => "$actor applied adjustment $shortId",
            'Adjustment:ivt_deduction' => "$actor applied IVT deduction $shortId",
            'Adjustment:bonus_applied' => "$actor applied bonus adjustment $shortId",

            // Period Closings
            'PeriodClosing:close_initiated' => "$actor initiated period close" . ($periodMonth && $periodYear ? " for $periodMonth/$periodYear" : ''),
            'PeriodClosing:closed'          => "Period" . ($periodMonth && $periodYear ? " $periodMonth/$periodYear" : " $shortId") . " was closed",
            'PeriodClosing:auto_closed'     => "Period" . ($periodMonth && $periodYear ? " $periodMonth/$periodYear" : " $shortId") . " was auto-closed by scheduler",
            'PeriodClosing:deleted'         => "$actor deleted period closing $shortId",
            'PeriodClosing:recovered'       => "$actor initiated period closing recovery $shortId",

            // GAM Accounts
            'GamAccount:created'       => "$actor created GAM account" . ($name ? " \"$name\"" : " $shortId"),
            'GamAccount:updated'       => "$actor updated GAM account" . ($name ? " \"$name\"" : " $shortId"),
            'GamAccount:deleted'       => "$actor deleted GAM account" . ($name ? " \"$name\"" : " $shortId"),
            'GamAccount:connected'     => "$actor connected GAM account" . ($name ? " \"$name\"" : " $shortId"),
            'GamAccount:trigger_sync'   => "$actor triggered manual GAM sync",

            // Settings
            'Setting:updated'          => "$actor changed setting" . ($settingKey ? " \"$settingKey\"" : ''),

            // Revenue
            'RevenueRecord:revenue_wipe' => "$actor WIPED all revenue records and sync logs",

            // Admin Management
            'Admin:created'            => "$actor created administrator $publisherLabel",
            'Admin:updated'            => "$actor updated administrator $publisherLabel",
            'Admin:deleted'            => "$actor deleted administrator $publisherLabel",
            'Admin:profile_updated'    => "$actor updated their own profile",
            'Admin:password_changed'   => "$actor changed their password",

            // Email Templates
            'EmailTemplate:updated'    => "$actor updated email template \"$entityId\"",
            'EmailTemplate:reset'      => "$actor reset email template \"$entityId\" to default",

            // Announcements
            'Announcement:created'     => "$actor created announcement" . ($name ? " \"$name\"" : " $shortId"),
            'Announcement:updated'     => "$actor updated announcement" . ($name ? " \"$name\"" : " $shortId"),
            'Announcement:deleted'     => "$actor deleted announcement" . ($name ? " \"$name\"" : " $shortId"),

            // Roles & Permissions
            'Role:created'             => "$actor created role \"$name\"",
            'Role:updated'             => "$actor updated role \"$name\"",
            'Role:deleted'             => "$actor deleted role \"$name\"",

            // Support Tickets
            'Ticket:created'           => "$actor opened support ticket #$entityId",
            'Ticket:updated'           => "$actor updated support ticket #$entityId",
            'Ticket:reply'             => "$actor replied to support ticket #$entityId",
            'Ticket:closed'            => "$actor closed support ticket #$entityId",

            // Traffic Anomalies
            'TrafficAnomaly:resolved'  => "$actor resolved traffic anomaly #$entityId",

            // Translations
            'Translation:updated'      => "$actor updated translation for \"$entityId\"",

            // Custom Pages & FAQs
            'Faq:created'              => "$actor created FAQ" . ($name ? " \"$name\"" : " $shortId"),
            'Faq:updated'              => "$actor updated FAQ" . ($name ? " \"$name\"" : " $shortId"),
            'Faq:deleted'              => "$actor deleted FAQ" . ($name ? " \"$name\"" : " $shortId"),
            'Page:created'             => "$actor created page" . ($name ? " \"$name\"" : " $shortId"),
            'Page:updated'             => "$actor updated page" . ($name ? " \"$name\"" : " $shortId"),
            'Page:deleted'             => "$actor deleted page" . ($name ? " \"$name\"" : " $shortId"),
        ];

        $lookupKey = "$entityType:$action";
        if (isset($map[$lookupKey])) {
            return $map[$lookupKey];
        }

        $cleanAction = str_replace('_', ' ', $action);
        $cleanEntityType = str_replace('_', ' ', $entityType);
        $cleanEntity = $cleanEntityType . ($shortId ? " $shortId" : '');

        return "$actor performed $cleanAction on $cleanEntity";
    }
}
