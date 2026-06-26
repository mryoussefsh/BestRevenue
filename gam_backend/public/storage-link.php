<?php
// Place this inside your live server's gam_backend/public/ directory
// Visit: https://yourdomain.com/storage-link.php
// Delete this file from the server immediately after execution!

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Artisan;

echo "<div style='font-family: sans-serif; padding: 20px; max-width: 600px; margin: 50px auto; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>";
echo "<h2 style='color:#333;'>Fixing Storage Symlink...</h2><hr>";

$publicStoragePath = public_path('storage');

if (file_exists($publicStoragePath)) {
    if (is_link($publicStoragePath)) {
        echo "<p style='color:orange;'><strong>Note:</strong> Symlink already exists at <code>public/storage</code>. Re-creating it...</p>";
        unlink($publicStoragePath);
    } else if (is_dir($publicStoragePath)) {
        echo "<p style='color:red;'><strong>Warning:</strong> A physical directory exists at <code>public/storage</code>. Renaming it to <code>public/storage_backup</code> to prevent file loss...</p>";
        rename($publicStoragePath, public_path('storage_backup_' . time()));
    } else {
        unlink($publicStoragePath);
    }
}

try {
    $exitCode = Artisan::call('storage:link');
    $output = Artisan::output();
    echo "<p style='color:green;'><strong>Artisan storage:link output:</strong></p>";
    echo "<pre style='background:#f4f4f4; padding:10px; border-radius:4px; overflow-x:auto;'>" . htmlspecialchars($output) . "</pre>";
    
    // Test if the link actually works by checking if we can write a test file
    $targetFile = storage_path('app/public/test_symlink.txt');
    $linkFile = public_path('storage/test_symlink.txt');
    
    file_put_contents($targetFile, 'symlink_works');
    if (file_exists($linkFile) && file_get_contents($linkFile) === 'symlink_works') {
        echo "<h3 style='color:green;'>Success! The symlink is created and verified working!</h3>";
        @unlink($targetFile);
    } else {
        // Fallback: try to create symlink using native PHP symlink function
        $targetFolder = storage_path('app/public');
        if (@symlink($targetFolder, $publicStoragePath)) {
            echo "<h3 style='color:green;'>Success! Symlink created programmatically using PHP symlink().</h3>";
        } else {
            echo "<h3 style='color:red;'>Error! Symlink could not be verified. Your hosting environment might have restricted symlink creation.</h3>";
            echo "<p>Try creating a folder named <code>storage</code> inside your public folder manually or contact host support.</p>";
        }
    }
} catch (\Exception $e) {
    echo "<p style='color:red;'>Error running storage:link: " . $e->getMessage() . "</p>";
}

echo "<hr><p style='color:#e06666;'><strong>⚠️ IMPORTANT:</strong> Please delete the <code style='background:#f4f4f4; padding:2px 4px;'>storage-link.php</code> file from your server public folder immediately.</p>";
echo "</div>";
