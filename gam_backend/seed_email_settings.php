<?php
// Seed email settings
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Setting;

$emailSettings = [
    ['key' => 'mail_mailer',       'label' => 'Mail Driver (smtp/log)',  'value' => 'log',                    'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_host',         'label' => 'SMTP Host',               'value' => 'smtp.mailtrap.io',       'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_port',         'label' => 'SMTP Port',               'value' => '587',                    'type' => 'integer', 'group' => 'email'],
    ['key' => 'mail_username',     'label' => 'SMTP Username',           'value' => '',                       'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_password',     'label' => 'SMTP Password',           'value' => '',                       'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_encryption',   'label' => 'Encryption (tls/ssl/none)','value' => 'tls',                  'type' => 'string',  'group' => 'email'],
    ['key' => 'mail_from_address', 'label' => 'Sender Email',            'value' => 'noreply@mindorax.com','type' => 'string',  'group' => 'email'],
    ['key' => 'mail_from_name',    'label' => 'Sender Name',             'value' => config('app.name'),       'type' => 'string',  'group' => 'email'],
];

foreach ($emailSettings as $s) {
    Setting::firstOrCreate(['key' => $s['key']], $s);
    echo "Seeded: {$s['key']}\n";
}

echo "Done!\n";
