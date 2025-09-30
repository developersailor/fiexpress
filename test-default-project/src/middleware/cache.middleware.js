import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../cache/cache.service';

export function cacheMiddleware(ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;
    
    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      
      if (cached !== null) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(body: any) {
        // Cache the response
        cacheService.set(cacheKey, body, ttl).catch(err => {
          console.error('Cache set error:', err);
        });
        
        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

export function cacheInvalidationMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to invalidate cache
    res.json = function(body: any) {
      // Invalidate cache patterns
      patterns.forEach(pattern => {
        cacheService.invalidatePattern(pattern).catch(err => {
          console.error('Cache invalidation error:', err);
        });
      });
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
}

export function cacheStatsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/cache/stats') {
    cacheService.getStats()
      .then(stats => res.json(stats))
      .catch(error => res.status(500).json({ error: error.message }));
  } else {
    next();
  }
}