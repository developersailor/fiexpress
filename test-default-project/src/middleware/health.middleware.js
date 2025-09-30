import { Request, Response, NextFunction } from 'express';

export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip health checks for health endpoints
  if (req.path.startsWith('/health')) {
    return next();
  }
  
  // Add health check headers
  res.setHeader('X-Health-Check', 'enabled');
  res.setHeader('X-Response-Time', Date.now().toString());
  
  next();
}