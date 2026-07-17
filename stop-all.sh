#!/bin/bash

# ============================================================================
# Mobility Rental Platform - Stop All Services (Linux/Mac)
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_header "STOPPING MOBILITY RENTAL PLATFORM"

# Detect Docker Compose command (support both plugin and standalone versions)
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Stop backend services
print_step "Stopping backend services..."
if [ -d "logs" ]; then
    for pid_file in logs/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid
                service_name=$(basename "$pid_file" .pid)
                print_success "Stopped $service_name (PID: $pid)"
            fi
            rm "$pid_file"
        fi
    done
else
    print_success "No backend services running"
fi

# Stop any remaining Spring Boot processes
print_step "Cleaning up any remaining Java processes..."
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "mvn spring-boot" 2>/dev/null || true
pkill -f "internal-payment-gateway" 2>/dev/null || true

# Stop any Node.js processes
print_step "Stopping frontend..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
print_success "Frontend stopped"

# Stop Docker containers
if [ -n "$DOCKER_COMPOSE_CMD" ]; then
    print_step "Stopping infrastructure containers..."
    $DOCKER_COMPOSE_CMD down
    print_success "Infrastructure stopped"
fi

echo ""
echo -e "${GREEN}✓ All services have been stopped${NC}"
echo ""





