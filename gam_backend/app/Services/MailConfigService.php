<?php

namespace App\Services;

use App\Models\Setting;

class MailConfigService
{
    /**
     * Apply mail settings from the database to the runtime Laravel mail configuration.
     * Call this before sending any email.
     */
    public static function applyFromSettings(): void
    {
        $mailer     = Setting::get('mail_mailer', env('MAIL_MAILER', 'log'));
        $host       = Setting::get('mail_host', env('MAIL_HOST', '127.0.0.1'));
        $port       = (int) Setting::get('mail_port', env('MAIL_PORT', 587));
        $username   = Setting::get('mail_username', env('MAIL_USERNAME'));
        $password   = Setting::get('mail_password', env('MAIL_PASSWORD'));
        $encryption = Setting::get('mail_encryption', env('MAIL_ENCRYPTION', 'tls'));
        $fromAddr   = Setting::get('mail_from_address', env('MAIL_FROM_ADDRESS', 'noreply@example.com'));
        $fromName   = Setting::get('mail_from_name', env('MAIL_FROM_NAME', config('app.name')));

        // Normalize: treat 'none' as null (no encryption)
        if ($encryption === 'none' || $encryption === '') {
            $encryption = null;
        }

        config(['mail.default' => $mailer]);
        config(['mail.mailers.smtp.host' => $host]);
        config(['mail.mailers.smtp.port' => $port]);
        config(['mail.mailers.smtp.username' => $username]);
        config(['mail.mailers.smtp.password' => $password]);
        config(['mail.mailers.smtp.encryption' => $encryption]);
        config(['mail.from.address' => $fromAddr]);
        config(['mail.from.name'    => $fromName]);
    }
}
