import helmet from 'helmet';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/security.config';

export class SecurityMiddleware {
  private helmetMiddleware: any;
  private csrfMiddleware: any;
  private rateLimitMiddleware: any;
  
  constructor() {
    this.setupHelmet();
    this.setupCSRF();
    this.setupRateLimit();
  }
  
  private setupHelmet(): void {
    this.helmetMiddleware = helmet(securityConfig.helmet);
  }
  
  private setupCSRF(): void {
    if (securityConfig.csrf) {
      this.csrfMiddleware = csrf(securityConfig.csrf);
    }
  }
  
  private setupRateLimit(): void {
    this.rateLimitMiddleware = rateLimit(securityConfig.rateLimit);
  }
  
  // Apply all security middleware
  applyAll(app: any): void {
    app.use(this.helmetMiddleware);
    app.use(this.rateLimitMiddleware);
    
    if (this.csrfMiddleware) {
      app.use(this.csrfMiddleware);
    }
  }
  
  // Individual middleware getters
  getHelmet() {
    return this.helmetMiddleware;
  }
  
  getCSRF() {
    return this.csrfMiddleware;
  }
  
  getRateLimit() {
    return this.rateLimitMiddleware;
  }
  
  // Custom security middleware
  securityHeaders(req: Request, res: Response, next: NextFunction): void {
    // Apply custom security headers
    Object.entries(securityConfig.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  }
  
  // Request sanitization
  sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
    if (securityConfig.validation.sanitize) {
      // Sanitize request body
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }
      
      // Sanitize query parameters
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }
    }
    next();
  }
  
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
  
  private sanitizeString(str: string): string {
    let sanitized = str;
    
    if (securityConfig.validation.trimWhitespace) {
      sanitized = sanitized.trim();
    }
    
    if (securityConfig.validation.removeNullBytes) {
      sanitized = sanitized.replace(/\0/g, '');
    }
    
    if (securityConfig.validation.escapeHtml) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    return sanitized;
  }
}

export default SecurityMiddleware;