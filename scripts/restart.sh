#!/bin/bash

# Sextant - Restart Services
# This script stops and starts all Docker containers

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

SYNC_MEMORYGRAPH=false

usage() {
	cat <<'EOF'
Usage: ./scripts/restart.sh [options]

Options:
	--sync-memorygraph    Ingest docs and refresh vectors in MemoryGraph ArangoDB
  -h, --help            Show this help message
EOF
}

while [ "$#" -gt 0 ]; do
	case "$1" in
		--sync-memorygraph)
			SYNC_MEMORYGRAPH=true
			shift
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "❌ ERROR: Unknown option: $1"
			usage
			exit 1
			;;
	esac
done

echo "================================"
echo "Sextant - Restarting Services"
echo "================================"
echo ""

# Stop services
echo "🛑 Stopping services..."
./scripts/stop.sh

echo ""
echo "⏳ Waiting before restart..."
sleep 5

# Start services
echo ""
echo "🚀 Starting services..."
if [ "$SYNC_MEMORYGRAPH" = true ]; then
	./scripts/start.sh --sync-memorygraph
else
	./scripts/start.sh
fi

echo ""
echo "✓ Services have been restarted!"
echo ""
echo "Available at:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  Keycloak:    http://localhost:8080/admin"
echo "  ArangoDB:    http://localhost:8529"
echo ""
