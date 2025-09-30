import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateAdvancedSecuritySupport(targetRoot, options = {}) {
  const { ts = false, tools = ['helmet', 'csrf', 'validation', 'rate-limit'] } = options;
  
  // Security configuration
  const securityConfig = generateSecurityConfig(ts, tools);
  writeFileSafe(path.join(targetRoot, "src", "config", "security.config.js"), securityConfig);
  
  // Security middleware
  const securityMiddleware = generateSecurityMiddleware(ts, tools);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "security.middleware.js"), securityMiddleware);
  
  // Input validation
  const validationMiddleware = generateValidationMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "validation.middleware.js"), validationMiddleware);
  
  // Security headers
  const securityHeaders = generateSecurityHeaders(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "headers.middleware.js"), securityHeaders);
  
  // CSRF protection
  const csrfProtection = generateCSRFProtection(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "csrf.middleware.js"), csrfProtection);
  
  // Security utilities
  const securityUtils = generateSecurityUtils(ts);
  writeFileSafe(path.join(targetRoot, "src", "utils", "security.utils.js"), securityUtils);
  
  // Security tests
  const securityTests = generateSecurityTests(ts);
  writeFileSafe(path.join(targetRoot, "tests", "security.test.js"), securityTests);
  
  // Update package.json with security dependencies
  updatePackageJsonWithSecurity(targetRoot, tools);
  
  console.log(`🔒 Advanced security support (${tools.join(', ')}) added successfully!`);
}

function generateSecurityConfig(ts) {
  const config = {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    csrf: {
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      },
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    },
    validation: {
      sanitize: true,
      escapeHtml: true,
      trimWhitespace: true,
      removeNullBytes: true
    }
  };
  
  if (ts) {
    return `export const securityConfig = {
  // Helmet.js configuration
  helmet: ${JSON.stringify(config.helmet, null, 2)},
  
  // CSRF protection
  csrf: ${JSON.stringify(config.csrf, null, 2)},
  
  // Rate limiting
  rateLimit: ${JSON.stringify(config.rateLimit, null, 2)},
  
  // Input validation
  validation: ${JSON.stringify(config.validation, null, 2)},
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },
  
  // OWASP compliance
  owasp: {
    enabled: true,
    rules: [
      'A01:2021 – Broken Access Control',
      'A02:2021 – Cryptographic Failures',
      'A03:2021 – Injection',
      'A04:2021 – Insecure Design',
      'A05:2021 – Security Misconfiguration',
      'A06:2021 – Vulnerable and Outdated Components',
      'A07:2021 – Identification and Authentication Failures',
      'A08:2021 – Software and Data Integrity Failures',
      'A09:2021 – Security Logging and Monitoring Failures',
      'A10:2021 – Server-Side Request Forgery'
    ]
  }
};

export default securityConfig;`;
  } else {
    return `const securityConfig = {
  // Helmet.js configuration
  helmet: ${JSON.stringify(config.helmet, null, 2)},
  
  // CSRF protection
  csrf: ${JSON.stringify(config.csrf, null, 2)},
  
  // Rate limiting
  rateLimit: ${JSON.stringify(config.rateLimit, null, 2)},
  
  // Input validation
  validation: ${JSON.stringify(config.validation, null, 2)},
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },
  
  // OWASP compliance
  owasp: {
    enabled: true,
    rules: [
      'A01:2021 – Broken Access Control',
      'A02:2021 – Cryptographic Failures',
      'A03:2021 – Injection',
      'A04:2021 – Insecure Design',
      'A05:2021 – Security Misconfiguration',
      'A06:2021 – Vulnerable and Outdated Components',
      'A07:2021 – Identification and Authentication Failures',
      'A08:2021 – Software and Data Integrity Failures',
      'A09:2021 – Security Logging and Monitoring Failures',
      'A10:2021 – Server-Side Request Forgery'
    ]
  }
};

module.exports = { securityConfig };
module.exports.default = securityConfig;
`;
  }
}

function generateSecurityMiddleware(ts) {
  if (ts) {
    return `import helmet from 'helmet';
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
      sanitized = sanitized.replace(/\\0/g, '');
    }
    
    if (securityConfig.validation.escapeHtml) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\\//g, '&#x2F;');
    }
    
    return sanitized;
  }
}

export default SecurityMiddleware;`;
  } else {
    return `const helmet = require('helmet');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const { securityConfig } = require('../config/security.config');

class SecurityMiddleware {
  constructor() {
    this.setupHelmet();
    this.setupCSRF();
    this.setupRateLimit();
  }
  
  setupHelmet() {
    this.helmetMiddleware = helmet(securityConfig.helmet);
  }
  
  setupCSRF() {
    if (securityConfig.csrf) {
      this.csrfMiddleware = csrf(securityConfig.csrf);
    }
  }
  
  setupRateLimit() {
    this.rateLimitMiddleware = rateLimit(securityConfig.rateLimit);
  }
  
  // Apply all security middleware
  applyAll(app) {
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
  securityHeaders(req, res, next) {
    // Apply custom security headers
    Object.entries(securityConfig.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  }
  
  // Request sanitization
  sanitizeRequest(req, res, next) {
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
  
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
  
  sanitizeString(str) {
    let sanitized = str;
    
    if (securityConfig.validation.trimWhitespace) {
      sanitized = sanitized.trim();
    }
    
    if (securityConfig.validation.removeNullBytes) {
      sanitized = sanitized.replace(/\\0/g, '');
    }
    
    if (securityConfig.validation.escapeHtml) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\\//g, '&#x2F;');
    }
    
    return sanitized;
  }
}

module.exports = { SecurityMiddleware };
module.exports.default = SecurityMiddleware;
`;
  }
}

function generateValidationMiddleware(ts) {
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export class ValidationMiddleware {
  // Email validation
  validateEmail(req: Request, res: Response, next: NextFunction): void {
    const emailSchema = Joi.string().email().required();
    const { error } = emailSchema.validate(req.body.email);
    
    if (error) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }
    next();
  }
  
  // Password validation
  validatePassword(req: Request, res: Response, next: NextFunction): void {
    const passwordSchema = Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required();
    
    const { error } = passwordSchema.validate(req.body.password);
    
    if (error) {
      res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
      });
      return;
    }
    next();
  }
  
  // Generic validation middleware
  validate(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.body);
      
      if (error) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
        return;
      }
      next();
    };
  }
  
  // SQL injection protection
  preventSQLInjection(req: Request, res: Response, next: NextFunction): void {
    const sqlPatterns = [
      /('|(\\-\\-)|(;)|(\\|\\|)|(\\+)|(\\*)|(%)|(\\?)|(\\=)|(\\<)|(\\>)|(\\&)|(\\|)|(\\^)|(\\~)|(\\!)|(\\$)|(\\#)|(\\@)|(\\[)|(\\])/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i
    ];
    
    const checkObject = (obj: any): boolean => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          if (checkObject(value)) {
            return true;
          }
        }
      }
      return false;
    };
    
    if (checkObject(req.body) || checkObject(req.query)) {
      res.status(400).json({ error: 'Potential security threat detected' });
      return;
    }
    
    next();
  }
}

export default ValidationMiddleware;`;
  } else {
    return `const Joi = require('joi');

class ValidationMiddleware {
  // Email validation
  validateEmail(req, res, next) {
    const emailSchema = Joi.string().email().required();
    const { error } = emailSchema.validate(req.body.email);
    
    if (error) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }
    next();
  }
  
  // Password validation
  validatePassword(req, res, next) {
    const passwordSchema = Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\\\d)(?=.*[@$!%*?&])[A-Za-z\\\\d@$!%*?&]'))
      .required();
    
    const { error } = passwordSchema.validate(req.body.password);
    
    if (error) {
      res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
      });
      return;
    }
    next();
  }
  
  // Generic validation middleware
  validate(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      
      if (error) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
        return;
      }
      next();
    };
  }
  
  // SQL injection protection
  preventSQLInjection(req, res, next) {
    const sqlPatterns = [
      /('|(\\\\-\\\\-)|(;)|(\\\\|\\\\|)|(\\+)|(\\*)|(%)|(\\?)|(\\=)|(\\<)|(\\>)|(\\&)|(\\|)|(\\^)|(\\~)|(\\!)|(\\$)|(\\#)|(\\@)|(\\[)|(\\])/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i
    ];
    
    const checkObject = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          if (checkObject(value)) {
            return true;
          }
        }
      }
      return false;
    };
    
    if (checkObject(req.body) || checkObject(req.query)) {
      res.status(400).json({ error: 'Potential security threat detected' });
      return;
    }
    
    next();
  }
}

module.exports = { ValidationMiddleware };
module.exports.default = ValidationMiddleware;
`;
  }
}

function generateSecurityHeaders(ts) {
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';
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

export default SecurityHeaders;`;
  } else {
    return `const { securityConfig } = require('../config/security.config');

class SecurityHeaders {
  // Apply security headers
  static apply(req, res, next) {
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
  static removeServerInfo(req, res, next) {
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    next();
  }
}

module.exports = { SecurityHeaders };
module.exports.default = SecurityHeaders;
`;
  }
}

function generateCSRFProtection(ts) {
  if (ts) {
    return `import csrf from 'csurf';
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

export default CSRFProtection;`;
  } else {
    return `const csrf = require('csurf');
const { securityConfig } = require('../config/security.config');

class CSRFProtection {
  constructor() {
    this.csrfMiddleware = csrf(securityConfig.csrf);
  }
  
  // CSRF protection middleware
  protect(req, res, next) {
    this.csrfMiddleware(req, res, next);
  }
  
  // Generate CSRF token
  generateToken(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
  }
  
  // Verify CSRF token
  verifyToken(req, res, next) {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    
    if (!token || token !== req.csrfToken()) {
      res.status(403).json({ error: 'Invalid CSRF token' });
      return;
    }
    
    next();
  }
}

module.exports = { CSRFProtection };
module.exports.default = CSRFProtection;
`;
  }
}

function generateSecurityUtils(ts) {
  if (ts) {
    return `import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class SecurityUtils {
  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
  
  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
  
  // Generate secure session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Encrypt sensitive data
  static encrypt(text: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt sensitive data
  static decrypt(encryptedText: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Validate password strength
  static validatePasswordStrength(password: string): { valid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');
    
    if (/\\d/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');
    
    return {
      valid: score >= 4,
      score,
      feedback
    };
  }
}

export default SecurityUtils;`;
  } else {
    return `const crypto = require('crypto');
const bcrypt = require('bcrypt');

class SecurityUtils {
  // Generate secure random string
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
  
  // Verify password
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
  
  // Generate secure session ID
  static generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Encrypt sensitive data
  static encrypt(text, key) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt sensitive data
  static decrypt(encryptedText, key) {
    const algorithm = 'aes-256-gcm';
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Validate password strength
  static validatePasswordStrength(password) {
    const feedback = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');
    
    if (/\\d/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');
    
    return {
      valid: score >= 4,
      score,
      feedback
    };
  }
}

module.exports = { SecurityUtils };
module.exports.default = SecurityUtils;
`;
  }
}

function generateSecurityTests(ts) {
  if (ts) {
    return `import request from 'supertest';
import { app } from '../src/app';
import { SecurityMiddleware } from '../src/middleware/security.middleware';

describe('Security Tests', () => {
  let securityMiddleware: SecurityMiddleware;
  
  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware();
  });
  
  describe('Helmet Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
  
  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'Test User' })
        .expect(403);
    });
    
    it('should accept requests with valid CSRF token', async () => {
      const csrfResponse = await request(app)
        .get('/csrf-token')
        .expect(200);
      
      const csrfToken = csrfResponse.body.csrfToken;
      
      await request(app)
        .post('/api/users')
        .set('X-CSRF-Token', csrfToken)
        .send({ name: 'Test User' })
        .expect(200);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should limit requests per IP', async () => {
      const promises = Array(101).fill().map(() => 
        request(app).get('/api/test')
      );
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
  
  describe('Input Validation', () => {
    it('should sanitize malicious input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/test')
        .send({ input: maliciousInput })
        .expect(200);
      
      expect(response.body.input).not.toContain('<script>');
    });
    
    it('should prevent SQL injection', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      await request(app)
        .post('/api/test')
        .send({ query: sqlInjection })
        .expect(400);
    });
  });
  
  describe('Password Security', () => {
    it('should validate password strength', () => {
      const weakPassword = '123';
      const strongPassword = 'MyStr0ng!Pass';
      
      const weakResult = SecurityUtils.validatePasswordStrength(weakPassword);
      const strongResult = SecurityUtils.validatePasswordStrength(strongPassword);
      
      expect(weakResult.valid).toBe(false);
      expect(strongResult.valid).toBe(true);
    });
  });
});

export default SecurityTests;`;
  } else {
    return `const request = require('supertest');
const { app } = require('../src/app');
const { SecurityMiddleware } = require('../src/middleware/security.middleware');

describe('Security Tests', () => {
  let securityMiddleware;
  
  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware();
  });
  
  describe('Helmet Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
  
  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'Test User' })
        .expect(403);
    });
    
    it('should accept requests with valid CSRF token', async () => {
      const csrfResponse = await request(app)
        .get('/csrf-token')
        .expect(200);
      
      const csrfToken = csrfResponse.body.csrfToken;
      
      await request(app)
        .post('/api/users')
        .set('X-CSRF-Token', csrfToken)
        .send({ name: 'Test User' })
        .expect(200);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should limit requests per IP', async () => {
      const promises = Array(101).fill().map(() => 
        request(app).get('/api/test')
      );
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
  
  describe('Input Validation', () => {
    it('should sanitize malicious input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/test')
        .send({ input: maliciousInput })
        .expect(200);
      
      expect(response.body.input).not.toContain('<script>');
    });
    
    it('should prevent SQL injection', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      await request(app)
        .post('/api/test')
        .send({ query: sqlInjection })
        .expect(400);
    });
  });
  
  describe('Password Security', () => {
    it('should validate password strength', () => {
      const weakPassword = '123';
      const strongPassword = 'MyStr0ng!Pass';
      
      const weakResult = SecurityUtils.validatePasswordStrength(weakPassword);
      const strongResult = SecurityUtils.validatePasswordStrength(strongPassword);
      
      expect(weakResult.valid).toBe(false);
      expect(strongResult.valid).toBe(true);
    });
  });
});

module.exports = SecurityTests;
`;
  }
}

function updatePackageJsonWithSecurity(targetRoot) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};
    
    // Add security dependencies
    const securityDependencies = {
      helmet: '^7.1.0',
      csurf: '^1.11.0',
      'express-rate-limit': '^7.1.5',
      joi: '^17.11.0',
      bcrypt: '^5.1.1',
      'express-validator': '^7.0.1',
      'helmet-csp': '^2.9.0'
    };
    
    // Add testing dependencies
    const testDependencies = {
      'supertest': '^6.3.3',
      'jest': '^29.7.0'
    };
    
    Object.assign(pkg.dependencies, securityDependencies);
    Object.assign(pkg.devDependencies, testDependencies);
    
    // Add security scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['test:security'] = 'jest tests/security.test.js';
    pkg.scripts['security:audit'] = 'npm audit';
    pkg.scripts['security:fix'] = 'npm audit fix';
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with security dependencies:", error);
  }
}
