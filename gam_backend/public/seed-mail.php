<?php
// Place this inside your live server's gam_backend/public/ directory
// Visit: https://yourdomain.com/seed-mail.php
// Delete this file from the server immediately after execution!

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Setting;

$emailSettings = [
    ['key' => 'mail_mailer',       'label' => 'Mail Driver (smtp/log)',  'value' => 'log',                    'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_host',         'label' => 'SMTP Host',               'value' => 'smtp.mailtrap.io',       'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_port',         'label' => 'SMTP Port',               'value' => '587',                    'type' => 'integer', 'group' => 'email'],
    ['key' => 'mail_username',     'label' => 'SMTP Username',           'value' => '',                       'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_password',     'label' => 'SMTP Password',           'value' => '',                       'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_encryption',   'label' => 'Encryption (tls/ssl/none)','value' => 'tls',                  'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_from_address', 'label' => 'Sender Email',            'value' => 'noreply@' . strtolower(str_replace(' ', '', config('app.name', 'bestrevenue'))) . '.com','type' => 'string',  'group' => 'email'],
    ['key' => 'mail_from_name',    'label' => 'Sender Name',             'value' => config('app.name'),       'type' => 'string',  'group' => 'email'],
];

echo "<div style='font-family: sans-serif; padding: 20px; max-width: 600px; margin: 50px auto; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>";
echo "<h2 style='color:#333;'>Seeding SMTP Settings...</h2><hr><ul style='line-height: 1.6;'>";

foreach ($emailSettings as $s) {
    Setting::firstOrCreate(['key' => $s['key']], $s);
    echo "<li>Seeded: <code style='background:#f4f4f4; padding:2px 4px; border-radius:4px;'>{$s['key']}</code></li>";
}

echo "</ul><hr><h3 style='color:green; margin-top:20px;'>Seeding Completed Successfully!</h3>";
echo "<p style='color:#e06666;'><strong>⚠️ IMPORTANT:</strong> Please delete the <code style='background:#f4f4f4; padding:2px 4px;'>seed-mail.php</code> file from your server public folder immediately for security reasons.</p>";
echo "</div>";
