import { Request, Response, NextFunction } from 'express';
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
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'))
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
      /('|(\-\-)|(;)|(\|\|)|(\+)|(\*)|(%)|(\?)|(\=)|(\<)|(\>)|(\&)|(\|)|(\^)|(\~)|(\!)|(\$)|(\#)|(\@)|(\[)|(\])/i,
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

export default ValidationMiddleware;