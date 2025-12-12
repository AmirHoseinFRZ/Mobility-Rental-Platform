# Stop Infrastructure Services for Mobility Rental Platform
# This script stops all running Docker containers

param(
    [switch]$RemoveVolumes = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mobility Rental Platform - Stop Infrastructure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running." -ForegroundColor Red
    exit 1
}

# Stop services
Write-Host ""
if ($RemoveVolumes) {
    Write-Host "⚠ WARNING: This will remove all volumes and delete ALL DATA!" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"
    
    if ($confirmation -eq 'yes') {
        Write-Host ""
        Write-Host "Stopping services and removing volumes..." -ForegroundColor Yellow
        docker-compose down -v
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Services stopped and volumes removed." -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "✗ Failed to stop services." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "Stopping services..." -ForegroundColor Yellow
    docker-compose down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Services stopped successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Note: Data volumes are preserved." -ForegroundColor Gray
        Write-Host "To remove volumes and delete all data, run: .\stop-infrastructure.ps1 -RemoveVolumes" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "✗ Failed to stop services." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""






