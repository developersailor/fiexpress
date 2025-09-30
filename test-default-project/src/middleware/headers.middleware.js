import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/security.config';

export class SecurityHeaders {
  // Apply security headers
  static apply(req: Request, res: Response, next: NextFunction): void {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions-Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Strict-Transport-Security (HTTPS only)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  }
  
  // Remove server information
  static removeServerInfo(req: Request, res: Response, next: NextFunction): void {
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    next();
  }
}

export default SecurityHeaders;