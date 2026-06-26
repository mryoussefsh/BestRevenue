<?php
// Place this inside your live server's gam_backend/public/ directory
// Visit: https://yourdomain.com/seed-translations.php
// Delete this file from the server immediately after execution!

ini_set('max_execution_time', 300);
ini_set('memory_limit', '512M');

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Database\Seeders\TranslationsSeeder;
use App\Models\Translation;

echo "<div style='font-family: sans-serif; padding: 20px; max-width: 600px; margin: 50px auto; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>";
echo "<h2 style='color:#333;'>Running Translations Seeder...</h2><p style='color:#666;'>This will update all English and Arabic translation keys in the database to align with the latest seeder schema.</p><hr>";

try {
    $beforeCount = Translation::count();
    
    // Run the seeder directly
    $seeder = new TranslationsSeeder();
    $seeder->run();
    
    $afterCount = Translation::count();
    
    echo "<h3 style='color:green; margin-top:20px;'>Seeding Completed Successfully!</h3>";
    echo "<ul style='line-height: 1.6;'>";
    echo "<li><strong>Total translation strings:</strong> {$afterCount}</li>";
    echo "<li><strong>Database records initialized/updated:</strong> yes</li>";
    echo "</ul>";
    
} catch (\Throwable $e) {
    echo "<h3 style='color:red;'>Seeding Failed!</h3>";
    echo "<pre style='background:#fde8e8; padding:15px; border-radius:4px; border:1px solid #f8b4b4; overflow:auto; max-height:200px;'>Error: " . htmlspecialchars($e->getMessage()) . "\n\nStack Trace:\n" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "<hr><p style='color:#e06666;'><strong>⚠️ IMPORTANT:</strong> Please delete the <code style='background:#f4f4f4; padding:2px 4px;'>seed-translations.php</code> file from your server public folder immediately for security reasons.</p>";
echo "</div>";
