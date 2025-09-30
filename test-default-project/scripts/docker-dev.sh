#!/bin/bash
# Development Docker script

echo "🐳 Starting development environment..."

# Build and start services
docker-compose up --build

echo "✅ Development environment started!"
echo "📡 API available at: http://localhost:3000"
echo "🗄️  Database available at: localhost:5432"
