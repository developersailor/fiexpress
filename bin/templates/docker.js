import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateDockerSupport(targetRoot, options = {}) {
  const { ts = false, db = "postgres" } = options;
  
  // Main Dockerfile
  const dockerfileContent = generateDockerfile(ts);
  writeFileSafe(path.join(targetRoot, "Dockerfile"), dockerfileContent);
  
  // Development Dockerfile
  const devDockerfileContent = generateDevDockerfile();
  writeFileSafe(path.join(targetRoot, "docker", "dev.Dockerfile"), devDockerfileContent);
  
  // Production Dockerfile
  const prodDockerfileContent = generateProdDockerfile(ts);
  writeFileSafe(path.join(targetRoot, "docker", "prod.Dockerfile"), prodDockerfileContent);
  
  // Docker Compose
  const dockerComposeContent = generateDockerCompose(db);
  writeFileSafe(path.join(targetRoot, "docker-compose.yml"), dockerComposeContent);
  
  // Docker Ignore
  const dockerIgnoreContent = generateDockerIgnore();
  writeFileSafe(path.join(targetRoot, ".dockerignore"), dockerIgnoreContent);
  
  // Docker Scripts
  generateDockerScripts(targetRoot);
  
  console.log("🐳 Docker support added successfully!");
}

function generateDockerfile(ts) {
  return `# Multi-stage build for ${ts ? 'TypeScript' : 'JavaScript'} Express.js application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

${ts ? '# Build TypeScript\nRUN npm run build' : '# No build step needed for JavaScript'}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Change ownership
RUN chown -R expressjs:nodejs /app
USER expressjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start production server
CMD ["npm", "start"]
`;
}

function generateDevDockerfile() {
  return `# Development Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]
`;
}

function generateProdDockerfile(ts) {
  return `# Production Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

${ts ? '# Build TypeScript\nRUN npm run build' : '# No build step needed'}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Change ownership
RUN chown -R expressjs:nodejs /app
USER expressjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start production server
CMD ["npm", "start"]
`;
}

function generateDockerCompose(db) {
  const dbService = getDatabaseService(db);
  
  return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/dev.Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DB_URL=postgresql://postgres:password@db:5432/myapp
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
    networks:
      - app-network

  ${dbService}

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
`;
}

function getDatabaseService(db) {
  switch (db) {
    case 'postgres':
      return `  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network`;
    
    case 'mysql':
      return `  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=myapp
      - MYSQL_USER=myapp
      - MYSQL_PASSWORD=password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network`;
    
    case 'mongo':
      return `  db:
    image: mongo:6.0
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=myapp
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network`;
    
    default:
      return '';
  }
}

function generateDockerIgnore() {
  return `# Dependencies
node_modules
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.production

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.dockerignore
`;
}

function generateDockerScripts(targetRoot) {
  // Development script
  const devScript = `#!/bin/bash
# Development Docker script

echo "🐳 Starting development environment..."

# Build and start services
docker-compose up --build

echo "✅ Development environment started!"
echo "📡 API available at: http://localhost:3000"
echo "🗄️  Database available at: localhost:5432"
`;
  
  writeFileSafe(path.join(targetRoot, "scripts", "docker-dev.sh"), devScript);
  
  // Production script
  const prodScript = `#!/bin/bash
# Production Docker script

echo "🐳 Building production image..."

# Build production image
docker build -f docker/prod.Dockerfile -t myapp:latest .

echo "🚀 Starting production container..."

# Run production container
docker run -d \\
  --name myapp-prod \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  myapp:latest

echo "✅ Production container started!"
echo "📡 API available at: http://localhost:3000"
`;
  
  writeFileSafe(path.join(targetRoot, "scripts", "docker-prod.sh"), prodScript);
  
  // Make scripts executable
  const fs = require('fs');
  fs.chmodSync(path.join(targetRoot, "scripts", "docker-dev.sh"), '755');
  fs.chmodSync(path.join(targetRoot, "scripts", "docker-prod.sh"), '755');
}
