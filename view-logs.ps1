# ============================================================================
# Mobility Rental Platform - View Service Logs (Windows / PowerShell)
# ============================================================================
# Opens each service log in a separate PowerShell window (tail -f equivalent).
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\view-logs.ps1 [-Lines N] [-All]
#   -Lines N   Show last N lines before following (default: 1000)
#   -All       Show the whole log, then follow
# ============================================================================

param(
    [int]$Lines = 1000,
    [switch]$All = $false
)

$ErrorActionPreference = "Continue"

# Check if logs directory exists
if (-not (Test-Path "logs")) {
    Write-Host "Logs directory not found. Services may not be running." -ForegroundColor Red
    exit 1
}

Write-Host "Opening service logs in separate windows..." -ForegroundColor Cyan
if ($All) {
    Write-Host "Showing all log content for each service" -ForegroundColor Cyan
} else {
    Write-Host "Showing last $Lines lines for each service" -ForegroundColor Cyan
}
Write-Host ""

# Define services (log-name = display title)
$services = [ordered]@{
    "eureka-server"       = "Eureka Server"
    "api-gateway"         = "API Gateway"
    "user-service"        = "User Service"
    "vehicle-service"     = "Vehicle Service"
    "booking-service"     = "Booking Service"
    "pricing-service"     = "Pricing Service"
    "driver-service"      = "Driver Service"
    "review-service"      = "Review Service"
    "location-service"    = "Location Service"
    "maintenance-service" = "Maintenance Service"
    "payment-gateway"     = "Payment Gateway"
    "frontend"            = "Frontend"
}

foreach ($service in $services.Keys) {
    $title   = $services[$service]
    $logFile = Join-Path (Join-Path $PWD "logs") "$service.log"

    if (Test-Path $logFile) {
        if ($All) {
            # Get-Content -Wait follows the file; -Tail 0 after a full print isn't
            # possible in one call, so just print all then follow.
            $cmd = "`$Host.UI.RawUI.WindowTitle='$title'; Get-Content -Path '$logFile' -Wait"
        } else {
            $cmd = "`$Host.UI.RawUI.WindowTitle='$title'; Get-Content -Path '$logFile' -Tail $Lines -Wait"
        }
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
        Write-Host "Opened $title log" -ForegroundColor Green
        Start-Sleep -Milliseconds 500
    } else {
        Write-Host "Log file not found: $logFile" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All available service logs opened!" -ForegroundColor Green
Write-Host ""
Write-Host "To view a log manually, use:" -ForegroundColor Cyan
Write-Host "  Get-Content logs\<service-name>.log -Wait" -ForegroundColor White