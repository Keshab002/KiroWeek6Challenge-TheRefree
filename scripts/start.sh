#!/bin/bash

# The Referee - Quick Start Script
# Usage: ./scripts/start.sh [dev|prod]

set -e

MODE=${1:-prod}

echo "🏆 Starting The Referee..."
echo ""

if [ "$MODE" = "dev" ]; then
    echo "📦 Starting in DEVELOPMENT mode..."
    echo "   - Database: Docker container"
    echo "   - Backend: Local with hot-reload"
    echo "   - Frontend: Local with hot-reload"
    echo ""
    
    # Start database
    echo "🐘 Starting PostgreSQL..."
    docker-compose -f docker-compose.dev.yml up -d
    
    echo ""
    echo "✅ Database is starting!"
    echo ""
    echo "Next steps:"
    echo "  1. cd backend && npm install && npm run dev"
    echo "  2. cd frontend && npm install && npm run dev"
    echo ""
    echo "Access:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend:  http://localhost:3000"
    echo "  - Database: localhost:5432"
    
else
    echo "🚀 Starting in PRODUCTION mode..."
    echo "   - All services in Docker containers"
    echo ""
    
    # Build and start all services
    echo "🔨 Building and starting all services..."
    docker-compose up --build -d
    
    echo ""
    echo "⏳ Waiting for services to be healthy..."
    sleep 5
    
    # Check health
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        echo "✅ Backend is healthy!"
    else
        echo "⚠️  Backend may still be starting..."
    fi
    
    echo ""
    echo "✅ The Referee is running!"
    echo ""
    echo "Access:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend:  http://localhost:3000"
    echo "  - Health:   http://localhost:3000/api/health"
    echo ""
    echo "Commands:"
    echo "  - View logs:  docker-compose logs -f"
    echo "  - Stop:       docker-compose down"
    echo "  - Reset DB:   docker-compose down -v && docker-compose up -d"
fi
