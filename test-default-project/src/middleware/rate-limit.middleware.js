import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';


// Basic rate limiting
export const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
});

// API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
});

// Slow down middleware
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // add 500ms delay per request above delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
  
});

// Custom rate limiting by user
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req as any).user?.id || req.ip;
    },
    message: {
      error: 'User rate limit exceeded, please try again later.',
      retryAfter: `${Math.ceil(windowMs / 1000)} seconds`
    },
    standardHeaders: true,
    legacyHeaders: false,
    
  });
};

// Rate limit bypass for trusted IPs
export const trustedIPs = [
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1'
];

export const bypassRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (trustedIPs.includes(req.ip)) {
    return next();
  }
  return basicRateLimit(req, res, next);
};