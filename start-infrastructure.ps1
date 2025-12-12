# Start Infrastructure Services for Mobility Rental Platform
# This script starts PostgreSQL, RabbitMQ, and Redis using Docker Compose

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mobility Rental Platform - Start Infrastructure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env exists, if not create from env.example
if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Write-Host "Creating .env file from env.example..." -ForegroundColor Yellow
        Copy-Item "env.example" ".env"
        Write-Host "✓ .env file created. Please review and update credentials if needed." -ForegroundColor Green
    } else {
        Write-Host "⚠ Warning: No .env or env.example file found. Using default values." -ForegroundColor Yellow
    }
}

# Start services
Write-Host ""
Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Infrastructure services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Service Access Information" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "PostgreSQL:" -ForegroundColor White
    Write-Host "  Host: localhost:5432" -ForegroundColor Gray
    Write-Host "  Username: mobility_user" -ForegroundColor Gray
    Write-Host "  Password: Check .env file" -ForegroundColor Gray
    Write-Host "  Main DB: mobility_platform" -ForegroundColor Gray
    Write-Host ""
    Write-Host "RabbitMQ:" -ForegroundColor White
    Write-Host "  AMQP: localhost:5672" -ForegroundColor Gray
    Write-Host "  Management UI: http://localhost:15672" -ForegroundColor Gray
    Write-Host "  Username: mobility_user" -ForegroundColor Gray
    Write-Host "  Password: Check .env file" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Redis:" -ForegroundColor White
    Write-Host "  Host: localhost:6379" -ForegroundColor Gray
    Write-Host "  Password: Check .env file" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "To check status: docker-compose ps" -ForegroundColor Yellow
    Write-Host "To stop services: docker-compose down" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Failed to start infrastructure services." -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    exit 1
}





