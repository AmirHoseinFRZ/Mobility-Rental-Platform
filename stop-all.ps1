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

# Stop all Java / Maven processes belonging to the backend microservices.
# We match on the command line so Eureka, the gateway and every service are
# caught regardless of window title.
Write-Step "Stopping backend services..."
$backendProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and (
        $_.CommandLine -like "*spring-boot:run*" -or
        $_.CommandLine -like "*internal-payment-gateway*" -or
        $_.CommandLine -like "*\backend\*"
    ) -and ($_.Name -match "^(java|javaw|mvn|mvnw|cmd|conhost)")
}
if ($backendProcs) {
    foreach ($p in $backendProcs) {
        # /T kills the whole child tree (mvn -> java), /F forces it
        cmd /c "taskkill /PID $($p.ProcessId) /T /F" *> $null
    }
    Write-Success "Backend services stopped"
} else {
    Write-Success "No backend services running"
}

# Stop Node.js processes (React frontend)
Write-Step "Stopping frontend..."
$nodeProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and ($_.CommandLine -like "*react-scripts*" -or $_.CommandLine -like "*npm*start*")
}
if ($nodeProcs) {
    foreach ($p in $nodeProcs) {
        cmd /c "taskkill /PID $($p.ProcessId) /T /F" *> $null
    }
    Write-Success "Frontend stopped"
} else {
    Write-Success "No frontend running"
}

# Clean up any PID files left by the scripts/ helpers
if (Test-Path "logs") {
    Get-ChildItem "logs\*.pid" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
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





