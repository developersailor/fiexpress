import { redisClient } from './redis.client';

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
      await this.invalidatePattern(`tag:${tag}:*`);
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
    const lines = info.split('\n');
    
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
export default cacheService;