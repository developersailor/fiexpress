import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateHealthCheckSupport(targetRoot, options = {}) {
  const { ts = false, db = "postgres", redis = false } = options;
  
  // Health controller
  const healthController = generateHealthController(ts, db, redis);
  writeFileSafe(path.join(targetRoot, "src", "health", "health.controller.js"), healthController);
  
  // Health routes
  const healthRoutes = generateHealthRoutes(ts);
  writeFileSafe(path.join(targetRoot, "src", "routes", "health.js"), healthRoutes);
  
  // Health checks
  generateHealthChecks(targetRoot, ts, db, redis);
  
  // Health middleware
  const healthMiddleware = generateHealthMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "health.middleware.js"), healthMiddleware);
  
  console.log("🏥 Health check endpoints added successfully!");
}

function generateHealthController(ts, db, redis) {
  
  if (ts) {
    return `import { Request, Response } from 'express';
import { checkDatabaseHealth } from './checks/database.check';
import { checkRedisHealth } from './checks/redis.check';
import { getSystemMetrics } from './metrics/system.metrics';

export class HealthController {
  async getHealth(req: Request, res: Response) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: await checkDatabaseHealth(),
          ${redis ? 'redis: await checkRedisHealth(),' : ''}
          memory: getSystemMetrics().memory,
          cpu: getSystemMetrics().cpu
        }
      };

      // Determine overall health status
      const allChecksHealthy = Object.values(health.checks).every(check => 
        typeof check === 'object' ? check.status === 'healthy' : true
      );

      health.status = allChecksHealthy ? 'healthy' : 'unhealthy';

      const statusCode = allChecksHealthy ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async getReadiness(req: Request, res: Response) {
    try {
      const readiness = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: await checkDatabaseHealth(),
          ${redis ? 'redis: await checkRedisHealth(),' : ''}
        }
      };

      const allChecksReady = Object.values(readiness.checks).every(check => 
        typeof check === 'object' ? check.status === 'healthy' : true
      );

      readiness.status = allChecksReady ? 'ready' : 'not ready';
      const statusCode = allChecksReady ? 200 : 503;
      res.status(statusCode).json(readiness);
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async getLiveness(req: Request, res: Response) {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}`;
  } else {
    return `const { checkDatabaseHealth } = require('./checks/database.check');
const { checkRedisHealth } = require('./checks/redis.check');
const { getSystemMetrics } = require('./metrics/system.metrics');

class HealthController {
  async getHealth(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: await checkDatabaseHealth(),
          ${redis ? 'redis: await checkRedisHealth(),' : ''}
          memory: getSystemMetrics().memory,
          cpu: getSystemMetrics().cpu
        }
      };

      // Determine overall health status
      const allChecksHealthy = Object.values(health.checks).every(check => 
        typeof check === 'object' ? check.status === 'healthy' : true
      );

      health.status = allChecksHealthy ? 'healthy' : 'unhealthy';

      const statusCode = allChecksHealthy ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async getReadiness(req, res) {
    try {
      const readiness = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: await checkDatabaseHealth(),
          ${redis ? 'redis: await checkRedisHealth(),' : ''}
        }
      };

      const allChecksReady = Object.values(readiness.checks).every(check => 
        typeof check === 'object' ? check.status === 'healthy' : true
      );

      readiness.status = allChecksReady ? 'ready' : 'not ready';
      const statusCode = allChecksReady ? 200 : 503;
      res.status(statusCode).json(readiness);
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async getLiveness(req, res) {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}

module.exports = { HealthController };
`;
  }
}

function generateHealthRoutes(ts) {
  
  if (ts) {
    return `import express from 'express';
import { HealthController } from '../health/health.controller';

const router = express.Router();
const healthController = new HealthController();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get application health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 checks:
 *                   type: object
 *       503:
 *         description: Application is unhealthy
 */
router.get('/', healthController.getHealth);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Check if application is ready to receive traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *       503:
 *         description: Application is not ready
 */
router.get('/ready', healthController.getReadiness);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Check if application is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 */
router.get('/live', healthController.getLiveness);

export default router;`;
  } else {
    return `const express = require('express');
const { HealthController } = require('../health/health.controller');

const router = express.Router();
const healthController = new HealthController();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get application health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 checks:
 *                   type: object
 *       503:
 *         description: Application is unhealthy
 */
router.get('/', healthController.getHealth);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Check if application is ready to receive traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *       503:
 *         description: Application is not ready
 */
router.get('/ready', healthController.getReadiness);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Check if application is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 */
router.get('/live', healthController.getLiveness);

module.exports = router;`;
  }
}

function generateHealthChecks(targetRoot, ts, db, redis) {
  // Database health check
  const databaseCheck = generateDatabaseCheck(ts, db);
  writeFileSafe(path.join(targetRoot, "src", "health", "checks", "database.check.js"), databaseCheck);
  
  // Redis health check (if enabled)
  if (redis) {
    const redisCheck = generateRedisCheck(ts);
    writeFileSafe(path.join(targetRoot, "src", "health", "checks", "redis.check.js"), redisCheck);
  }
  
  // System metrics
  const systemMetrics = generateSystemMetrics(ts);
  writeFileSafe(path.join(targetRoot, "src", "health", "metrics", "system.metrics.js"), systemMetrics);
}

function generateDatabaseCheck(ts, db) {
  
  if (ts) {
    return `import { Sequelize } from 'sequelize';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';

export async function checkDatabaseHealth(): Promise<{ status: string; message?: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    switch ('${db}') {
      case 'postgres':
      case 'mysql':
        // Sequelize check
        const sequelize = new Sequelize(process.env.DB_URL || 'postgres://localhost/test');
        await sequelize.authenticate();
        await sequelize.close();
        break;
        
      case 'mongo':
        // Mongoose check
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(process.env.DB_URL || 'mongodb://localhost/test');
        }
        break;
        
      default:
        // Prisma check
        const prisma = new PrismaClient();
        await prisma.$queryRaw\`SELECT 1\`;
        await prisma.$disconnect();
        break;
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: \`\${responseTime}ms\`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: \`Database connection failed: \${error.message}\`
    };
  }
}`;
  } else {
    return `const { Sequelize } = require('sequelize');
const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');

async function checkDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    switch ('${db}') {
      case 'postgres':
      case 'mysql':
        // Sequelize check
        const sequelize = new Sequelize(process.env.DB_URL || 'postgres://localhost/test');
        await sequelize.authenticate();
        await sequelize.close();
        break;
        
      case 'mongo':
        // Mongoose check
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(process.env.DB_URL || 'mongodb://localhost/test');
        }
        break;
        
      default:
        // Prisma check
        const prisma = new PrismaClient();
        await prisma.$queryRaw\`SELECT 1\`;
        await prisma.$disconnect();
        break;
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: \`\${responseTime}ms\`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: \`Database connection failed: \${error.message}\`
    };
  }
}

module.exports = { checkDatabaseHealth };
`;
  }
}

function generateRedisCheck(ts) {
  
  if (ts) {
    return `import { createClient } from 'redis';

export async function checkRedisHealth(): Promise<{ status: string; message?: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Redis connection successful',
      responseTime: \`\${responseTime}ms\`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: \`Redis connection failed: \${error.message}\`
    };
  }
}`;
  } else {
    return `const { createClient } = require('redis');

async function checkRedisHealth() {
  const startTime = Date.now();
  
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Redis connection successful',
      responseTime: \`\${responseTime}ms\`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: \`Redis connection failed: \${error.message}\`
    };
  }
}

module.exports = { checkRedisHealth };
`;
  }
}

function generateSystemMetrics(ts) {
  
  if (ts) {
    return `import os from 'os';

export function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  return {
    memory: {
      used: \`\${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB\`,
      total: \`\${Math.round(totalMemory / 1024 / 1024)} MB\`,
      free: \`\${Math.round(freeMemory / 1024 / 1024)} MB\`,
      usage: \`\${Math.round(((totalMemory - freeMemory) / totalMemory) * 100)}%\`
    },
    cpu: {
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch()
    },
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform
    }
  };
}`;
  } else {
    return `const os = require('os');

function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  return {
    memory: {
      used: \`\${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB\`,
      total: \`\${Math.round(totalMemory / 1024 / 1024)} MB\`,
      free: \`\${Math.round(freeMemory / 1024 / 1024)} MB\`,
      usage: \`\${Math.round(((totalMemory - freeMemory) / totalMemory) * 100)}%\`
    },
    cpu: {
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch()
    },
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform
    }
  };
}

module.exports = { getSystemMetrics };
`;
  }
}

function generateHealthMiddleware(ts) {
  
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';

export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip health checks for health endpoints
  if (req.path.startsWith('/health')) {
    return next();
  }
  
  // Add health check headers
  res.setHeader('X-Health-Check', 'enabled');
  res.setHeader('X-Response-Time', Date.now().toString());
  
  next();
}`;
  } else {
    return `function healthCheckMiddleware(req, res, next) {
  // Skip health checks for health endpoints
  if (req.path.startsWith('/health')) {
    return next();
  }
  
  // Add health check headers
  res.setHeader('X-Health-Check', 'enabled');
  res.setHeader('X-Response-Time', Date.now().toString());
  
  next();
}

module.exports = { healthCheckMiddleware };
`;
  }
}
