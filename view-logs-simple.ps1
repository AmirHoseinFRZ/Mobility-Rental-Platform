# ============================================================================
# Mobility Rental Platform - View Service Logs (Simple, Windows / PowerShell)
# ============================================================================
# Tails all service logs in the current window.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\view-logs-simple.ps1
# ============================================================================

$ErrorActionPreference = "Continue"

Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "  Viewing All Service Logs" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to exit" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "logs")) {
    Write-Host "Logs directory not found. Services may not be running." -ForegroundColor Red
    exit 1
}

$logs = Get-ChildItem "logs\*.log" -ErrorAction SilentlyContinue
if (-not $logs) {
    Write-Host "No log files found in logs\" -ForegroundColor Red
    exit 1
}

Write-Host "Available log files:" -ForegroundColor Cyan
$i = 1
foreach ($f in $logs) {
    Write-Host ("  {0}. {1}" -f $i, ($f.BaseName))
    $i++
}
Write-Host ""
Write-Host "Starting to tail all logs (each line is prefixed with its service)..." -ForegroundColor Cyan
Write-Host ""

# Follow every log file at once, prefixing each line with the service name.
# Get-Content -Wait blocks, so run one job per file and stream to the console.
$jobs = @()
foreach ($f in $logs) {
    $name = $f.BaseName
    $jobs += Start-Job -ArgumentList $f.FullName, $name -ScriptBlock {
        param($path, $name)
        Get-Content -Path $path -Tail 100 -Wait | ForEach-Object { "[$name] $_" }
    }
}

try {
    while ($true) {
        $jobs | Receive-Job
        Start-Sleep -Milliseconds 500
    }
} finally {
    $jobs | Stop-Job -ErrorAction SilentlyContinue
    $jobs | Remove-Job -Force -ErrorAction SilentlyContinue
}