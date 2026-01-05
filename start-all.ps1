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
    Write-Host "ERROR: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from: https://nodejs.org/" -ForegroundColor White
    exit 1
}
Write-Host "✓ Node.js found" -ForegroundColor Green

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

$services = @(
    @{Name="API Gateway"; Port=8080; Path="backend\api-gateway"},
    @{Name="User Service"; Port=8081; Path="backend\user-service"},
    @{Name="Vehicle Service"; Port=8082; Path="backend\vehicle-service"},
    @{Name="Booking Service"; Port=8083; Path="backend\booking-service"},
    @{Name="Pricing Service"; Port=8084; Path="backend\pricing-service"},
    @{Name="Driver Service"; Port=8085; Path="backend\driver-service"},
    @{Name="Review Service"; Port=8086; Path="backend\review-service"},
    @{Name="Location Service"; Port=8087; Path="backend\location-service"},
    @{Name="Maintenance Service"; Port=8088; Path="backend\maintenance-service"},
    @{Name="Payment Gateway"; Port=8089; Path="backend\internal-payment-gateway"}
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan
    
    $servicePath = Join-Path $PWD $service.Path
    $title = "$($service.Name) - Port $($service.Port)"
    
    $scriptBlock = "cd '$servicePath'; `$Host.UI.RawUI.WindowTitle='$title'; Write-Host ''; Write-Host '$title' -ForegroundColor Yellow; Write-Host ''; mvn spring-boot:run"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
    
    Start-Sleep -Seconds 2
    Write-Host "✓ $($service.Name) window opened" -ForegroundColor Green
}

Write-Host ""
Write-Host "Waiting for services to initialize (45 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 45

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
$scriptBlock = "cd '$frontendPath'; `$Host.UI.RawUI.WindowTitle='React Frontend - Port 3000'; Write-Host ''; Write-Host 'React Frontend - Port 3000' -ForegroundColor Yellow; Write-Host ''; npm start"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock

Set-Location ..

Write-Host "✓ Frontend window opened" -ForegroundColor Green

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
Write-Host "    http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  API Gateway:" -ForegroundColor White
Write-Host "    http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "  Infrastructure:" -ForegroundColor White
Write-Host "    PostgreSQL:      localhost:5432" -ForegroundColor Green
Write-Host "    RabbitMQ Admin:  http://localhost:15672" -ForegroundColor Green
Write-Host "    Redis:           localhost:6379" -ForegroundColor Green
Write-Host ""
Write-Host "  Payment Gateway:" -ForegroundColor White
Write-Host "    http://localhost:8089/api" -ForegroundColor Green
Write-Host ""
Write-Host "RabbitMQ Credentials: mobility_user / mobility_password" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "✓ Your application should open automatically in your browser" -ForegroundColor Green
Write-Host "✓ Each service is running in a separate PowerShell window" -ForegroundColor Green
Write-Host "✓ To stop all services, run: .\stop-all.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "Note: It may take 1-2 minutes for all services to be fully ready" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to close this window (services will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
