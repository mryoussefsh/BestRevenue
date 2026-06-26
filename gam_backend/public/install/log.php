<?php
/**
 * BestRevenue - Laravel Log Viewer for Installer Troubleshooting
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$logFile = __DIR__ . '/../../storage/logs/laravel.log';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BestRevenue - Laravel Logs</title>
    <style>
        body {
            background-color: #0f172a;
            color: #f8fafc;
            font-family: monospace;
            padding: 2rem;
            line-height: 1.5;
        }
        h1 {
            color: #6366f1;
            font-family: sans-serif;
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        .console {
            background-color: #090d16;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 8px;
            overflow-x: auto;
            white-space: pre-wrap;
            max-height: 80vh;
            overflow-y: auto;
        }
        .no-logs {
            color: #94a3b8;
            font-style: italic;
        }
    </style>
</head>
<body>
    <h1>Laravel Stack Trace Log</h1>
    <div class="console">
<?php
if (!file_exists($logFile)) {
    echo '<span class="no-logs">No Laravel log file found at storage/logs/laravel.log</span>';
} else {
    $content = file_get_contents($logFile);
    if (empty($content)) {
        echo '<span class="no-logs">Log file is empty.</span>';
    } else {
        // Retrieve last 15000 characters to keep it responsive and show recent stack traces
        $maxLength = 15000;
        if (strlen($content) > $maxLength) {
            echo "[... truncated ...]\n\n";
            echo htmlspecialchars(substr($content, -$maxLength));
        } else {
            echo htmlspecialchars($content);
        }
    }
}
?>
    </div>
</body>
</html>
