// JWT auth helper
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'change-me';

export function sign(payload: any): string {
  return jwt.sign(payload, secret);
}

export function verify(token: string): any {
  return jwt.verify(token, secret);
}
