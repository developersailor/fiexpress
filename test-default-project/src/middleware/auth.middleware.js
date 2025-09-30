import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}

export function requireGuest(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Already authenticated'
  });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Always continue, but add user info if available
  if (req.isAuthenticated()) {
    req.user = req.user;
  }
  next();
}