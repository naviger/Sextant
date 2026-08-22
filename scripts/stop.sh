#!/bin/bash

# Sextant - Stop Services
# This script stops all Docker containers

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "================================"
echo "Sextant - Stopping Services"
echo "================================"
echo ""

echo "🛑 Stopping Docker Compose services..."
docker-compose down

echo ""
echo "✓ All services have been stopped!"
echo ""
echo "To view logs, use: ./scripts/logs.sh"
echo "To restart, use: ./scripts/start.sh or ./scripts/restart.sh"
echo ""
