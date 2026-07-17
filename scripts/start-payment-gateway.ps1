# Payment Gateway Startup Script (Windows / PowerShell)
# Equivalent of scripts/start-payment-gateway.sh
# Starts the internal payment gateway service (requires Java 21).
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\scripts\start-payment-gateway.ps1

$ErrorActionPreference = "Stop"

$ScriptDir         = $PSScriptRoot
$ProjectRoot       = Split-Path $ScriptDir -Parent
$PaymentGatewayDir = Join-Path $ProjectRoot "backend\internal-payment-gateway"
$LogDir            = Join-Path $ProjectRoot "logs"
$PidFile           = Join-Path $LogDir "payment-gateway.pid"
$LogFile           = Join-Path $LogDir "payment-gateway.log"

# Create logs directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Write-Host "Starting Payment Gateway..." -ForegroundColor Green

# Check if already running
if (Test-Path $PidFile) {
    $existingPid = (Get-Content $PidFile | Select-Object -First 1).Trim()
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Write-Host "Payment Gateway is already running (PID: $existingPid)" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "Removing stale PID file" -ForegroundColor Yellow
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
}

# Check if payment gateway directory exists
if (-not (Test-Path $PaymentGatewayDir)) {
    Write-Host "Error: Payment gateway directory not found at $PaymentGatewayDir" -ForegroundColor Red
    exit 1
}

Set-Location $PaymentGatewayDir

# Build the application if no jar exists yet
$jar = Get-ChildItem "target\internal-payment-gateway-*.jar" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $jar) {
    Write-Host "Building payment gateway..." -ForegroundColor Yellow
    $mvnw = if (Test-Path "mvnw.cmd") { ".\mvnw.cmd" } else { "mvn" }
    & cmd /c "$mvnw clean package -DskipTests"
    $jar = Get-ChildItem "target\internal-payment-gateway-*.jar" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $jar) {
        Write-Host "Failed to build payment gateway" -ForegroundColor Red
        exit 1
    }
}

# Set environment variables
$env:SERVER_PORT           = "8089"
$env:SPRING_PROFILES_ACTIVE = "local"
$env:DB_PAYMENT            = "jdbc:postgresql://localhost:5432/mobility_platform?currentSchema=ipg"
$env:SECRETS_DBUSER        = "mobility_user"
$env:SECRETS_DBPASS        = "mobility_password"
$env:AMQ_HOST              = "localhost"
$env:SECRETS_AMQUSER       = "mobility_user"
$env:SECRETS_AMQPASS       = "mobility_password"
$env:RABBITMQ_VHOST        = "mobility_vhost"

# Start the application
Write-Host "Starting payment gateway on port 8089..." -ForegroundColor Green
$proc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "java -jar `"$($jar.FullName)`" > `"$LogFile`" 2>&1" `
    -WorkingDirectory $PaymentGatewayDir -WindowStyle Hidden -PassThru
$proc.Id | Out-File -Encoding ascii $PidFile

# Wait a bit and check if it's running
Start-Sleep -Seconds 5
if (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) {
    Write-Host "Payment Gateway started successfully (PID: $($proc.Id))" -ForegroundColor Green
    Write-Host "Log file: $LogFile" -ForegroundColor Green
    Write-Host "API available at: http://localhost:8089/api" -ForegroundColor Green
    Write-Host "Sandbox available at: http://localhost:8089/api/sandbox/page?tid=<transaction_id>" -ForegroundColor Green
} else {
    Write-Host "Failed to start Payment Gateway" -ForegroundColor Red
    Write-Host "Check log file: $LogFile" -ForegroundColor Red
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    exit 1
}