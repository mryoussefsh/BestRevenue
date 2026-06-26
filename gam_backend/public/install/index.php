<?php
/**
 * BestRevenue - Premium Installation Wizard
 * Built for seamless deployment on Hostinger and cPanel shared hosting.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Prevent caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

function fixPathPermissions($dir) {
    if (!is_dir($dir)) {
        return;
    }
    try {
        @chmod($dir, 0755);
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($iterator as $item) {
            $pathname = $item->getPathname();
            if ($item->isDir()) {
                @chmod($pathname, 0755);
            } else {
                @chmod($pathname, 0644);
            }
        }
    } catch (\Throwable $e) {
        // Suppress errors
    }
}

$lockFile = __DIR__ . '/installed.lock';
$envFile = __DIR__ . '/../../.env';
$envExampleFile = __DIR__ . '/../../.env.example';

// If already installed, redirect to main application
if (file_exists($lockFile)) {
    header("Location: /");
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// AJAX Endpoints
// ─────────────────────────────────────────────────────────────────────────────
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    $action = $_GET['action'];

    if ($action === 'test_db') {
        $connection = $_POST['db_connection'] ?? 'mysql';
        $host = $_POST['db_host'] ?? '127.0.0.1';
        $port = $_POST['db_port'] ?? '3306';
        $database = $_POST['db_database'] ?? '';
        $username = $_POST['db_username'] ?? '';
        $password = $_POST['db_password'] ?? '';

        if ($connection === 'sqlite') {
            // SQLite connection test
            try {
                $dbDir = __DIR__ . '/../../database';
                if (!is_dir($dbDir)) {
                    mkdir($dbDir, 0755, true);
                }
                $dbPath = $dbDir . '/database.sqlite';
                $pdo = new PDO("sqlite:" . $dbPath);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                echo json_encode(['success' => true, 'message' => 'SQLite Database connection successful! (File will be created/used at database/database.sqlite)']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'message' => 'SQLite Connection Error: ' . $e->getMessage()]);
            }
            exit;
        }

        // MySQL connection test
        try {
            $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
            if (!empty($database)) {
                // First try to connect without database to see if server is alive
                $pdo = new PDO($dsn, $username, $password, [
                    PDO::ATTR_TIMEOUT => 5,
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                
                // Then check/try to use the database
                try {
                    $pdo->query("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo->query("USE `$database`");
                } catch (Exception $dbErr) {
                    // Database might exist but user has no permissions to create
                    $dsnWithDb = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
                    $pdo = new PDO($dsnWithDb, $username, $password, [
                        PDO::ATTR_TIMEOUT => 5,
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                    ]);
                }
            } else {
                throw new Exception("Database name is required.");
            }
            echo json_encode(['success' => true, 'message' => 'Database connection successful! Host is reachable and database is ready.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'install') {
        // Increase execution time to 5 minutes to prevent timeouts during migration/seeding
        @set_time_limit(300);

        // Collect DB credentials
        $dbConnection = $_POST['db_connection'] ?? 'mysql';
        $dbHost = $_POST['db_host'] ?? '127.0.0.1';
        $dbPort = $_POST['db_port'] ?? '3306';
        $dbDatabase = $_POST['db_database'] ?? 'bestrevenue';
        $dbUsername = $_POST['db_username'] ?? 'root';
        $dbPassword = $_POST['db_password'] ?? '';

        // Collect App settings
        $appName = $_POST['app_name'] ?? 'BestRevenue';
        $appUrl = $_POST['app_url'] ?? 'http://localhost';

        // Collect Admin settings
        $adminName = $_POST['admin_name'] ?? 'Platform Admin';
        $adminEmail = $_POST['admin_email'] ?? 'admin@bestrevenue.com';
        $adminPassword = $_POST['admin_password'] ?? '';

        // 1. Generate secure App Key (32 bytes base64 encoded)
        $appKey = 'base64:' . base64_encode(random_bytes(32));

        // 2. Prepare .env content
        if (!file_exists($envExampleFile)) {
            echo json_encode(['success' => false, 'message' => '.env.example file not found. Make sure the app folder is fully uploaded.']);
            exit;
        }

        $envContent = file_get_contents($envExampleFile);

        // Core replacements
        $replacements = [
            'APP_NAME=Laravel' => 'APP_NAME="' . addslashes($appName) . '"',
            'APP_ENV=local' => 'APP_ENV=production',
            'APP_KEY=' => 'APP_KEY=' . $appKey,
            'APP_DEBUG=true' => 'APP_DEBUG=false',
            'APP_URL=http://localhost' => 'APP_URL=' . rtrim($appUrl, '/'),
            'DB_CONNECTION=sqlite' => 'DB_CONNECTION=' . $dbConnection,
            'MAIL_MAILER=log' => 'MAIL_MAILER=smtp', // default to SMTP in production
            'SESSION_DRIVER=database' => 'SESSION_DRIVER=file', // Fallback to file session driver to avoid database sessions table crashes
        ];

        if ($dbConnection === 'mysql') {
            $envContent = str_replace('# DB_HOST=127.0.0.1', 'DB_HOST=' . $dbHost, $envContent);
            $envContent = str_replace('# DB_PORT=3306', 'DB_PORT=' . $dbPort, $envContent);
            $envContent = str_replace('# DB_DATABASE=laravel', 'DB_DATABASE=' . $dbDatabase, $envContent);
            $envContent = str_replace('# DB_USERNAME=root', 'DB_USERNAME=' . $dbUsername, $envContent);
            $envContent = str_replace('# DB_PASSWORD=', 'DB_PASSWORD="' . addslashes($dbPassword) . '"', $envContent);
        } else {
            // SQLite Setup
            $dbDir = __DIR__ . '/../../database';
            if (!is_dir($dbDir)) {
                mkdir($dbDir, 0755, true);
            }
            $sqlitePath = $dbDir . '/database.sqlite';
            if (!file_exists($sqlitePath)) {
                touch($sqlitePath);
            }
            $envContent = str_replace('DB_DATABASE=laravel', 'DB_DATABASE=database/database.sqlite', $envContent);
        }

        foreach ($replacements as $search => $replace) {
            $envContent = str_replace($search, $replace, $envContent);
        }

        // Save .env file
        if (file_put_contents($envFile, $envContent) === false) {
            echo json_encode(['success' => false, 'message' => 'Failed to write .env file. Please check folder permissions.']);
            exit;
        }

        // Clear OPcache if active
        if (function_exists('opcache_reset')) {
            opcache_reset();
        }

        // 3. Boot Laravel programmatically in-process to run migrations & seeds
        try {
            $laravelRoot = dirname(__DIR__, 2);
            
            // Fix permissions recursively on the entire application root before require/boot
            fixPathPermissions($laravelRoot);
            
            require $laravelRoot . '/vendor/autoload.php';
            
            // Re-bind environment variables from newly written .env
            if (file_exists($envFile)) {
                $dotenv = Dotenv\Dotenv::createImmutable($laravelRoot);
                $dotenv->load();
            }

            $app = require $laravelRoot . '/bootstrap/app.php';
            $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
            $kernel->bootstrap();

            // Run Migrations (Fresh + Seed)
            \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true, '--seed' => true]);

            // Set Admin Account details matching the inputs
            $adminUser = \App\Models\User::where('role', 'admin')->first();
            if ($adminUser) {
                $adminUser->update([
                    'name' => $adminName,
                    'email' => $adminEmail,
                    'password' => \Illuminate\Support\Facades\Hash::make($adminPassword),
                    'is_active' => true,
                ]);
            } else {
                \App\Models\User::create([
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'name' => $adminName,
                    'email' => $adminEmail,
                    'password' => \Illuminate\Support\Facades\Hash::make($adminPassword),
                    'role' => 'admin',
                    'is_active' => true,
                ]);
            }

            // Write installed lock file
            file_put_contents($lockFile, date('Y-m-d H:i:s') . ' - Installed successfully.');

            echo json_encode(['success' => true, 'message' => 'Installation completed successfully! Redirecting you to login...']);
        } catch (\Throwable $e) {
            // Clean up .env on failure so they can retry
            if (file_exists($envFile)) {
                unlink($envFile);
            }
            echo json_encode([
                'success' => false,
                'message' => 'Artisan Migration Failure: ' . $e->getMessage() . "\n" . $e->getTraceAsString()
            ]);
        }
        exit;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check requirements
// ─────────────────────────────────────────────────────────────────────────────
$phpVersion = phpversion();
$phpOk = version_compare($phpVersion, '8.2.0', '>=');

$extensions = [
    'openssl'  => extension_loaded('openssl'),
    'pdo'      => extension_loaded('pdo'),
    'mbstring' => extension_loaded('mbstring'),
    'tokenizer'=> extension_loaded('tokenizer'),
    'xml'      => extension_loaded('xml'),
    'ctype'    => extension_loaded('ctype'),
    'json'     => extension_loaded('json'),
    'curl'     => extension_loaded('curl'),
    'zip'      => extension_loaded('zip'),
    'pdo_mysql'=> extension_loaded('pdo_mysql'),
];

$requirementsMet = $phpOk;
foreach ($extensions as $ext => $loaded) {
    if (!$loaded && $ext !== 'pdo_mysql') { // pdo_mysql is soft-optional if sqlite is used
        $requirementsMet = false;
    }
}

// Check directory writes
$writablePaths = [
    'Root (../../)' => is_writable(__DIR__ . '/../../'),
    'Storage (../../storage)' => is_writable(__DIR__ . '/../../storage'),
    'Bootstrap Cache (../../bootstrap/cache)' => is_writable(__DIR__ . '/../../bootstrap/cache'),
];

$writesMet = true;
foreach ($writablePaths as $path => $writable) {
    if (!$writable) {
        $writesMet = false;
    }
}

$allChecksPassed = $requirementsMet && $writesMet;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BestRevenue Installation Wizard</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --primary-glow: rgba(99, 102, 241, 0.15);
            --card-bg: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --success: #10b981;
            --error: #ef4444;
            --warning: #f59e0b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: var(--bg-gradient);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 680px;
            position: relative;
        }

        /* Glowing background decorations */
        .glow-sphere-1 {
            position: absolute;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
            top: -100px;
            left: -150px;
            z-index: -1;
            pointer-events: none;
        }
        .glow-sphere-2 {
            position: absolute;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
            bottom: -100px;
            right: -150px;
            z-index: -1;
            pointer-events: none;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(16px);
            border-radius: 24px;
            padding: 3rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .logo {
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 2.2rem;
            background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            text-align: center;
            color: var(--text-muted);
            font-size: 0.95rem;
            margin-bottom: 2.5rem;
            font-weight: 300;
        }

        /* Progress Steps */
        .steps {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3rem;
            position: relative;
        }
        .steps::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 2px;
            background: rgba(255, 255, 255, 0.05);
            z-index: 1;
            transform: translateY(-50%);
        }
        .step {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #1e293b;
            border: 2px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--text-muted);
            position: relative;
            z-index: 2;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .step.active {
            border-color: var(--primary);
            background: var(--primary);
            color: #fff;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }
        .step.completed {
            border-color: var(--success);
            background: var(--success);
            color: #fff;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
        }

        /* Wizard Tabs */
        .tab-content {
            display: none;
            animation: fadeIn 0.4s ease-in-out;
        }
        .tab-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            font-weight: 600;
        }

        /* Requirement Check List */
        .check-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            margin-bottom: 0.75rem;
        }
        .check-name {
            display: flex;
            flex-direction: column;
        }
        .check-detail {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 0.2rem;
        }
        .check-badge {
            font-size: 0.8rem;
            font-weight: 600;
            padding: 0.35rem 0.8rem;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        .badge-success {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
        }
        .badge-danger {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
        }

        /* Forms */
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.88rem;
            font-weight: 500;
            color: #cbd5e1;
        }
        input, select {
            width: 100%;
            padding: 0.85rem 1.2rem;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            color: #fff;
            font-family: inherit;
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }
        input:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-glow);
        }

        /* Buttons */
        .btn-container {
            display: flex;
            justify-content: space-between;
            margin-top: 2.5rem;
            gap: 1rem;
        }
        .btn {
            padding: 0.9rem 1.8rem;
            border-radius: 12px;
            font-weight: 600;
            font-family: inherit;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        .btn-primary {
            background: var(--primary);
            color: #fff;
            flex-grow: 1;
        }
        .btn-primary:hover:not(:disabled) {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.06);
            color: var(--text-main);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Status Notifications */
        .alert {
            padding: 1rem 1.25rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            line-height: 1.5;
            display: none;
            animation: fadeIn 0.3s ease;
        }
        .alert-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #f87171;
            display: block;
        }
        .alert-success {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #34d399;
            display: block;
        }

        /* Installer Logs Console */
        .console {
            background: #090d16;
            border: 1px solid rgba(255, 255, 255, 0.05);
            font-family: 'Courier New', Courier, monospace;
            padding: 1.25rem;
            border-radius: 12px;
            font-size: 0.82rem;
            height: 180px;
            overflow-y: auto;
            color: #a7f3d0;
            margin-top: 1rem;
            box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);
        }
        .console-line {
            margin-bottom: 0.35rem;
            line-height: 1.4;
        }
        .console-line.error {
            color: #f87171;
        }
        .console-line.info {
            color: #60a5fa;
        }

        /* Custom Spinner */
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
            display: inline-block;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .success-checkmark {
            text-align: center;
            margin: 1.5rem 0;
        }
        .success-checkmark svg {
            width: 80px;
            height: 80px;
            fill: none;
            stroke: var(--success);
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: dash 1s ease-in-out forwards;
        }
        @keyframes dash {
            to { stroke-dashoffset: 0; }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="glow-sphere-1"></div>
    <div class="glow-sphere-2"></div>

    <div class="card">
        <div class="logo">BestRevenue</div>
        <div class="subtitle">Platform Installation Wizard</div>

        <!-- Progress Steps -->
        <div class="steps">
            <div class="step active" id="step-dot-1">1</div>
            <div class="step" id="step-dot-2">2</div>
            <div class="step" id="step-dot-3">3</div>
            <div class="step" id="step-dot-4">4</div>
            <div class="step" id="step-dot-5">5</div>
        </div>

        <form id="install-form" method="POST" onsubmit="return false;">
            
            <!-- STEP 1: System Check -->
            <div class="tab-content active" id="step-1">
                <h2>System Prerequisites</h2>
                
                <div class="check-item">
                    <div class="check-name">
                        <span>PHP Version</span>
                        <span class="check-detail">Required: >= 8.2.0 (Detected: <?php echo $phpVersion; ?>)</span>
                    </div>
                    <span class="check-badge <?php echo $phpOk ? 'badge-success' : 'badge-danger'; ?>">
                        <?php echo $phpOk ? '✓ Active' : '✗ Outdated'; ?>
                    </span>
                </div>

                <?php foreach ($extensions as $ext => $loaded): ?>
                    <div class="check-item">
                        <div class="check-name">
                            <span>Extension: <?php echo $ext; ?></span>
                            <span class="check-detail"><?php
                                if ($ext === 'pdo_mysql') echo 'Needed for MySQL connections';
                                else echo 'Core dependency';
                            ?></span>
                        </div>
                        <span class="check-badge <?php echo $loaded ? 'badge-success' : ($ext === 'pdo_mysql' ? 'badge-danger' : 'badge-danger'); ?>">
                            <?php echo $loaded ? '✓ Loaded' : '✗ Missing'; ?>
                        </span>
                    </div>
                <?php endforeach; ?>

                <h2 style="margin-top: 2rem;">Directory Write Permissions</h2>
                <?php foreach ($writablePaths as $path => $writable): ?>
                    <div class="check-item">
                        <div class="check-name">
                            <span><?php echo $path; ?></span>
                            <span class="check-detail">Must be writable to write settings and sessions</span>
                        </div>
                        <span class="check-badge <?php echo $writable ? 'badge-success' : 'badge-danger'; ?>">
                            <?php echo $writable ? '✓ Writable' : '✗ Protected'; ?>
                        </span>
                    </div>
                <?php endforeach; ?>

                <?php if (!$allChecksPassed): ?>
                    <div class="alert alert-error" style="margin-top: 1.5rem;">
                        <strong>Prerequisites not met.</strong> Please enable the missing PHP extensions or set the directory permissions to writable (typically CHMOD 755 or 777) before continuing.
                    </div>
                <?php endif; ?>

                <div class="btn-container">
                    <div></div>
                    <button class="btn btn-primary" onclick="goToStep(2)" <?php echo !$allChecksPassed ? 'disabled' : ''; ?>>
                        Accept & Continue
                    </button>
                </div>
            </div>

            <!-- STEP 2: Database Configuration -->
            <div class="tab-content" id="step-2">
                <h2>Database Configuration</h2>
                <div class="alert alert-error" id="db-alert"></div>

                <div class="form-group">
                    <label for="db_connection">Database Driver</label>
                    <select id="db_connection" name="db_connection" onchange="toggleDbFields()">
                        <option value="mysql" selected>MySQL / MariaDB</option>
                        <option value="sqlite">SQLite (File-based)</option>
                    </select>
                </div>

                <div id="mysql-fields">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="db_host">Host IP / Domain</label>
                            <input type="text" id="db_host" name="db_host" value="127.0.0.1">
                        </div>
                        <div class="form-group">
                            <label for="db_port">Port</label>
                            <input type="text" id="db_port" name="db_port" value="3306">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="db_database">Database Name</label>
                        <input type="text" id="db_database" name="db_database" value="bestrevenue">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="db_username">Database Username</label>
                            <input type="text" id="db_username" name="db_username" value="root">
                        </div>
                        <div class="form-group">
                            <label for="db_password">Database Password</label>
                            <input type="password" id="db_password" name="db_password" placeholder="••••••••">
                        </div>
                    </div>
                </div>

                <div id="sqlite-fields" style="display: none;">
                    <div class="check-item" style="background: rgba(99, 102, 241, 0.05); border-color: rgba(99, 102, 241, 0.2);">
                        <div class="check-name">
                            <span style="color: #a5b4fc;">SQLite Database File</span>
                            <span class="check-detail" style="color: #94a3b8;">Will be created automatically in <code>database/database.sqlite</code></span>
                        </div>
                    </div>
                </div>

                <div class="btn-container">
                    <button class="btn btn-secondary" onclick="goToStep(1)">Back</button>
                    <button class="btn btn-secondary" id="btn-test-db" onclick="testDbConnection()">
                        Test Connection
                    </button>
                    <button class="btn btn-primary" id="btn-db-next" onclick="goToStep(3)" disabled>
                        Next Step
                    </button>
                </div>
            </div>

            <!-- STEP 3: Admin & App Setup -->
            <div class="tab-content" id="step-3">
                <h2>Application & Admin Setup</h2>
                <div class="alert alert-error" id="settings-alert"></div>

                <div class="form-group">
                    <label for="app_name">Application Name</label>
                    <input type="text" id="app_name" name="app_name" value="BestRevenue">
                </div>

                <div class="form-group">
                    <label for="app_url">Application URL</label>
                    <input type="text" id="app_url" name="app_url" placeholder="http://domain.com">
                </div>

                <h2 style="margin-top: 2rem;">Administrator Credentials</h2>

                <div class="form-group">
                    <label for="admin_name">Admin Display Name</label>
                    <input type="text" id="admin_name" name="admin_name" value="Platform Admin">
                </div>

                <div class="form-group">
                    <label for="admin_email">Admin Email Address</label>
                    <input type="email" id="admin_email" name="admin_email" value="admin@bestrevenue.com">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="admin_password">Password</label>
                        <input type="password" id="admin_password" name="admin_password" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label for="admin_password_confirm">Confirm Password</label>
                        <input type="password" id="admin_password_confirm" name="admin_password_confirm" placeholder="••••••••">
                    </div>
                </div>

                <div class="btn-container">
                    <button class="btn btn-secondary" onclick="goToStep(2)">Back</button>
                    <button class="btn btn-primary" onclick="validateSettingsAndNext()">
                        Configure App
                    </button>
                </div>
            </div>

            <!-- STEP 4: Execution -->
            <div class="tab-content" id="step-4">
                <h2>Installing BestRevenue...</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                    Writing configuration files, running migrations, and setting up initial platform templates.
                </p>

                <div class="console" id="install-console">
                    <div class="console-line info">[System] Installer ready. Starting operations...</div>
                </div>

                <div class="btn-container">
                    <button class="btn btn-primary" id="btn-run-install" onclick="executeInstallation()">
                        Run Installation Now
                    </button>
                </div>
            </div>

            <!-- STEP 5: Completion -->
            <div class="tab-content" id="step-5">
                <div class="success-checkmark">
                    <svg viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r="25" fill="none"/>
                        <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
                
                <h2 style="text-align: center; color: var(--success);">Setup Completed!</h2>
                <p style="text-align: center; color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem;">
                    BestRevenue is successfully installed and configured on Hostinger.<br>
                    For safety, the installer files have been locked.
                </p>

                <div class="check-item" style="background: rgba(255,255,255,0.02); margin-bottom: 2rem;">
                    <div style="width: 100%;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-muted);">Admin Panel Login:</span>
                            <span id="display-admin-email" style="font-weight: 600;">admin@bestrevenue.com</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Application URL:</span>
                            <span id="display-app-url" style="color: var(--primary);">http://domain.com</span>
                        </div>
                    </div>
                </div>

                <div class="btn-container">
                    <a id="btn-login-redirect" href="/" class="btn btn-primary" style="text-decoration: none;">
                        Launch BestRevenue Panel
                    </a>
                </div>
            </div>

        </form>
    </div>
</div>

<script>
    // Autofill current URL to assist the user
    document.getElementById('app_url').value = window.location.origin;

    let currentStep = 1;

    function goToStep(stepNum) {
        // Toggle tab active classes
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById('step-' + stepNum).classList.add('active');

        // Toggle dot classes
        for (let i = 1; i <= 5; i++) {
            const dot = document.getElementById('step-dot-' + i);
            if (i < stepNum) {
                dot.className = 'step completed';
                dot.innerHTML = '✓';
            } else if (i === stepNum) {
                dot.className = 'step active';
                dot.innerHTML = i;
            } else {
                dot.className = 'step';
                dot.innerHTML = i;
            }
        }
        currentStep = stepNum;
    }

    function toggleDbFields() {
        const conn = document.getElementById('db_connection').value;
        const mysqlFields = document.getElementById('mysql-fields');
        const sqliteFields = document.getElementById('sqlite-fields');
        const btnDbNext = document.getElementById('btn-db-next');
        const btnTestDb = document.getElementById('btn-test-db');

        if (conn === 'sqlite') {
            mysqlFields.style.display = 'none';
            sqliteFields.style.display = 'block';
            btnDbNext.disabled = false; // SQLite doesn't strictly need a host test
        } else {
            mysqlFields.style.display = 'block';
            sqliteFields.style.display = 'none';
            btnDbNext.disabled = true; // Must test MySQL first
        }
        document.getElementById('db-alert').style.display = 'none';
    }

    function testDbConnection() {
        const btnTest = document.getElementById('btn-test-db');
        const btnNext = document.getElementById('btn-db-next');
        const alertBox = document.getElementById('db-alert');

        btnTest.disabled = true;
        btnTest.innerHTML = '<span class="spinner"></span> Testing...';
        alertBox.style.display = 'none';

        const formData = new FormData(document.getElementById('install-form'));

        fetch('?action=test_db', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            btnTest.disabled = false;
            btnTest.innerHTML = 'Test Connection';

            if (data.success) {
                alertBox.className = 'alert alert-success';
                alertBox.innerHTML = data.message;
                alertBox.style.display = 'block';
                btnNext.disabled = false;
            } else {
                alertBox.className = 'alert alert-error';
                alertBox.innerHTML = data.message;
                alertBox.style.display = 'block';
                btnNext.disabled = true;
            }
        })
        .catch(err => {
            btnTest.disabled = false;
            btnTest.innerHTML = 'Test Connection';
            alertBox.className = 'alert alert-error';
            alertBox.innerHTML = 'An AJAX error occurred. Please check server logs.';
            alertBox.style.display = 'block';
        });
    }

    function validateSettingsAndNext() {
        const appName = document.getElementById('app_name').value.trim();
        const appUrl = document.getElementById('app_url').value.trim();
        const adminName = document.getElementById('admin_name').value.trim();
        const adminEmail = document.getElementById('admin_email').value.trim();
        const pass = document.getElementById('admin_password').value;
        const confirm = document.getElementById('admin_password_confirm').value;
        const alertBox = document.getElementById('settings-alert');

        alertBox.style.display = 'none';

        if (!appName || !appUrl || !adminName || !adminEmail || !pass || !confirm) {
            alertBox.innerHTML = 'All fields are required to setup the application.';
            alertBox.style.display = 'block';
            return;
        }

        if (pass !== confirm) {
            alertBox.innerHTML = 'Passwords do not match.';
            alertBox.style.display = 'block';
            return;
        }

        if (pass.length < 8) {
            alertBox.innerHTML = 'Admin password must be at least 8 characters long.';
            alertBox.style.display = 'block';
            return;
        }

        goToStep(4);
    }

    function logToConsole(text, type = 'info') {
        const consoleEl = document.getElementById('install-console');
        const line = document.createElement('div');
        line.className = 'console-line ' + type;
        line.innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    function executeInstallation() {
        const btnRun = document.getElementById('btn-run-install');
        btnRun.disabled = true;
        btnRun.innerHTML = '<span class="spinner"></span> Running Migration Processes...';

        logToConsole('Initiating setup parameters...', 'info');
        logToConsole('Generating secure cryptographic App Key...', 'info');
        logToConsole('Writing config directives to .env file...', 'info');

        const formData = new FormData(document.getElementById('install-form'));

        fetch('?action=install', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            return res.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error("Server returned invalid response. Content: " + (text.length > 300 ? text.substring(0, 300) + '...' : text));
                }
            });
        })
        .then(data => {
            if (data.success) {
                logToConsole('Written configuration variables successfully.', 'info');
                logToConsole('Booting Laravel application core container...', 'info');
                logToConsole('Executing database schema builder (migrate:fresh)...', 'info');
                logToConsole('Running Database seed factories and settings builders...', 'info');
                logToConsole('Setting custom platform administrator account settings...', 'info');
                logToConsole('Creating installed lock reference token in directory...', 'info');
                logToConsole('Setup process completed fully!', 'info');

                setTimeout(() => {
                    document.getElementById('display-admin-email').innerText = document.getElementById('admin_email').value;
                    document.getElementById('display-app-url').innerText = document.getElementById('app_url').value;
                    document.getElementById('btn-login-redirect').href = document.getElementById('app_url').value + '/login';
                    goToStep(5);
                }, 1500);
            } else {
                logToConsole('CRITICAL SYSTEM FAILURE OCCURRED:', 'error');
                logToConsole(data.message, 'error');
                btnRun.disabled = false;
                btnRun.innerHTML = 'Retry Installation';
            }
        })
        .catch(err => {
            logToConsole('Unexpected connection error during execution request.', 'error');
            logToConsole(err.message, 'error');
            btnRun.disabled = false;
            btnRun.innerHTML = 'Retry Installation';
        });
    }
</script>

</body>
</html>
