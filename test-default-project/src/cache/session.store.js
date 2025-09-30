import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './redis.client';
import { RedisConfig } from '../config/redis.config';

export function createSessionStore() {
  return session({
    store: new RedisStore({
      client: redisClient.getClient(),
      prefix: RedisConfig.session.prefix,
      ttl: RedisConfig.session.ttl,
      disableTTL: RedisConfig.session.disableTTL
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: RedisConfig.session.ttl * 1000
    }
  });
}

export default createSessionStore;