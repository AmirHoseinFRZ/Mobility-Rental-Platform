#!/bin/bash
# Start all backend microservices

echo "🚀 Starting Mobility Platform Backend Services..."
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if infrastructure is running
echo "📦 Checking infrastructure services..."
if ! docker ps | grep -q mobility-postgres; then
    echo "⚠️  PostgreSQL is not running. Starting infrastructure..."
    docker-compose up -d
    echo "⏳ Waiting for infrastructure to be ready (30 seconds)..."
    sleep 30
fi

# Function to start a service in the background
start_service() {
    local service=$1
    local port=$2
    
    echo "Starting $service on port $port..."
    cd backend/$service
    mvn spring-boot:run > ../../logs/${service}.log 2>&1 &
    echo $! > ../../logs/${service}.pid
    cd ../..
}

# Create logs directory
mkdir -p logs

# Start services in order
echo ""
echo "🎯 Starting microservices..."
echo ""

# Start API Gateway first (critical)
start_service "api-gateway" "8080"
sleep 10

# Start core services
start_service "user-service" "8081"
start_service "vehicle-service" "8082"
start_service "booking-service" "8083"
start_service "pricing-service" "8084"

# Start additional services
start_service "driver-service" "8085"
start_service "review-service" "8086"
start_service "location-service" "8087"
start_service "maintenance-service" "8088"

echo ""
echo "⏳ Waiting for services to start (60 seconds)..."
sleep 60

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Service Status:"
echo "  API Gateway:     http://localhost:8080"
echo "  User Service:    http://localhost:8081/api/users/swagger-ui.html"
echo "  Vehicle Service: http://localhost:8082/api/vehicles/swagger-ui.html"
echo "  Booking Service: http://localhost:8083/api/bookings/swagger-ui.html"
echo "  Pricing Service: http://localhost:8084/api/pricing/swagger-ui.html"
echo "  Driver Service:  http://localhost:8085/api/drivers/swagger-ui.html"
echo "  Review Service:  http://localhost:8086/api/reviews/swagger-ui.html"
echo ""
echo "📝 Logs are available in: ./logs/"
echo "🛑 To stop all services, run: ./scripts/stop-all-backend.sh"
echo ""






