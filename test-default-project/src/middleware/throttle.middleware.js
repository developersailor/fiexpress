import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';

// General throttling
export const generalThrottle = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // add 500ms delay per request above delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
});

// API throttling
export const apiThrottle = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 30, // allow 30 requests per minute, then...
  delayMs: 200, // add 200ms delay per request above delayAfter
  maxDelayMs: 10000, // max delay of 10 seconds
});

// Search throttling
export const searchThrottle = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 10, // allow 10 requests per minute, then...
  delayMs: 1000, // add 1s delay per request above delayAfter
  maxDelayMs: 5000, // max delay of 5 seconds
});

// Custom throttling by user
export const createUserThrottle = (delayAfter: number, delayMs: number, maxDelayMs: number) => {
  return slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter,
    delayMs,
    maxDelayMs,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req as any).user?.id || req.ip;
    }
  });
};