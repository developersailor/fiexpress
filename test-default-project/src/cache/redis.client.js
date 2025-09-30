import { createClient, RedisClientType } from 'redis';
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
export default redisClient;