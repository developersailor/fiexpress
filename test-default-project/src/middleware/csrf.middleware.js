import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/security.config';

export class CSRFProtection {
  private csrfMiddleware: any;
  
  constructor() {
    this.csrfMiddleware = csrf(securityConfig.csrf);
  }
  
  // CSRF protection middleware
  protect(req: Request, res: Response, next: NextFunction): void {
    this.csrfMiddleware(req, res, next);
  }
  
  // Generate CSRF token
  generateToken(req: Request, res: Response, next: NextFunction): void {
    res.locals.csrfToken = req.csrfToken();
    next();
  }
  
  // Verify CSRF token
  verifyToken(req: Request, res: Response, next: NextFunction): void {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    
    if (!token || token !== req.csrfToken()) {
      res.status(403).json({ error: 'Invalid CSRF token' });
      return;
    }
    
    next();
  }
}

export default CSRFProtection;