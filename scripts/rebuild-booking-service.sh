#!/bin/bash

# Rebuild Booking Service Script
# This script rebuilds the booking service with payment integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BOOKING_SERVICE_DIR="$PROJECT_ROOT/backend/booking-service"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Rebuilding Booking Service with Payment Integration...${NC}"

# Navigate to booking service directory
cd "$BOOKING_SERVICE_DIR"

# Build the application
echo -e "${YELLOW}Building booking service...${NC}"
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Booking service built successfully!${NC}"
    echo -e "${YELLOW}Restarting booking service...${NC}"
    
    # Check if running with Docker
    if docker ps | grep -q mobility-booking-service; then
        echo -e "${YELLOW}Stopping Docker container...${NC}"
        docker compose -f "$PROJECT_ROOT/docker-compose.yml" stop booking-service
        
        echo -e "${YELLOW}Rebuilding Docker image...${NC}"
        docker compose -f "$PROJECT_ROOT/docker-compose.yml" build booking-service
        
        echo -e "${YELLOW}Starting booking service...${NC}"
        docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d booking-service
        
        echo -e "${GREEN}Booking service restarted successfully!${NC}"
    else
        echo -e "${YELLOW}Docker container not running. Please start manually or use Docker Compose.${NC}"
    fi
else
    echo -e "${RED}Failed to build booking service${NC}"
    exit 1
fi

echo -e "${GREEN}Done! The booking service now includes payment integration.${NC}"
echo -e "${GREEN}New endpoints available at: http://localhost:8083/api/bookings/payments${NC}"

