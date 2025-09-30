import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateRedisSupport(targetRoot, options = {}) {
  const { ts = false, session = true } = options;
  
  // Redis client
  const redisClient = generateRedisClient(ts);
  writeFileSafe(path.join(targetRoot, "src", "cache", "redis.client.js"), redisClient);
  
  // Cache service
  const cacheService = generateCacheService(ts);
  writeFileSafe(path.join(targetRoot, "src", "cache", "cache.service.js"), cacheService);
  
  // Cache middleware
  const cacheMiddleware = generateCacheMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "cache.middleware.js"), cacheMiddleware);
  
  // Redis configuration
  const redisConfig = generateRedisConfig(ts);
  writeFileSafe(path.join(targetRoot, "src", "config", "redis.config.js"), redisConfig);
  
  // Session store (if enabled)
  if (session) {
    const sessionStore = generateSessionStore(ts);
    writeFileSafe(path.join(targetRoot, "src", "cache", "session.store.js"), sessionStore);
  }
  
  // Docker compose for Redis
  const dockerComposeRedis = generateDockerComposeRedis();
  writeFileSafe(path.join(targetRoot, "docker-compose.redis.yml"), dockerComposeRedis);
  
  // Update package.json with Redis dependencies
  updatePackageJsonWithRedis(targetRoot, session);
  
  console.log("🔴 Redis cache integration added successfully!");
}

function generateRedisClient(ts) {
  if (ts) {
    return `import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from '../config/redis.config';

export class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: RedisConfig.url,
      password: RedisConfig.password,
      database: RedisConfig.database,
      retryDelayOnFailover: RedisConfig.retryDelayOnFailover,
      maxRetriesPerRequest: RedisConfig.maxRetriesPerRequest
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('🔴 Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('🔴 Redis client ready');
    });

    this.client.on('error', (err) => {
      console.error('🔴 Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('🔴 Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔴 Redis client reconnecting...');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  // Cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.client.hSet(key, field, serializedValue);
  }

  async hget(key: string, field: string): Promise<any> {
    const value = await this.client.hGet(key, field);
    return value ? JSON.parse(value) : null;
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hDel(key, field);
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    const hash = await this.client.hGetAll(key);
    const result: Record<string, any> = {};
    
    for (const [field, value] of Object.entries(hash)) {
      result[field] = JSON.parse(value);
    }
    
    return result;
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    const serializedValues = values.map(v => JSON.stringify(v));
    return await this.client.lPush(key, ...serializedValues);
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    const serializedValues = values.map(v => JSON.stringify(v));
    return await this.client.rPush(key, ...serializedValues);
  }

  async lpop(key: string): Promise<any> {
    const value = await this.client.lPop(key);
    return value ? JSON.parse(value) : null;
  }

  async rpop(key: string): Promise<any> {
    const value = await this.client.rPop(key);
    return value ? JSON.parse(value) : null;
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    const values = await this.client.lRange(key, start, stop);
    return values.map(v => JSON.parse(v));
  }

  // Set operations
  async sadd(key: string, ...members: any[]): Promise<number> {
    const serializedMembers = members.map(m => JSON.stringify(m));
    return await this.client.sAdd(key, ...serializedMembers);
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    const serializedMembers = members.map(m => JSON.stringify(m));
    return await this.client.sRem(key, ...serializedMembers);
  }

  async smembers(key: string): Promise<any[]> {
    const members = await this.client.sMembers(key);
    return members.map(m => JSON.parse(m));
  }

  async sismember(key: string, member: any): Promise<boolean> {
    const serializedMember = JSON.stringify(member);
    const result = await this.client.sIsMember(key, serializedMember);
    return result === 1;
  }

  // Pattern matching
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  // Flush database
  async flushdb(): Promise<void> {
    await this.client.flushDb();
  }

  // Get info
  async info(): Promise<string> {
    return await this.client.info();
  }

  // Ping
  async ping(): Promise<string> {
    return await this.client.ping();
  }
}

// Singleton instance
export const redisClient = new RedisClient();
export default redisClient;`;
  } else {
    return `const { createClient } = require('redis');
const { RedisConfig } = require('../config/redis.config');

class RedisClient {
  constructor() {
    this.client = createClient({
      url: RedisConfig.url,
      password: RedisConfig.password,
      database: RedisConfig.database,
      retryDelayOnFailover: RedisConfig.retryDelayOnFailover,
      maxRetriesPerRequest: RedisConfig.maxRetriesPerRequest
    });

    this.isConnected = false;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('🔴 Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('🔴 Redis client ready');
    });

    this.client.on('error', (err) => {
      console.error('🔴 Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('🔴 Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔴 Redis client reconnecting...');
    });
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  getClient() {
    return this.client;
  }

  isClientConnected() {
    return this.isConnected;
  }

  // Cache operations
  async set(key, value, ttl) {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key) {
    await this.client.del(key);
  }

  async exists(key) {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key, ttl) {
    await this.client.expire(key, ttl);
  }

  async ttl(key) {
    return await this.client.ttl(key);
  }

  // Hash operations
  async hset(key, field, value) {
    const serializedValue = JSON.stringify(value);
    await this.client.hSet(key, field, serializedValue);
  }

  async hget(key, field) {
    const value = await this.client.hGet(key, field);
    return value ? JSON.parse(value) : null;
  }

  async hdel(key, field) {
    await this.client.hDel(key, field);
  }

  async hgetall(key) {
    const hash = await this.client.hGetAll(key);
    const result = {};
    
    for (const [field, value] of Object.entries(hash)) {
      result[field] = JSON.parse(value);
    }
    
    return result;
  }

  // List operations
  async lpush(key, ...values) {
    const serializedValues = values.map(v => JSON.stringify(v));
    return await this.client.lPush(key, ...serializedValues);
  }

  async rpush(key, ...values) {
    const serializedValues = values.map(v => JSON.stringify(v));
    return await this.client.rPush(key, ...serializedValues);
  }

  async lpop(key) {
    const value = await this.client.lPop(key);
    return value ? JSON.parse(value) : null;
  }

  async rpop(key) {
    const value = await this.client.rPop(key);
    return value ? JSON.parse(value) : null;
  }

  async lrange(key, start, stop) {
    const values = await this.client.lRange(key, start, stop);
    return values.map(v => JSON.parse(v));
  }

  // Set operations
  async sadd(key, ...members) {
    const serializedMembers = members.map(m => JSON.stringify(m));
    return await this.client.sAdd(key, ...serializedMembers);
  }

  async srem(key, ...members) {
    const serializedMembers = members.map(m => JSON.stringify(m));
    return await this.client.sRem(key, ...serializedMembers);
  }

  async smembers(key) {
    const members = await this.client.sMembers(key);
    return members.map(m => JSON.parse(m));
  }

  async sismember(key, member) {
    const serializedMember = JSON.stringify(member);
    const result = await this.client.sIsMember(key, serializedMember);
    return result === 1;
  }

  // Pattern matching
  async keys(pattern) {
    return await this.client.keys(pattern);
  }

  // Flush database
  async flushdb() {
    await this.client.flushDb();
  }

  // Get info
  async info() {
    return await this.client.info();
  }

  // Ping
  async ping() {
    return await this.client.ping();
  }
}

// Singleton instance
const redisClient = new RedisClient();
module.exports = { RedisClient, redisClient };
module.exports.default = redisClient;
`;
  }
}

function generateCacheService(ts) {
  if (ts) {
    return `import { redisClient } from './redis.client';

export class CacheService {
  private defaultTTL: number = 3600; // 1 hour

  constructor(defaultTTL?: number) {
    this.defaultTTL = defaultTTL || this.defaultTTL;
  }

  // Basic cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await redisClient.set(key, value, ttl || this.defaultTTL);
  }

  async get(key: string): Promise<any> {
    return await redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return await redisClient.exists(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await redisClient.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await redisClient.ttl(key);
  }

  // Cache with fallback
  async getOrSet<T>(
    key: string, 
    fallback: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fallback();
    await this.set(key, value, ttl);
    
    return value;
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.invalidatePattern(\`tag:\${tag}:*\`);
    }
  }

  // Cache warming
  async warmCache<T>(
    keys: string[], 
    fallback: (key: string) => Promise<T>
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      const exists = await this.exists(key);
      if (!exists) {
        const value = await fallback(key);
        await this.set(key, value);
      }
    });

    await Promise.all(promises);
  }

  // Cache statistics
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    const info = await redisClient.info();
    const lines = info.split('\\n');
    
    let totalKeys = 0;
    let memoryUsage = '0B';
    let hitRate = 0;

    for (const line of lines) {
      if (line.startsWith('db0:keys=')) {
        totalKeys = parseInt(line.split('=')[1]);
      } else if (line.startsWith('used_memory_human:')) {
        memoryUsage = line.split(':')[1];
      } else if (line.startsWith('keyspace_hits:')) {
        const hits = parseInt(line.split(':')[1]);
        const misses = parseInt(lines.find(l => l.startsWith('keyspace_misses:'))?.split(':')[1] || '0');
        hitRate = hits / (hits + misses) * 100;
      }
    }

    return {
      totalKeys,
      memoryUsage,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  // Cache health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      await redisClient.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message
      };
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;`;
  } else {
    return `const { redisClient } = require('./redis.client');

class CacheService {
  constructor(defaultTTL = 3600) {
    this.defaultTTL = defaultTTL; // 1 hour
  }

  // Basic cache operations
  async set(key, value, ttl) {
    await redisClient.set(key, value, ttl || this.defaultTTL);
  }

  async get(key) {
    return await redisClient.get(key);
  }

  async del(key) {
    await redisClient.del(key);
  }

  async exists(key) {
    return await redisClient.exists(key);
  }

  async expire(key, ttl) {
    await redisClient.expire(key, ttl);
  }

  async ttl(key) {
    return await redisClient.ttl(key);
  }

  // Cache with fallback
  async getOrSet(key, fallback, ttl) {
    const cached = await this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fallback();
    await this.set(key, value, ttl);
    
    return value;
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern) {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  }

  async invalidateByTags(tags) {
    for (const tag of tags) {
      await this.invalidatePattern(\`tag:\${tag}:*\`);
    }
  }

  // Cache warming
  async warmCache(keys, fallback) {
    const promises = keys.map(async (key) => {
      const exists = await this.exists(key);
      if (!exists) {
        const value = await fallback(key);
        await this.set(key, value);
      }
    });

    await Promise.all(promises);
  }

  // Cache statistics
  async getStats() {
    const info = await redisClient.info();
    const lines = info.split('\\n');
    
    let totalKeys = 0;
    let memoryUsage = '0B';
    let hitRate = 0;

    for (const line of lines) {
      if (line.startsWith('db0:keys=')) {
        totalKeys = parseInt(line.split('=')[1]);
      } else if (line.startsWith('used_memory_human:')) {
        memoryUsage = line.split(':')[1];
      } else if (line.startsWith('keyspace_hits:')) {
        const hits = parseInt(line.split(':')[1]);
        const misses = parseInt(lines.find(l => l.startsWith('keyspace_misses:'))?.split(':')[1] || '0');
        hitRate = hits / (hits + misses) * 100;
      }
    }

    return {
      totalKeys,
      memoryUsage,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  // Cache health check
  async healthCheck() {
    const start = Date.now();
    
    try {
      await redisClient.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message
      };
    }
  }
}

const cacheService = new CacheService();
module.exports = { CacheService, cacheService };
module.exports.default = cacheService;
`;
  }
}

function generateCacheMiddleware(ts) {
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../cache/cache.service';

export function cacheMiddleware(ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = \`cache:\${req.originalUrl}\`;
    
    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      
      if (cached !== null) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(body: any) {
        // Cache the response
        cacheService.set(cacheKey, body, ttl).catch(err => {
          console.error('Cache set error:', err);
        });
        
        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

export function cacheInvalidationMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to invalidate cache
    res.json = function(body: any) {
      // Invalidate cache patterns
      patterns.forEach(pattern => {
        cacheService.invalidatePattern(pattern).catch(err => {
          console.error('Cache invalidation error:', err);
        });
      });
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
}

export function cacheStatsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/cache/stats') {
    cacheService.getStats()
      .then(stats => res.json(stats))
      .catch(error => res.status(500).json({ error: error.message }));
  } else {
    next();
  }
}`;
  } else {
    return `const { cacheService } = require('../cache/cache.service');

function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = \`cache:\${req.originalUrl}\`;
    
    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      
      if (cached !== null) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(body) {
        // Cache the response
        cacheService.set(cacheKey, body, ttl).catch(err => {
          console.error('Cache set error:', err);
        });
        
        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

function cacheInvalidationMiddleware(patterns) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to invalidate cache
    res.json = function(body) {
      // Invalidate cache patterns
      patterns.forEach(pattern => {
        cacheService.invalidatePattern(pattern).catch(err => {
          console.error('Cache invalidation error:', err);
        });
      });
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
}

function cacheStatsMiddleware(req, res, next) {
  if (req.path === '/cache/stats') {
    cacheService.getStats()
      .then(stats => res.json(stats))
      .catch(error => res.status(500).json({ error: error.message }));
  } else {
    next();
  }
}

module.exports = {
  cacheMiddleware,
  cacheInvalidationMiddleware,
  cacheStatsMiddleware
};
`;
  }
}

function generateRedisConfig(ts) {
  if (ts) {
    return `export const RedisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DATABASE || '0'),
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  
  // Connection options
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
  lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
  
  // Session store options
  session: {
    ttl: parseInt(process.env.SESSION_TTL || '86400'), // 24 hours
    prefix: process.env.SESSION_PREFIX || 'sess:',
    disableTTL: process.env.SESSION_DISABLE_TTL === 'true'
  },
  
  // Cache options
  cache: {
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'), // 1 hour
    prefix: process.env.CACHE_PREFIX || 'cache:',
    maxMemory: process.env.REDIS_MAX_MEMORY || '256mb'
  }
};`;
  } else {
    return `const RedisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DATABASE || '0'),
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  
  // Connection options
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
  lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
  
  // Session store options
  session: {
    ttl: parseInt(process.env.SESSION_TTL || '86400'), // 24 hours
    prefix: process.env.SESSION_PREFIX || 'sess:',
    disableTTL: process.env.SESSION_DISABLE_TTL === 'true'
  },
  
  // Cache options
  cache: {
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'), // 1 hour
    prefix: process.env.CACHE_PREFIX || 'cache:',
    maxMemory: process.env.REDIS_MAX_MEMORY || '256mb'
  }
};

module.exports = { RedisConfig };
`;
  }
}

function generateSessionStore(ts) {
  if (ts) {
    return `import session from 'express-session';
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

export default createSessionStore;`;
  } else {
    return `const session = require('express-session');
const RedisStore = require('connect-redis');
const { redisClient } = require('./redis.client');
const { RedisConfig } = require('../config/redis.config');

function createSessionStore() {
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

module.exports = { createSessionStore };
module.exports.default = createSessionStore;
`;
  }
}

function generateDockerComposeRedis() {
  return `version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    environment:
      - REDIS_PASSWORD=${process.env.REDIS_PASSWORD || ''}
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: redis-commander
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379
      - HTTP_USER=${process.env.REDIS_COMMANDER_USER || 'admin'}
      - HTTP_PASSWORD=${process.env.REDIS_COMMANDER_PASSWORD || 'admin'}
    networks:
      - app-network
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis_data:

networks:
  app-network:
    driver: bridge`;
}

function updatePackageJsonWithRedis(targetRoot, session) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["redis"] = "^4.6.0";
    pkg.dependencies["ioredis"] = "^5.3.0";
    
    if (session) {
      pkg.dependencies["connect-redis"] = "^7.1.0";
    }
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with Redis dependencies:", error);
  }
}
