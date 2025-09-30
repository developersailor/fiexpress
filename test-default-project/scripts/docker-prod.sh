#!/bin/bash
# Production Docker script

echo "🐳 Building production image..."

# Build production image
docker build -f docker/prod.Dockerfile -t myapp:latest .

echo "🚀 Starting production container..."

# Run production container
docker run -d \
  --name myapp-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  myapp:latest

echo "✅ Production container started!"
echo "📡 API available at: http://localhost:3000"
