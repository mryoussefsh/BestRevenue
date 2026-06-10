<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Publisher;
use App\Models\RevenueRecord;

$pub = Publisher::where('email', 'yousifshaban512@gmail.com')->first();
if (!$pub) {
    echo "Publisher not found\n";
    exit;
}
echo "Publisher ID: {$pub->id}\n";
$records = RevenueRecord::whereHas('adUnit.website', function($q) use ($pub) {
    $q->where('publisher_id', $pub->id);
})->orderBy('date', 'desc')->limit(10)->get();

foreach ($records as $r) {
    echo "Date: {$r->date}, Sync: {$r->synced_at}, Impressions: {$r->impressions}, Earnings: {$r->publisher_earnings}, Approved: " . ($r->is_approved ? 'YES' : 'NO') . "\n";
}
