# Mobility Rental Platform - Complete Startup Script
# Run this script to start everything: Infrastructure + Backend + Frontend

param()

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Mobility Rental Platform - Starting All Services" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Cyan
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    exit 1
}
Write-Host "✓ Docker found" -ForegroundColor Green

# Check Java
Write-Host "Checking Java..." -ForegroundColor Cyan
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Java is not installed" -ForegroundColor Red
    Write-Host "Please install Java JDK 17+ from: https://adoptium.net/" -ForegroundColor White
    exit 1
}
Write-Host "✓ Java found" -ForegroundColor Green

# Check Maven
Write-Host "Checking Maven..." -ForegroundColor Cyan
if (!(Get-Command mvn -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Maven is not installed" -ForegroundColor Red
    Write-Host "Please install Maven from: https://maven.apache.org/download.cgi" -ForegroundColor White
    exit 1
}
Write-Host "✓ Maven found" -ForegroundColor Green

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Cyan
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    # Not on the current session PATH. This commonly happens right after a fresh
    # install: the machine/user PATH was updated but this window predates it.
    # Refresh PATH from the registry, then fall back to the default install dir.
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")

    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        $nodeDir = @("$env:ProgramFiles\nodejs", "${env:ProgramFiles(x86)}\nodejs", "$env:LOCALAPPDATA\Programs\nodejs") |
                   Where-Object { Test-Path (Join-Path $_ "node.exe") } | Select-Object -First 1
        if ($nodeDir) {
            $env:Path = "$nodeDir;$env:Path"
        }
    }

    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: Node.js is not installed" -ForegroundColor Red
        Write-Host "Please install Node.js 18+ from: https://nodejs.org/" -ForegroundColor White
        Write-Host "(If you just installed it, open a NEW PowerShell window and retry.)" -ForegroundColor White
        exit 1
    }
}
Write-Host "✓ Node.js found: $(node --version)" -ForegroundColor Green

Write-Host ""
Write-Host "All prerequisites are available!" -ForegroundColor Green
Write-Host ""

# Create environment files
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Setting up environment files" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path ".env") -and (Test-Path "env.example")) {
    Copy-Item "env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

if (!(Test-Path "frontend\.env") -and (Test-Path "frontend\env.example")) {
    Copy-Item "frontend\env.example" "frontend\.env"
    Write-Host "✓ Created frontend/.env file" -ForegroundColor Green
}

# Start Infrastructure
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Starting Infrastructure (PostgreSQL, RabbitMQ, Redis)" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start infrastructure" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Infrastructure containers started" -ForegroundColor Green
Write-Host "Waiting for services to be ready (30 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Build Backend
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Building Backend Services" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This may take a few minutes on first run..." -ForegroundColor White
Write-Host ""

Set-Location backend
mvn clean install -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Maven build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✓ Backend build completed" -ForegroundColor Green
Set-Location ..

# Start Backend Services
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Starting Backend Services" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

# Each service runs hidden in the background and writes its output to
# logs\<service>.log. No PowerShell windows are opened. Use .\view-logs.ps1 to
# follow the logs and .\stop-all.ps1 to stop everything.
$logDir = Join-Path $PWD "logs"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

# Start Eureka Server FIRST - service discovery that every other service registers with
Write-Host "Starting Eureka Server on port 8761..." -ForegroundColor Cyan
$eurekaPath = Join-Path $PWD "backend\eureka-server"
$eurekaLog = Join-Path $logDir "eureka-server.log"
$eurekaBlock = "Set-Location '$eurekaPath'; mvn spring-boot:run *> '$eurekaLog'"
Start-Process powershell -WindowStyle Hidden -ArgumentList "-WindowStyle", "Hidden", "-Command", $eurekaBlock
Write-Host "✓ Eureka Server started (logs: logs\eureka-server.log)" -ForegroundColor Green
Write-Host "Waiting for Eureka Server to be ready (20 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

$services = @(
    @{Name="API Gateway"; Port=8080; Path="backend\api-gateway"},
    @{Name="User Service"; Port=8081; Path="backend\user-service"},
    @{Name="Vehicle Service"; Port=8082; Path="backend\vehicle-service"},
    @{Name="Booking Service"; Port=8083; Path="backend\booking-service"},
    @{Name="Pricing Service"; Port=8084; Path="backend\pricing-service"},
    @{Name="Driver Service"; Port=8085; Path="backend\driver-service"},
    @{Name="Review Service"; Port=8086; Path="backend\review-service"},
    @{Name="Location Service"; Port=8087; Path="backend\location-service"},
    @{Name="Maintenance Service"; Port=8088; Path="backend\maintenance-service"}
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan

    $servicePath = Join-Path $PWD $service.Path
    $logName = Split-Path $service.Path -Leaf
    $logFile = Join-Path $logDir "$logName.log"

    $scriptBlock = "Set-Location '$servicePath'; mvn spring-boot:run *> '$logFile'"

    Start-Process powershell -WindowStyle Hidden -ArgumentList "-WindowStyle", "Hidden", "-Command", $scriptBlock

    Start-Sleep -Seconds 2
    Write-Host "✓ $($service.Name) started (logs: logs\$logName.log)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Waiting for services to initialize (45 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 45

# Start Payment Gateway (requires Java 21 and its own environment variables)
Write-Host ""
Write-Host "Starting Payment Gateway on port 8089..." -ForegroundColor Cyan
$pgPath = Join-Path $PWD "backend\internal-payment-gateway"
if (Test-Path $pgPath) {
    $pgLog = Join-Path $logDir "payment-gateway.log"
    $pgMvn = if (Test-Path (Join-Path $pgPath "mvnw.cmd")) { ".\mvnw.cmd" } else { "mvn" }
    $pgEnv = "`$env:SPRING_PROFILES_ACTIVE='local';" +
             "`$env:DB_PAYMENT='jdbc:postgresql://localhost:5432/mobility_platform?currentSchema=ipg';" +
             "`$env:SECRETS_DBUSER='mobility_user';`$env:SECRETS_DBPASS='mobility_password';" +
             "`$env:AMQ_HOST='localhost';`$env:SECRETS_AMQUSER='mobility_user';" +
             "`$env:SECRETS_AMQPASS='mobility_password';`$env:RABBITMQ_VHOST='mobility_vhost';"
    $pgBlock = "Set-Location '$pgPath'; $pgEnv $pgMvn spring-boot:run *> '$pgLog'"
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-WindowStyle", "Hidden", "-Command", $pgBlock
    Write-Host "✓ Payment Gateway started (logs: logs\payment-gateway.log)" -ForegroundColor Green
    Write-Host "  Note: Payment Gateway requires Java 21 on PATH/JAVA_HOME" -ForegroundColor White
    Start-Sleep -Seconds 5
} else {
    Write-Host "Payment Gateway directory not found, skipping..." -ForegroundColor White
}

# Setup Frontend
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Setting up Frontend" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

Set-Location frontend

if (!(Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes on first run..." -ForegroundColor White
    
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

# Start Frontend
Write-Host ""
Write-Host "Starting React development server..." -ForegroundColor Cyan

$frontendPath = $PWD
$frontendLog = Join-Path $logDir "frontend.log"
$scriptBlock = "Set-Location '$frontendPath'; npm start *> '$frontendLog'"

Start-Process powershell -WindowStyle Hidden -ArgumentList "-WindowStyle", "Hidden", "-Command", $scriptBlock

Set-Location ..

Write-Host "✓ Frontend started (logs: logs\frontend.log)" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  STARTUP COMPLETE!" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "All services are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend Application:" -ForegroundColor White
Write-Host "    http://localhost:3100" -ForegroundColor Green
Write-Host ""
Write-Host "  Service Discovery:" -ForegroundColor White
Write-Host "    Eureka Server:   http://localhost:8761" -ForegroundColor Green
Write-Host ""
Write-Host "  API Gateway:" -ForegroundColor White
Write-Host "    http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "  Infrastructure:" -ForegroundColor White
Write-Host "    PostgreSQL:      localhost:5432" -ForegroundColor Green
Write-Host "    RabbitMQ Admin:  http://localhost:15672" -ForegroundColor Green
Write-Host "    Redis:           localhost:6379" -ForegroundColor Green
Write-Host "    MinIO Console:   http://localhost:9001" -ForegroundColor Green
Write-Host ""
Write-Host "  Payment Gateway:" -ForegroundColor White
Write-Host "    http://localhost:8089/api" -ForegroundColor Green
Write-Host ""
Write-Host "RabbitMQ Credentials: mobility_user / mobility_password" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "✓ Your application should open automatically in your browser" -ForegroundColor Green
Write-Host "✓ Each service runs hidden in the background; output goes to the logs\ folder" -ForegroundColor Green
Write-Host "✓ To view logs, run: .\view-logs.ps1" -ForegroundColor Green
Write-Host "✓ To stop all services, run: .\stop-all.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "Note: It may take 1-2 minutes for all services to be fully ready" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to close this window (services will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
