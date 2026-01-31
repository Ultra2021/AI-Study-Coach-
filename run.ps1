# AI Study Coach - Run Script
# This script helps you start both backend and frontend

Write-Host "🎓 AI Study Coach - Setup Helper" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Get IP Address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"} | Select-Object -First 1).IPAddress

Write-Host "📱 Your IP Address: $ipAddress" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Update config.js with this IP address:" -ForegroundColor Yellow
Write-Host "   BASE_URL: 'http://$ipAddress:5000'" -ForegroundColor Yellow
Write-Host ""

# Check if in correct directory
$currentPath = Get-Location
if ($currentPath.Path -notlike "*AI Study Coach*") {
    Write-Host "❌ Please run this script from the AI Study Coach directory" -ForegroundColor Red
    exit
}

Write-Host "Choose an option:" -ForegroundColor Cyan
Write-Host "1. Install mobile app dependencies"
Write-Host "2. Start backend server"
Write-Host "3. Start mobile app (Expo)"
Write-Host "4. Open config.js to update IP"
Write-Host "5. Exit"
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "Installing dependencies..." -ForegroundColor Green
        Set-Location "mobile-app"
        npm install
        Write-Host "✅ Dependencies installed!" -ForegroundColor Green
    }
    "2" {
        Write-Host "Starting backend server..." -ForegroundColor Green
        Set-Location "backend"
        Write-Host "Backend will run on: http://$ipAddress:5000" -ForegroundColor Yellow
        python app.py
    }
    "3" {
        Write-Host "Starting Expo..." -ForegroundColor Green
        Set-Location "mobile-app"
        Write-Host "Scan the QR code with Expo Go app!" -ForegroundColor Yellow
        npm start
    }
    "4" {
        Write-Host "Opening config.js..." -ForegroundColor Green
        code "mobile-app\config.js"
    }
    "5" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}
