# BestRevenue Production Build and Packaging Script
# This script compiles the frontend, merges it with the backend, and creates a clean zip file for Hostinger deployment.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  BestRevenue Package Builder for Hostinger" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$WorkspaceRoot = Get-Item .
$FrontendDir = Join-Path $WorkspaceRoot "gam_frontend"
$BackendDir = Join-Path $WorkspaceRoot "gam_backend"
$TempDir = Join-Path $WorkspaceRoot "dist_package"
$ZipPath = Join-Path $WorkspaceRoot "bestrevenue-install.zip"

# Step 1: Build the React Frontend
Write-Host "`n[Step 1] Building React frontend via Vite..." -ForegroundColor Yellow
if (-not (Test-Path $FrontendDir)) {
    Write-Error "Frontend directory not found at $FrontendDir"
}

Push-Location $FrontendDir
try {
    # Install node modules if missing
    if (-not (Test-Path "node_modules")) {
        Write-Host "node_modules missing in frontend. Running npm install..." -ForegroundColor Gray
        npm install
    }
    npm run build
} finally {
    Pop-Location
}

# Step 2: Clean up old packaging temp directory and zip file
Write-Host "`n[Step 2] Cleaning up old temporary files..." -ForegroundColor Yellow
if (Test-Path $TempDir) {
    Remove-Item $TempDir -Recurse -Force
}
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# Step 3: Copy backend structure to temp package directory
Write-Host "`n[Step 3] Staging backend files into package structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy everything from backend to temp except files/folders we don't want in production zip
$ExcludeItems = @(
    ".env",
    "node_modules",
    "tests",
    ".phpunit.result.cache"
)

Get-ChildItem -Path $BackendDir -Force | Where-Object { $_.Name -notin $ExcludeItems } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $TempDir $_.Name) -Recurse -Force
}

# Ensure storage subdirectories are clean
$StorageFramework = Join-Path $TempDir "storage/framework"
$CleanFolders = @("cache/data", "sessions", "views")
foreach ($folder in $CleanFolders) {
    $fullPath = Join-Path $StorageFramework $folder
    if (Test-Path $fullPath) {
        Remove-Item (Join-Path $fullPath "*") -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    }
}
$LogsPath = Join-Path $TempDir "storage/logs"
if (Test-Path $LogsPath) {
    Remove-Item (Join-Path $LogsPath "*") -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $LogsPath -Force | Out-Null
}

# Step 4: Merge built React frontend files into backend public directory
Write-Host "`n[Step 4] Merging React build into Laravel public directory..." -ForegroundColor Yellow
$FrontendDist = Join-Path $FrontendDir "dist"
$BackendPublic = Join-Path $TempDir "public"

if (-not (Test-Path $FrontendDist)) {
    Write-Error "React build output not found at $FrontendDist"
}

# Copy assets and files
Copy-Item -Path (Join-Path $FrontendDist "*") -Destination $BackendPublic -Recurse -Force

# Step 5: Copy root-level .htaccess file for routing
Write-Host "`n[Step 5] Adding root .htaccess for automatic redirection..." -ForegroundColor Yellow
$RootHtaccess = Join-Path $WorkspaceRoot ".htaccess"
if (Test-Path $RootHtaccess) {
    Copy-Item -Path $RootHtaccess -Destination (Join-Path $TempDir ".htaccess") -Force
} else {
    Write-Warning "Root .htaccess not found. Redirection might not work out of the box."
}

# Step 6: Create the ZIP Archive using .NET to avoid MAX_PATH limits
Write-Host "`n[Step 6] Compressing files into $ZipPath..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}
[System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $ZipPath)

# Step 7: Clean up temp directory
Write-Host "`n[Step 7] Cleaning up temporary workspace..." -ForegroundColor Yellow
Remove-Item $TempDir -Recurse -Force

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " SUCCESS: bestrevenue-install.zip created successfully!" -ForegroundColor Green
Write-Host " ZIP Location: $ZipPath" -ForegroundColor Green
Write-Host " Size: $(((Get-Item $ZipPath).Length / 1MB).ToString('F2')) MB" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
