# Payment Gateway Stop Script (Windows / PowerShell)
# Equivalent of scripts/stop-payment-gateway.sh
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\scripts\stop-payment-gateway.ps1

$ErrorActionPreference = "Stop"

$ScriptDir   = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptDir -Parent
$LogDir      = Join-Path $ProjectRoot "logs"
$PidFile     = Join-Path $LogDir "payment-gateway.pid"

Write-Host "Stopping Payment Gateway..." -ForegroundColor Yellow

# Check if PID file exists
if (-not (Test-Path $PidFile)) {
    Write-Host "Payment Gateway is not running (no PID file found)" -ForegroundColor Yellow
    exit 0
}

$servicePid = (Get-Content $PidFile | Select-Object -First 1).Trim()

# Check if process is running
if (-not ($servicePid -and (Get-Process -Id $servicePid -ErrorAction SilentlyContinue))) {
    Write-Host "Payment Gateway is not running (stale PID file)" -ForegroundColor Yellow
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    exit 0
}

# Stop the process tree gracefully
Write-Host "Stopping Payment Gateway (PID: $servicePid)..." -ForegroundColor Yellow
cmd /c "taskkill /PID $servicePid /T" *> $null

# Wait for process to stop
for ($i = 0; $i -lt 30; $i++) {
    if (-not (Get-Process -Id $servicePid -ErrorAction SilentlyContinue)) {
        Write-Host "Payment Gateway stopped successfully" -ForegroundColor Green
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        exit 0
    }
    Start-Sleep -Seconds 1
}

# Force kill if still running
if (Get-Process -Id $servicePid -ErrorAction SilentlyContinue) {
    Write-Host "Payment Gateway did not stop gracefully, forcing shutdown..." -ForegroundColor Red
    cmd /c "taskkill /PID $servicePid /T /F" *> $null
    Start-Sleep -Seconds 2
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "Payment Gateway stopped (forced)" -ForegroundColor Green
}