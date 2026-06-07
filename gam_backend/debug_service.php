<?php
// Quick debug script — run with: php artisan tinker < debug_service.php

$publisher = \App\Models\Publisher::create([
    'id'            => \Illuminate\Support\Str::uuid()->toString(),
    'name'          => 'Debug Publisher',
    'email'         => 'debug@test.com',
    'status'        => 'active',
    'default_ratio' => 0.8,
]);

$admin = \App\Models\User::create([
    'id'        => \Illuminate\Support\Str::uuid()->toString(),
    'name'      => 'Debug Admin',
    'email'     => 'debugadmin@test.com',
    'password'  => bcrypt('pass'),
    'role'      => 'admin',
    'is_active' => true,
]);

try {
    $service = new \App\Services\ManualPaymentService();
    $result  = $service->create($publisher, ['amount' => 50, 'method' => 'Wise'], $admin);
    echo "SUCCESS: " . $result->id . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
