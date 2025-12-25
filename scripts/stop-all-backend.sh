#!/bin/bash
# Stop all backend microservices

echo "🛑 Stopping Mobility Platform Backend Services..."
echo ""

# Check if logs directory exists
if [ ! -d "logs" ]; then
    echo "⚠️  No logs directory found. Services may not be running."
    exit 0
fi

# Function to stop a service
stop_service() {
    local service=$1
    
    if [ -f "logs/${service}.pid" ]; then
        local pid=$(cat logs/${service}.pid)
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $service (PID: $pid)..."
            kill $pid
            rm logs/${service}.pid
        else
            echo "$service is not running"
            rm logs/${service}.pid 2>/dev/null
        fi
    else
        echo "$service PID file not found"
    fi
}

# Stop all services
stop_service "api-gateway"
stop_service "user-service"
stop_service "vehicle-service"
stop_service "booking-service"
stop_service "pricing-service"
stop_service "driver-service"
stop_service "review-service"
stop_service "location-service"
stop_service "maintenance-service"

# Detect Docker Compose command (support both plugin and standalone versions)
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

echo ""
echo "✅ All backend services stopped!"
echo ""
if [ -n "$DOCKER_COMPOSE_CMD" ]; then
    echo "💡 To stop infrastructure (PostgreSQL, RabbitMQ, Redis):"
    echo "   $DOCKER_COMPOSE_CMD down"
    echo ""
    echo "⚠️  To stop infrastructure and DELETE ALL DATA:"
    echo "   $DOCKER_COMPOSE_CMD down -v"
    echo ""
fi






