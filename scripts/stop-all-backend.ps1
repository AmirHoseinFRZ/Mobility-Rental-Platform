# Stop all backend microservices (Windows / PowerShell)
# Equivalent of scripts/stop-all-backend.sh
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\scripts\stop-all-backend.ps1

$ErrorActionPreference = "Continue"

Write-Host "Stopping Mobility Platform Backend Services..." -ForegroundColor Yellow
Write-Host ""

# Check if logs directory exists
if (-not (Test-Path "logs")) {
    Write-Host "No logs directory found. Services may not be running." -ForegroundColor Yellow
    exit 0
}

# Stop a service by its PID file (kills the whole child tree: cmd -> mvn -> java)
function Stop-Service-Bg {
    param([string]$Service)
    $pidFile = "logs\$Service.pid"
    if (Test-Path $pidFile) {
        $servicePid = (Get-Content $pidFile | Select-Object -First 1).Trim()
        if ($servicePid -and (Get-Process -Id $servicePid -ErrorAction SilentlyContinue)) {
            Write-Host "Stopping $Service (PID: $servicePid)..." -ForegroundColor Cyan
            cmd /c "taskkill /PID $servicePid /T /F" *> $null
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "$Service is not running" -ForegroundColor Gray
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "$Service PID file not found" -ForegroundColor Gray
    }
}

# Stop all services
Stop-Service-Bg "api-gateway"
Stop-Service-Bg "user-service"
Stop-Service-Bg "vehicle-service"
Stop-Service-Bg "booking-service"
Stop-Service-Bg "pricing-service"
Stop-Service-Bg "driver-service"
Stop-Service-Bg "review-service"
Stop-Service-Bg "location-service"
Stop-Service-Bg "maintenance-service"
Stop-Service-Bg "eureka-server"

# Detect Docker Compose command (support both plugin and standalone versions)
$DockerComposeCmd = $null
try { docker compose version *> $null; if ($LASTEXITCODE -eq 0) { $DockerComposeCmd = "docker compose" } } catch {}
if (-not $DockerComposeCmd -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    $DockerComposeCmd = "docker-compose"
}

Write-Host ""
Write-Host "All backend services stopped!" -ForegroundColor Green
Write-Host ""
if ($DockerComposeCmd) {
    Write-Host "To stop infrastructure (PostgreSQL, RabbitMQ, Redis):" -ForegroundColor White
    Write-Host "   $DockerComposeCmd down" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To stop infrastructure and DELETE ALL DATA:" -ForegroundColor White
    Write-Host "   $DockerComposeCmd down -v" -ForegroundColor Gray
    Write-Host ""
}