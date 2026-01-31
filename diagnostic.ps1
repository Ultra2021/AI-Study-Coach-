# AI Study Coach - Diagnostic Check

Write-Host "🔍 Running diagnostic check..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$passed = 0

# Check 1: Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " ✅ Found: $nodeVersion" -ForegroundColor Green
    $passed++
} catch {
    Write-Host " ❌ Not found" -ForegroundColor Red
    $errors += "Node.js is not installed"
}

# Check 2: npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version
    Write-Host " ✅ Found: $npmVersion" -ForegroundColor Green
    $passed++
} catch {
    Write-Host " ❌ Not found" -ForegroundColor Red
    $errors += "npm is not installed"
}

# Check 3: Python
Write-Host "Checking Python..." -NoNewline
try {
    $pythonVersion = python --version
    Write-Host " ✅ Found: $pythonVersion" -ForegroundColor Green
    $passed++
} catch {
    Write-Host " ❌ Not found" -ForegroundColor Red
    $errors += "Python is not installed"
}

# Check 4: Mobile app files
Write-Host "Checking mobile app files..." -NoNewline
$mobileFiles = @(
    "mobile-app\app\index.js",
    "mobile-app\app\dashboard.js",
    "mobile-app\app\groups.js",
    "mobile-app\app\_layout.js",
    "mobile-app\config.js",
    "mobile-app\package.json",
    "mobile-app\app.json"
)

$allFilesExist = $true
foreach ($file in $mobileFiles) {
    if (-not (Test-Path $file)) {
        $allFilesExist = $false
        $errors += "Missing file: $file"
    }
}

if ($allFilesExist) {
    Write-Host " ✅ All files present" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ❌ Some files missing" -ForegroundColor Red
}

# Check 5: node_modules
Write-Host "Checking node_modules..." -NoNewline
if (Test-Path "mobile-app\node_modules") {
    Write-Host " ✅ Installed" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ⚠️  Not found - Run 'npm install'" -ForegroundColor Yellow
    $warnings += "Dependencies not installed. Run: cd mobile-app; npm install"
}

# Check 6: Backend files
Write-Host "Checking backend files..." -NoNewline
$backendFiles = @(
    "backend\app.py",
    "backend\requirements.txt"
)

$allBackendFilesExist = $true
foreach ($file in $backendFiles) {
    if (-not (Test-Path $file)) {
        $allBackendFilesExist = $false
        $errors += "Missing backend file: $file"
    }
}

if ($allBackendFilesExist) {
    Write-Host " ✅ All files present" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ❌ Some files missing" -ForegroundColor Red
}

# Check 7: Assets folder
Write-Host "Checking assets folder..." -NoNewline
if (Test-Path "mobile-app\assets") {
    Write-Host " ✅ Exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ⚠️  Not found" -ForegroundColor Yellow
    $warnings += "Assets folder missing (non-critical)"
}

# Check 8: Get IP address
Write-Host "Finding your IP address..." -NoNewline
try {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"} | Select-Object -First 1).IPAddress
    Write-Host " ✅ $ip" -ForegroundColor Green
    $passed++
} catch {
    Write-Host " ⚠️  Could not determine" -ForegroundColor Yellow
    $warnings += "Could not auto-detect IP address. Run 'ipconfig' manually"
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Passed: $passed checks" -ForegroundColor Green

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  Warnings: $($warnings.Count)" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   - $warning" -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host "❌ Errors: $($errors.Count)" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please fix the errors above before continuing." -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "🎉 All critical checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update mobile-app\config.js with your IP: $ip" -ForegroundColor White
    Write-Host "2. Start backend: cd backend; python app.py" -ForegroundColor White
    Write-Host "3. Start mobile app: cd mobile-app; npm start" -ForegroundColor White
    Write-Host "4. Scan QR code with Expo Go app" -ForegroundColor White
}

Write-Host ""
