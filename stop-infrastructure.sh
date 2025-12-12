#!/bin/bash
# Stop Infrastructure Services for Mobility Rental Platform
# This script stops all running Docker containers

REMOVE_VOLUMES=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--remove-volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-v|--remove-volumes]"
            exit 1
            ;;
    esac
done

echo "========================================"
echo "Mobility Rental Platform - Stop Infrastructure"
echo "========================================"
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker version > /dev/null 2>&1; then
    echo "✗ Docker is not running."
    exit 1
fi
echo "✓ Docker is running"

# Stop services
echo ""
if [ "$REMOVE_VOLUMES" = true ]; then
    echo "⚠ WARNING: This will remove all volumes and delete ALL DATA!"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    
    if [ "$confirmation" = "yes" ]; then
        echo ""
        echo "Stopping services and removing volumes..."
        docker-compose down -v
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓ Services stopped and volumes removed."
        else
            echo ""
            echo "✗ Failed to stop services."
            exit 1
        fi
    else
        echo ""
        echo "Operation cancelled."
        exit 0
    fi
else
    echo "Stopping services..."
    docker-compose down
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Services stopped successfully!"
        echo ""
        echo "Note: Data volumes are preserved."
        echo "To remove volumes and delete all data, run: ./stop-infrastructure.sh --remove-volumes"
    else
        echo ""
        echo "✗ Failed to stop services."
        exit 1
    fi
fi

echo ""


