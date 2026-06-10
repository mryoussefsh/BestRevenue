<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$query = App\Models\RevenueRecord::where('date', '>=', '2026-06-08')
    ->where('date', '<=', '2026-06-08');

echo "SQL: " . $query->toSql() . "\n";
echo "Bindings: " . json_encode($query->getBindings()) . "\n";

$records = $query->get();
echo "Records Count: " . $records->count() . "\n";
foreach ($records as $r) {
    echo "Date: " . $r->date->format('Y-m-d') . "\n";
}
