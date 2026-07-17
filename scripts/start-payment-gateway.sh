#!/bin/bash

# Payment Gateway Startup Script
# This script starts the internal payment gateway service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PAYMENT_GATEWAY_DIR="$PROJECT_ROOT/backend/internal-payment-gateway"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOG_DIR/payment-gateway.pid"
LOG_FILE="$LOG_DIR/payment-gateway.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Payment Gateway...${NC}"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Payment Gateway is already running (PID: $PID)${NC}"
        exit 0
    else
        echo -e "${YELLOW}Removing stale PID file${NC}"
        rm -f "$PID_FILE"
    fi
fi

# Check if payment gateway directory exists
if [ ! -d "$PAYMENT_GATEWAY_DIR" ]; then
    echo -e "${RED}Error: Payment gateway directory not found at $PAYMENT_GATEWAY_DIR${NC}"
    exit 1
fi

# Navigate to payment gateway directory
cd "$PAYMENT_GATEWAY_DIR"

# Build the application if needed
if [ ! -f "target/internal-payment-gateway-*.jar" ]; then
    echo -e "${YELLOW}Building payment gateway...${NC}"
    ./mvnw clean package -DskipTests
fi

# Set environment variables
export SERVER_PORT=8089
export SPRING_PROFILES_ACTIVE=local
export DB_PAYMENT="jdbc:postgresql://localhost:5432/mobility_platform?currentSchema=ipg"
export SECRETS_DBUSER="mobility_user"
export SECRETS_DBPASS="mobility_password"
export AMQ_HOST="localhost"
export SECRETS_AMQUSER="mobility_user"
export SECRETS_AMQPASS="mobility_password"
export RABBITMQ_VHOST="mobility_vhost"

# Start the application
echo -e "${GREEN}Starting payment gateway on port 8089...${NC}"
nohup java -jar target/internal-payment-gateway-*.jar > "$LOG_FILE" 2>&1 &
PID=$!

# Save PID
echo $PID > "$PID_FILE"

# Wait a bit and check if it's running
sleep 5
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${GREEN}Payment Gateway started successfully (PID: $PID)${NC}"
    echo -e "${GREEN}Log file: $LOG_FILE${NC}"
    echo -e "${GREEN}API available at: http://localhost:8089/api${NC}"
    echo -e "${GREEN}Sandbox available at: http://localhost:8089/api/sandbox/page?tid=<transaction_id>${NC}"
else
    echo -e "${RED}Failed to start Payment Gateway${NC}"
    echo -e "${RED}Check log file: $LOG_FILE${NC}"
    rm -f "$PID_FILE"
    exit 1
fi

