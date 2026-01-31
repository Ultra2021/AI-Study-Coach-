Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AI Study Coach - Quick Check" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking required files..." -ForegroundColor Yellow
Write-Host ""

$files = @{
    "mobile-app\app\index.js" = "Login Screen"
    "mobile-app\app\dashboard.js" = "Dashboard Screen"
    "mobile-app\app\groups.js" = "Groups Screen"
    "mobile-app\app\_layout.js" = "Navigation Layout"
    "mobile-app\config.js" = "API Config"
    "mobile-app\package.json" = "Package Config"
    "mobile-app\app.json" = "Expo Config"
    "backend\app.py" = "Backend Server"
}

$allGood = $true
foreach ($file in $files.Keys) {
    if (Test-Path $file) {
        Write-Host "✅ $($files[$file])" -ForegroundColor Green
    } else {
        Write-Host "❌ $($files[$file]) - Missing: $file" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
if (Test-Path "mobile-app\node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies not installed. Run: cd mobile-app; npm install" -ForegroundColor Yellow
    $allGood = $false
}

if (Test-Path "mobile-app\assets") {
    Write-Host "✅ Assets folder exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Assets folder missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ All required files present!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to run! Next steps:" -ForegroundColor Cyan
    Write-Host "1. Find your IP: ipconfig" -ForegroundColor White
    Write-Host "2. Update mobile-app\config.js with your IP" -ForegroundColor White
    Write-Host "3. Start backend: cd backend; python app.py" -ForegroundColor White
    Write-Host "4. Start app: cd mobile-app; npm start" -ForegroundColor White
} else {
    Write-Host "⚠️  Some files are missing!" -ForegroundColor Yellow
    Write-Host "Please check the errors above." -ForegroundColor Yellow
}

Write-Host ""
