export const RedisConfig = {
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