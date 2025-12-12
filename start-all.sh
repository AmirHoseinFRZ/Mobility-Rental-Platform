#!/bin/bash

# ============================================================================
# Mobility Rental Platform - Complete Startup Script (Linux/Mac)
# ============================================================================
# This script starts:
# 1. Infrastructure (PostgreSQL, RabbitMQ, Redis)
# 2. All Backend Microservices
# 3. Frontend React Application
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Helper functions
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

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${WHITE}  $1${NC}"
}

# ============================================================================
# STEP 1: Pre-flight Checks
# ============================================================================
print_header "PRE-FLIGHT CHECKS"

print_step "Checking required tools..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    print_info "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker found"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi
print_success "Docker Compose found"

# Check Java
if ! command -v java &> /dev/null; then
    print_error "Java is not installed or not in PATH"
    print_info "Please install Java JDK 17+ from: https://adoptium.net/"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
print_success "Java found: $JAVA_VERSION"

# Check Maven
if ! command -v mvn &> /dev/null; then
    print_error "Maven is not installed or not in PATH"
    print_info "Please install Maven from: https://maven.apache.org/download.cgi"
    exit 1
fi
MAVEN_VERSION=$(mvn -version | head -n 1 | cut -d' ' -f3)
print_success "Maven found: $MAVEN_VERSION"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    print_info "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm found: v$NPM_VERSION"

print_success "All required tools are available!"

# ============================================================================
# STEP 2: Create Environment Files
# ============================================================================
print_header "ENVIRONMENT SETUP"

print_step "Setting up environment files..."

# Create backend .env if not exists
if [ ! -f ".env" ] && [ -f "env.example" ]; then
    cp env.example .env
    print_success "Created .env file from env.example"
fi

# Create frontend .env if not exists
if [ ! -f "frontend/.env" ] && [ -f "frontend/env.example" ]; then
    cp frontend/env.example frontend/.env
    print_success "Created frontend/.env file"
fi

# ============================================================================
# STEP 3: Start Infrastructure
# ============================================================================
print_header "STARTING INFRASTRUCTURE"

print_step "Starting PostgreSQL, RabbitMQ, and Redis..."
docker-compose up -d

print_success "Infrastructure containers started"
print_step "Waiting for services to be ready (30 seconds)..."
sleep 30

# Check if containers are running
if docker ps | grep -q postgres; then
    print_success "PostgreSQL is running"
else
    print_error "PostgreSQL failed to start"
fi

if docker ps | grep -q rabbitmq; then
    print_success "RabbitMQ is running"
else
    print_error "RabbitMQ failed to start"
fi

if docker ps | grep -q redis; then
    print_success "Redis is running"
else
    print_error "Redis failed to start"
fi

# ============================================================================
# STEP 4: Build Backend
# ============================================================================
print_header "BUILDING BACKEND"

print_step "Building all microservices with Maven..."
print_info "This may take a few minutes on first run..."

cd backend
mvn clean install -DskipTests

if [ $? -ne 0 ]; then
    print_error "Maven build failed"
    exit 1
fi

print_success "Backend build completed successfully"
cd ..

# ============================================================================
# STEP 5: Start Backend Services
# ============================================================================
print_header "STARTING BACKEND SERVICES"

print_info "Starting microservices in background..."

# Create logs directory
mkdir -p logs

# Define services
declare -a SERVICES=(
    "api-gateway:8080"
    "user-service:8081"
    "vehicle-service:8082"
    "booking-service:8083"
    "pricing-service:8084"
    "driver-service:8085"
    "review-service:8086"
    "location-service:8087"
    "maintenance-service:8088"
)

# Start each service
for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    print_step "Starting $service on port $port..."
    
    cd "backend/$service"
    nohup mvn spring-boot:run > "../../logs/$service.log" 2>&1 &
    echo $! > "../../logs/$service.pid"
    cd ../..
    
    print_success "$service started (PID: $(cat logs/$service.pid))"
    sleep 2
done

print_info "Waiting for services to initialize (45 seconds)..."
sleep 45

# ============================================================================
# STEP 6: Install Frontend Dependencies
# ============================================================================
print_header "SETTING UP FRONTEND"

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    print_info "This may take a few minutes on first run..."
    
    npm install
    
    if [ $? -ne 0 ]; then
        print_error "npm install failed"
        exit 1
    fi
    
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

# ============================================================================
# STEP 7: Start Frontend
# ============================================================================
print_step "Starting React development server..."

nohup npm start > ../logs/frontend.log 2>&1 &
echo $! > ../logs/frontend.pid

cd ..

print_success "Frontend started (PID: $(cat logs/frontend.pid))"

# ============================================================================
# STEP 8: Summary
# ============================================================================
print_header "STARTUP COMPLETE!"

print_success "All services are running!"
echo ""
print_info "📊 Service URLs:"
echo ""
echo -e "${CYAN}  Frontend Application:${NC}"
print_info "    ➜ http://localhost:3000"
echo ""
echo -e "${CYAN}  API Gateway:${NC}"
print_info "    ➜ http://localhost:8080"
echo ""
echo -e "${CYAN}  Infrastructure:${NC}"
print_info "    ➜ PostgreSQL:      localhost:5432"
print_info "    ➜ RabbitMQ Admin:  http://localhost:15672 (user: mobility_user, pass: mobility_password)"
print_info "    ➜ Redis:           localhost:6379"
echo ""
echo -e "${CYAN}  Backend Services:${NC}"
print_info "    ➜ User Service:        http://localhost:8081"
print_info "    ➜ Vehicle Service:     http://localhost:8082"
print_info "    ➜ Booking Service:     http://localhost:8083"
print_info "    ➜ Pricing Service:     http://localhost:8084"
print_info "    ➜ Driver Service:      http://localhost:8085"
print_info "    ➜ Review Service:      http://localhost:8086"
print_info "    ➜ Location Service:    http://localhost:8087"
print_info "    ➜ Maintenance Service: http://localhost:8088"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ All services are running in background${NC}"
echo -e "${GREEN}✓ Logs are available in the 'logs/' directory${NC}"
echo -e "${GREEN}✓ To stop all services, run: ./stop-all.sh${NC}"
echo ""
print_info "Note: It may take 1-2 minutes for all services to be fully ready"
print_info "      Check logs/ directory for service status"
echo ""
print_info "Useful commands:"
print_info "  - View logs: tail -f logs/<service-name>.log"
print_info "  - Check status: ps aux | grep spring-boot"
print_info "  - Stop all: ./stop-all.sh"
echo ""




