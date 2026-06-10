<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Platform Timezone: " . App\Models\Setting::get('platform_timezone') . "\n";
echo "App Timezone: " . config('app.timezone') . "\n";
echo "Current Time (App): " . now()->toDateTimeString() . "\n";
echo "Current Time (Cairo): " . now()->setTimezone('Africa/Cairo')->toDateTimeString() . "\n";
echo "Approve Earnings Day: " . App\Models\Setting::get('approve_earnings_day') . "\n";
echo "Approved Limit Date: " . App\Models\RevenueRecord::getApprovedLimitDate()->toDateTimeString() . "\n";
echo "Revenue records count around June 7-8:\n";
$records = App\Models\RevenueRecord::whereBetween('date', ['2026-06-05', '2026-06-09'])->get();
foreach ($records as $r) {
    echo "ID: {$r->id}, Date: {$r->date->format('Y-m-d')}, Hour: {$r->hour}, Approved: " . ($r->is_approved ? 'YES' : 'NO') . ", Status: {$r->approval_status}\n";
}
