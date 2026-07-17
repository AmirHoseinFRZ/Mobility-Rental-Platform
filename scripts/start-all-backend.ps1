# Start all backend microservices (Windows / PowerShell)
# Equivalent of scripts/start-all-backend.sh
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\scripts\start-all-backend.ps1
# Run from the project root directory.

$ErrorActionPreference = "Continue"

Write-Host "Starting Mobility Platform Backend Services..." -ForegroundColor Green
Write-Host ""

# Check we are in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# Build safeguard
# ---------------------------------------------------------------------------
# The services below are started with `mvn spring-boot:run`, which resolves the
# shared `common-lib` module from the local Maven repository. On a clean
# checkout that artifact hasn't been installed yet, so the services fail to
# compile. Build the backend first if common-lib is not present in .m2.
$m2Repo = if ($env:M2_REPO) { $env:M2_REPO } else { Join-Path $env:USERPROFILE ".m2\repository" }
$commonLibJar = Join-Path $m2Repo "com\mobility\platform\common-lib\1.0.0-SNAPSHOT\common-lib-1.0.0-SNAPSHOT.jar"

if (-not (Test-Path $commonLibJar)) {
    Write-Host "common-lib not found in local Maven repository." -ForegroundColor Yellow
    Write-Host "Building backend (mvn clean install -DskipTests)..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor White
    Push-Location "backend"
    & cmd /c "mvn clean install -DskipTests"
    $buildExit = $LASTEXITCODE
    Pop-Location
    if ($buildExit -ne 0) {
        Write-Host "Error: Maven build failed. Cannot start services." -ForegroundColor Red
        exit 1
    }
    Write-Host "Backend build completed successfully." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "common-lib found in local Maven repository (skipping build)." -ForegroundColor Green
}

# Detect Docker Compose command (support both plugin and standalone versions)
$DockerComposeCmd = $null
try { docker compose version *> $null; if ($LASTEXITCODE -eq 0) { $DockerComposeCmd = "docker compose" } } catch {}
if (-not $DockerComposeCmd -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    $DockerComposeCmd = "docker-compose"
}

# Check if infrastructure is running
Write-Host "Checking infrastructure services..." -ForegroundColor Cyan
$running = docker ps 2>$null
if ($running -notmatch "mobility-postgres") {
    if (-not $DockerComposeCmd) {
        Write-Host "Error: Docker Compose is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
    Write-Host "PostgreSQL is not running. Starting infrastructure..." -ForegroundColor Yellow
    Invoke-Expression "$DockerComposeCmd up -d"
    Write-Host "Waiting for infrastructure to be ready (30 seconds)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
}

# Create logs directory
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Start a service in the background, capturing stdout+stderr and PID
function Start-Service-Bg {
    param([string]$Service, [string]$Port)
    Write-Host "Starting $Service on port $Port..." -ForegroundColor Cyan
    $log = Join-Path (Join-Path $PWD "logs") "$Service.log"
    $proc = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "mvn spring-boot:run > `"$log`" 2>&1" `
        -WorkingDirectory (Join-Path $PWD "backend\$Service") -WindowStyle Hidden -PassThru
    $proc.Id | Out-File -Encoding ascii (Join-Path (Join-Path $PWD "logs") "$Service.pid")
}

Write-Host ""
Write-Host "Starting microservices..." -ForegroundColor Cyan
Write-Host ""

# Start Eureka Server first (service discovery)
Start-Service-Bg -Service "eureka-server" -Port "8761"
Start-Sleep -Seconds 20

# Start API Gateway (critical)
Start-Service-Bg -Service "api-gateway" -Port "8080"
Start-Sleep -Seconds 10

# Start core services
Start-Service-Bg -Service "user-service"    -Port "8081"
Start-Service-Bg -Service "vehicle-service" -Port "8082"
Start-Service-Bg -Service "booking-service" -Port "8083"
Start-Service-Bg -Service "pricing-service" -Port "8084"

# Start additional services
Start-Service-Bg -Service "driver-service"      -Port "8085"
Start-Service-Bg -Service "review-service"      -Port "8086"
Start-Service-Bg -Service "location-service"    -Port "8087"
Start-Service-Bg -Service "maintenance-service" -Port "8088"

Write-Host ""
Write-Host "Waiting for services to start (60 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
Write-Host "  Eureka Server:   http://localhost:8761"
Write-Host "  API Gateway:     http://localhost:8080"
Write-Host "  User Service:    http://localhost:8081/api/users/swagger-ui.html"
Write-Host "  Vehicle Service: http://localhost:8082/api/vehicles/swagger-ui.html"
Write-Host "  Booking Service: http://localhost:8083/api/bookings/swagger-ui.html"
Write-Host "  Pricing Service: http://localhost:8084/api/pricing/swagger-ui.html"
Write-Host "  Driver Service:  http://localhost:8085/api/drivers/swagger-ui.html"
Write-Host "  Review Service:  http://localhost:8086/api/reviews/swagger-ui.html"
Write-Host ""
Write-Host "Logs are available in: .\logs\" -ForegroundColor White
Write-Host "To stop all services, run: .\scripts\stop-all-backend.ps1" -ForegroundColor White
Write-Host ""