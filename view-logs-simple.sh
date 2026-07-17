#!/bin/bash

# ============================================================================
# Mobility Rental Platform - View Service Logs (Simple)
# ============================================================================
# This script shows all service logs in the current terminal
# ============================================================================

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Viewing All Service Logs${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Press Ctrl+C to exit${NC}"
echo ""
echo "Available log files:"
ls -1 logs/*.log 2>/dev/null | sed 's|logs/||' | sed 's|\.log||' | nl
echo ""
echo "Starting to tail all logs..."
echo ""

# Tail all log files with colored output
if command -v multitail &> /dev/null; then
    # Use multitail if available (better for multiple logs)
    multitail -s 2 -cT ansi -n 1000 logs/*.log
else
    # Fallback to tail -f for all logs (show last 1000 lines)
    tail -n 1000 -f logs/*.log
fi

