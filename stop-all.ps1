# ============================================================================
# Mobility Rental Platform - Stop All Services (Windows PowerShell)
# ============================================================================

$ErrorActionPreference = "Continue"

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

Write-Header "STOPPING MOBILITY RENTAL PLATFORM"

# Stop all Java processes (Spring Boot services)
Write-Step "Stopping backend services..."
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    $javaProcesses | Where-Object { $_.MainWindowTitle -like "*Service*" -or $_.MainWindowTitle -like "*Gateway*" } | Stop-Process -Force
    Write-Success "Backend services stopped"
} else {
    Write-Success "No backend services running"
}

# Stop Node.js processes (React frontend)
Write-Step "Stopping frontend..."
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Where-Object { $_.MainWindowTitle -like "*React*" -or $_.MainWindowTitle -like "*Frontend*" } | Stop-Process -Force
    Write-Success "Frontend stopped"
} else {
    Write-Success "No frontend running"
}

# Stop Docker containers
Write-Step "Stopping infrastructure containers..."
docker-compose down
Write-Success "Infrastructure stopped"

Write-Host ""
Write-ColorOutput Green "✓ All services have been stopped"
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")





