#!/bin/bash

# ============================================================================
# Mobility Rental Platform - View Service Logs
# ============================================================================
# This script opens each service log in a separate terminal window
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${CYAN}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Parse command line arguments
LINES_TO_SHOW=1000
SHOW_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--lines)
            LINES_TO_SHOW="$2"
            shift 2
            ;;
        -a|--all)
            SHOW_ALL=true
            shift
            ;;
        *)
            print_info "Usage: $0 [-n LINES] [-a|--all]"
            print_info "  -n, --lines N    Show last N lines (default: 1000)"
            print_info "  -a, --all        Show all log content"
            exit 0
            ;;
    esac
done

# Check if logs directory exists
if [ ! -d "logs" ]; then
    print_error "Logs directory not found. Services may not be running."
    exit 1
fi

# Detect available terminal emulator
TERMINAL_CMD=""
if command -v gnome-terminal &> /dev/null; then
    TERMINAL_CMD="gnome-terminal"
elif command -v xterm &> /dev/null; then
    TERMINAL_CMD="xterm"
elif command -v konsole &> /dev/null; then
    TERMINAL_CMD="konsole"
elif command -v xfce4-terminal &> /dev/null; then
    TERMINAL_CMD="xfce4-terminal"
else
    print_error "No supported terminal emulator found"
    print_info "Available options: gnome-terminal, xterm, konsole, xfce4-terminal"
    print_info ""
    print_info "You can view logs manually with:"
    print_info "  tail -f logs/<service-name>.log"
    exit 1
fi

print_info "Opening service logs in separate terminal windows..."
print_info "Using terminal: $TERMINAL_CMD"
if [ "$SHOW_ALL" = true ]; then
    print_info "Showing all log content for each service"
else
    print_info "Showing last $LINES_TO_SHOW lines for each service"
fi
echo ""

# Define services
declare -a SERVICES=(
    "eureka-server:Eureka Server"
    "api-gateway:API Gateway"
    "user-service:User Service"
    "vehicle-service:Vehicle Service"
    "booking-service:Booking Service"
    "pricing-service:Pricing Service"
    "driver-service:Driver Service"
    "review-service:Review Service"
    "location-service:Location Service"
    "maintenance-service:Maintenance Service"
    "frontend:Frontend"
)

# Open logs for each service
for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service title <<< "$service_info"
    log_file="logs/$service.log"
    
    if [ -f "$log_file" ]; then
        # Build tail command based on options
        if [ "$SHOW_ALL" = true ]; then
            TAIL_CMD="cat $log_file && tail -f $log_file"
        else
            TAIL_CMD="tail -n $LINES_TO_SHOW -f $log_file"
        fi
        
        if [ "$TERMINAL_CMD" = "gnome-terminal" ]; then
            gnome-terminal --title="$title" -- bash -c "$TAIL_CMD; exec bash" 2>/dev/null &
        elif [ "$TERMINAL_CMD" = "xterm" ]; then
            xterm -T "$title" -e "bash -c '$TAIL_CMD; exec bash'" &
        elif [ "$TERMINAL_CMD" = "konsole" ]; then
            konsole --title "$title" -e bash -c "$TAIL_CMD; exec bash" &
        elif [ "$TERMINAL_CMD" = "xfce4-terminal" ]; then
            xfce4-terminal --title="$title" -e "bash -c '$TAIL_CMD; exec bash'" &
        fi
        print_success "Opened $title log"
        sleep 0.5
    else
        print_error "Log file not found: $log_file"
    fi
done

echo ""
print_success "All available service logs opened!"
print_info ""
print_info "To view logs manually, use:"
print_info "  tail -f logs/<service-name>.log"
print_info ""
print_info "To view all logs in one terminal:"
print_info "  tail -f logs/*.log"

