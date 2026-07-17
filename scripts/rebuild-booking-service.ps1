# Rebuild Booking Service Script (Windows / PowerShell)
# Equivalent of scripts/rebuild-booking-service.sh
# Rebuilds the booking service with payment integration.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-booking-service.ps1

$ErrorActionPreference = "Stop"

$ScriptDir          = $PSScriptRoot
$ProjectRoot        = Split-Path $ScriptDir -Parent
$BookingServiceDir  = Join-Path $ProjectRoot "backend\booking-service"
$ComposeFile        = Join-Path $ProjectRoot "docker-compose.yml"

Write-Host "Rebuilding Booking Service with Payment Integration..." -ForegroundColor Green

Set-Location $BookingServiceDir

# Build the application
Write-Host "Building booking service..." -ForegroundColor Yellow
& cmd /c "mvn clean package -DskipTests"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build booking service" -ForegroundColor Red
    exit 1
}

Write-Host "Booking service built successfully!" -ForegroundColor Green
Write-Host "Restarting booking service..." -ForegroundColor Yellow

# Detect Docker Compose command
$DockerComposeCmd = "docker compose"
try { docker compose version *> $null; if ($LASTEXITCODE -ne 0) { $DockerComposeCmd = "docker-compose" } } catch { $DockerComposeCmd = "docker-compose" }

# Check if running with Docker
$running = docker ps 2>$null
if ($running -match "mobility-booking-service") {
    Write-Host "Stopping Docker container..." -ForegroundColor Yellow
    Invoke-Expression "$DockerComposeCmd -f `"$ComposeFile`" stop booking-service"

    Write-Host "Rebuilding Docker image..." -ForegroundColor Yellow
    Invoke-Expression "$DockerComposeCmd -f `"$ComposeFile`" build booking-service"

    Write-Host "Starting booking service..." -ForegroundColor Yellow
    Invoke-Expression "$DockerComposeCmd -f `"$ComposeFile`" up -d booking-service"

    Write-Host "Booking service restarted successfully!" -ForegroundColor Green
} else {
    Write-Host "Docker container not running. Please start manually or use Docker Compose." -ForegroundColor Yellow
}

Write-Host "Done! The booking service now includes payment integration." -ForegroundColor Green
Write-Host "New endpoints available at: http://localhost:8083/api/bookings/payments" -ForegroundColor Green