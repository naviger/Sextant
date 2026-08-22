#!/bin/bash

# Sextant - Restart Services
# This script stops and starts all Docker containers

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "================================"
echo "Sextant - Restarting Services"
echo "================================"
echo ""

# Stop services
echo "🛑 Stopping services..."
docker-compose down

echo ""
echo "⏳ Waiting before restart..."
sleep 5

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

echo ""
echo "✓ Services have been restarted!"
echo ""
echo "Available at:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  Keycloak:    http://localhost:8080/admin"
echo "  ArangoDB:    http://localhost:8529"
echo ""
