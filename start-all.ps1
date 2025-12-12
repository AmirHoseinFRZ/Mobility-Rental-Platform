# ============================================================================
# Mobility Rental Platform - Complete Startup Script (Windows PowerShell)
# ============================================================================
# This script starts:
# 1. Infrastructure (PostgreSQL, RabbitMQ, Redis)
# 2. All Backend Microservices
# 3. Frontend React Application
# ============================================================================

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "Mobility Rental Platform - Starting..."

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Header($message) {
    Write-Host ""
    Write-ColorOutput Yellow "═══════════════════════════════════════════════════════════════"
    Write-ColorOutput Yellow "  $message"
    Write-ColorOutput Yellow "═══════════════════════════════════════════════════════════════"
    Write-Host ""
}

function Write-Step($message) {
    Write-ColorOutput Cyan "➜ $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "✓ $message"
}

function Write-Error-Message($message) {
    Write-ColorOutput Red "✗ $message"
}

function Write-Info($message) {
    Write-ColorOutput White "  $message"
}

# ============================================================================
# STEP 1: Pre-flight Checks
# ============================================================================
Write-Header "PRE-FLIGHT CHECKS"

Write-Step "Checking required tools..."

# Check Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error-Message "Docker is not installed or not in PATH"
    Write-Info "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
}
Write-Success "Docker found"

# Check Docker Compose
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Error-Message "Docker Compose is not installed or not in PATH"
    exit 1
}
Write-Success "Docker Compose found"

# Check Java
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Error-Message "Java is not installed or not in PATH"
    Write-Info "Please install Java JDK 17+ from: https://adoptium.net/"
    exit 1
}
$javaVersion = java -version 2>&1 | Select-String "version" | ForEach-Object { $_ -replace '.*version "([^"]+)".*', '$1' }
Write-Success "Java found: $javaVersion"

# Check Maven
if (!(Get-Command mvn -ErrorAction SilentlyContinue)) {
    Write-Error-Message "Maven is not installed or not in PATH"
    Write-Info "Please install Maven from: https://maven.apache.org/download.cgi"
    exit 1
}
$mavenVersion = mvn -version | Select-String "Apache Maven" | ForEach-Object { $_ -replace 'Apache Maven ', '' }
Write-Success "Maven found: $mavenVersion"

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error-Message "Node.js is not installed or not in PATH"
    Write-Info "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
}
$nodeVersion = node --version
Write-Success "Node.js found: $nodeVersion"

# Check npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error-Message "npm is not installed"
    exit 1
}
$npmVersion = npm --version
Write-Success "npm found: v$npmVersion"

Write-Success "All required tools are available!"

# ============================================================================
# STEP 2: Create Environment Files
# ============================================================================
Write-Header "ENVIRONMENT SETUP"

Write-Step "Setting up environment files..."

# Create backend .env if not exists
if (!(Test-Path ".env")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Success "Created .env file from env.example"
    }
}

# Create frontend .env if not exists
if (!(Test-Path "frontend\.env")) {
    if (Test-Path "frontend\env.example") {
        Copy-Item "frontend\env.example" "frontend\.env"
        Write-Success "Created frontend/.env file"
    }
}

# ============================================================================
# STEP 3: Start Infrastructure
# ============================================================================
Write-Header "STARTING INFRASTRUCTURE"

Write-Step "Starting PostgreSQL, RabbitMQ, and Redis..."
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Error-Message "Failed to start infrastructure"
    exit 1
}

Write-Success "Infrastructure containers started"
Write-Step "Waiting for services to be ready (30 seconds)..."
Start-Sleep -Seconds 30

# Check if containers are running
$postgresRunning = docker ps --filter "name=postgres" --filter "status=running" -q
$rabbitmqRunning = docker ps --filter "name=rabbitmq" --filter "status=running" -q
$redisRunning = docker ps --filter "name=redis" --filter "status=running" -q

if ($postgresRunning) { Write-Success "PostgreSQL is running" } else { Write-Error-Message "PostgreSQL failed to start" }
if ($rabbitmqRunning) { Write-Success "RabbitMQ is running" } else { Write-Error-Message "RabbitMQ failed to start" }
if ($redisRunning) { Write-Success "Redis is running" } else { Write-Error-Message "Redis failed to start" }

# ============================================================================
# STEP 4: Build Backend
# ============================================================================
Write-Header "BUILDING BACKEND"

Write-Step "Building all microservices with Maven..."
Write-Info "This may take a few minutes on first run..."

Set-Location backend
$buildOutput = mvn clean install -DskipTests 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error-Message "Maven build failed"
    Write-Info "Check the output above for errors"
    Set-Location ..
    exit 1
}

Write-Success "Backend build completed successfully"
Set-Location ..

# ============================================================================
# STEP 5: Start Backend Services
# ============================================================================
Write-Header "STARTING BACKEND SERVICES"

Write-Info "Starting microservices in separate windows..."
Write-Info "Each service will open in its own PowerShell window"

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
    Write-Step "Starting $($service.Name) on port $($service.Port)..."
    
    $command = "Set-Location '$PWD\$($service.Path)'; `$Host.UI.RawUI.WindowTitle='$($service.Name) - Port $($service.Port)'; Write-Host ''; Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Yellow; Write-Host '  $($service.Name) - Port $($service.Port)' -ForegroundColor Yellow; Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Yellow; Write-Host ''; mvn spring-boot:run; Read-Host 'Press Enter to close'"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
    
    Start-Sleep -Seconds 2
    Write-Success "$($service.Name) window opened"
}

Write-Info "Waiting for services to initialize (45 seconds)..."
Start-Sleep -Seconds 45

# ============================================================================
# STEP 6: Install Frontend Dependencies
# ============================================================================
Write-Header "SETTING UP FRONTEND"

Set-Location frontend

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Step "Installing frontend dependencies..."
    Write-Info "This may take a few minutes on first run..."
    
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Message "npm install failed"
        Set-Location ..
        exit 1
    }
    
    Write-Success "Frontend dependencies installed"
} else {
    Write-Success "Frontend dependencies already installed"
}

# ============================================================================
# STEP 7: Start Frontend
# ============================================================================
Write-Step "Starting React development server..."

$command = "Set-Location '$PWD'; `$Host.UI.RawUI.WindowTitle='React Frontend - Port 3000'; Write-Host ''; Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Yellow; Write-Host '  React Frontend - Port 3000' -ForegroundColor Yellow; Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Yellow; Write-Host ''; npm start; Read-Host 'Press Enter to close'"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $command

Set-Location ..

Write-Success "Frontend window opened"

# ============================================================================
# STEP 8: Summary
# ============================================================================
Write-Header "STARTUP COMPLETE!"

Write-Success "All services are starting up!"
Write-Host ""
Write-Info "📊 Service URLs:"
Write-Host ""
Write-ColorOutput Cyan "  Frontend Application:"
Write-Info "    ➜ http://localhost:3000"
Write-Host ""
Write-ColorOutput Cyan "  API Gateway:"
Write-Info "    ➜ http://localhost:8080"
Write-Host ""
Write-ColorOutput Cyan "  Infrastructure:"
Write-Info "    ➜ PostgreSQL:      localhost:5432"
Write-Info "    ➜ RabbitMQ Admin:  http://localhost:15672 (user: mobility_user, pass: mobility_password)"
Write-Info "    ➜ Redis:           localhost:6379"
Write-Host ""
Write-ColorOutput Cyan "  Backend Services:"
Write-Info "    ➜ User Service:        http://localhost:8081"
Write-Info "    ➜ Vehicle Service:     http://localhost:8082"
Write-Info "    ➜ Booking Service:     http://localhost:8083"
Write-Info "    ➜ Pricing Service:     http://localhost:8084"
Write-Info "    ➜ Driver Service:      http://localhost:8085"
Write-Info "    ➜ Review Service:      http://localhost:8086"
Write-Info "    ➜ Location Service:    http://localhost:8087"
Write-Info "    ➜ Maintenance Service: http://localhost:8088"
Write-Host ""
Write-ColorOutput Yellow "═══════════════════════════════════════════════════════════════"
Write-Host ""
Write-ColorOutput Green "✓ Your application should open automatically in your browser"
Write-ColorOutput Green "✓ Each service is running in a separate PowerShell window"
Write-ColorOutput Green "✓ To stop all services, run: .\stop-all.ps1"
Write-Host ""
Write-Info "Note: It may take 1-2 minutes for all services to be fully ready"
Write-Info "      Check individual service windows for startup status"
Write-Host ""

# Keep this window open
Write-Host "Press any key to close this window (services will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

