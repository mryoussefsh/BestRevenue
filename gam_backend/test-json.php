<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$record = App\Models\RevenueRecord::first();
echo "Model JSON string:\n";
echo json_encode($record->toArray(), JSON_PRETTY_PRINT) . "\n";
