#!/bin/bash

# Payment Gateway Stop Script
# This script stops the internal payment gateway service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOG_DIR/payment-gateway.pid"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Payment Gateway...${NC}"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}Payment Gateway is not running (no PID file found)${NC}"
    exit 0
fi

# Read PID
PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${YELLOW}Payment Gateway is not running (stale PID file)${NC}"
    rm -f "$PID_FILE"
    exit 0
fi

# Stop the process
echo -e "${YELLOW}Stopping Payment Gateway (PID: $PID)...${NC}"
kill "$PID"

# Wait for process to stop
for i in {1..30}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}Payment Gateway stopped successfully${NC}"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${RED}Payment Gateway did not stop gracefully, forcing shutdown...${NC}"
    kill -9 "$PID"
    sleep 2
    rm -f "$PID_FILE"
    echo -e "${GREEN}Payment Gateway stopped (forced)${NC}"
fi

