<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Approved Limit Date: " . App\Models\RevenueRecord::getApprovedLimitDate()->toDateTimeString() . "\n";
$mayRecords = App\Models\RevenueRecord::whereBetween('date', ['2026-05-01', '2026-05-31'])->get();
echo "May Records Count: " . $mayRecords->count() . "\n";
$pendingCount = 0;
$approvedCount = 0;
foreach ($mayRecords as $r) {
    if ($r->is_approved) {
        $approvedCount++;
    } else {
        $pendingCount++;
    }
}
echo "May Records: Approved={$approvedCount}, Pending={$pendingCount}\n";
