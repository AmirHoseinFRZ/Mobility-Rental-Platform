#!/bin/bash
# Start Infrastructure Services for Mobility Rental Platform
# This script starts PostgreSQL, RabbitMQ, and Redis using Docker Compose

echo "========================================"
echo "Mobility Rental Platform - Start Infrastructure"
echo "========================================"
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker version > /dev/null 2>&1; then
    echo "✗ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✓ Docker is running"

# Detect Docker Compose command (support both plugin and standalone versions)
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "✗ Docker Compose is not installed or not in PATH"
    exit 1
fi

# Check if .env exists, if not create from env.example
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        echo "Creating .env file from env.example..."
        cp env.example .env
        echo "✓ .env file created. Please review and update credentials if needed."
    else
        echo "⚠ Warning: No .env or env.example file found. Using default values."
    fi
fi

# Start services
echo ""
echo "Starting infrastructure services..."
$DOCKER_COMPOSE_CMD up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Infrastructure services started successfully!"
    echo ""
    echo "========================================"
    echo "Service Access Information"
    echo "========================================"
    echo ""
    echo "PostgreSQL:"
    echo "  Host: localhost:5432"
    echo "  Username: mobility_user"
    echo "  Password: Check .env file"
    echo "  Main DB: mobility_platform"
    echo ""
    echo "RabbitMQ:"
    echo "  AMQP: localhost:5672"
    echo "  Management UI: http://localhost:15672"
    echo "  Username: mobility_user"
    echo "  Password: Check .env file"
    echo ""
    echo "Redis:"
    echo "  Host: localhost:6379"
    echo "  Password: Check .env file"
    echo ""
    echo "MinIO (vehicle images):"
    echo "  API: http://localhost:9000"
    echo "  Console: http://localhost:9001"
    echo "  Set MINIO_PUBLIC_URL=http://localhost:9000 for vehicle-service"
    echo ""
    echo "========================================"
    echo ""
    echo "To view logs: $DOCKER_COMPOSE_CMD logs -f"
    echo "To check status: $DOCKER_COMPOSE_CMD ps"
    echo "To stop services: $DOCKER_COMPOSE_CMD down"
    echo ""
else
    echo ""
    echo "✗ Failed to start infrastructure services."
    echo "Please check the error messages above."
    exit 1
fi






