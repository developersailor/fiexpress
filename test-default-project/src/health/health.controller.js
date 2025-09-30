import { Request, Response } from 'express';
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
}