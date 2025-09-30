import { Request, Response, NextFunction } from 'express';

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && (req.user as any).role === role) return next();
    res.status(403).end();
  };
}
