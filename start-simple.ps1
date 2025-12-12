# Simple Startup Script
Write-Host "Starting Mobility Rental Platform..." -ForegroundColor Yellow

# Start Infrastructure
Write-Host ""
Write-Host "Step 1: Starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d
Start-Sleep -Seconds 30
Write-Host "Done!" -ForegroundColor Green

# Build Backend
Write-Host ""
Write-Host "Step 2: Building backend services..." -ForegroundColor Cyan
cd backend
mvn clean install -DskipTests
cd ..
Write-Host "Done!" -ForegroundColor Green

# Start Backend Services
Write-Host ""
Write-Host "Step 3: Starting backend services..." -ForegroundColor Cyan

cd backend\api-gateway
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 3
cd ..\..

cd backend\user-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

cd backend\vehicle-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

cd backend\booking-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

cd backend\pricing-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

cd backend\driver-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

cd backend\review-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

cd backend\location-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

cd backend\maintenance-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run"
Start-Sleep -Seconds 2
cd ..\..

Write-Host "Done! All backend services started." -ForegroundColor Green
Start-Sleep -Seconds 30

# Install and Start Frontend
Write-Host ""
Write-Host "Step 4: Starting frontend..." -ForegroundColor Cyan
cd frontend
if (-not (Test-Path "node_modules")) {
    npm install
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
cd ..
Write-Host "Done!" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Yellow
Write-Host "  STARTUP COMPLETE" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "API Gateway: http://localhost:8080" -ForegroundColor Green
Write-Host "RabbitMQ: http://localhost:15672" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 1-2 minutes for all services to be ready." -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to close this window..."
Read-Host




