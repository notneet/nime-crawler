import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
}

export interface CacheKeyOptions {
  prefix?: string;
  suffix?: string;
  namespace?: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;
  private readonly keyPrefix: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // Initialize direct Redis client for advanced operations
    const redisConfig = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    this.redis = new Redis(redisConfig);
    this.keyPrefix = this.configService.get(
      'REDIS_KEY_PREFIX',
      'anime_crawler:',
    );

    // Redis event listeners
    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  // ============= BASIC CACHE OPERATIONS =============

  /**
   * Get value from cache using cache-manager
   */
  async get<T>(key: string, options?: CacheKeyOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options);
      const result = await this.cacheManager.get<T>(fullKey);
      return result || null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache using cache-manager
   */
  async set(
    key: string,
    value: any,
    options?: CacheOptions & CacheKeyOptions,
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options);
      const ttl =
        (options?.ttl ?? this.configService.get<number>('CACHE_TTL', 300)) *
        1000;
      await this.cacheManager.set(fullKey, value, ttl);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete single key from cache
   */
  async del(key: string, options?: CacheKeyOptions): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options);
      await this.cacheManager.del(fullKey);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      this.logger.error('Cache reset error:', error);
    }
  }

  /**
   * Wrap function with cache using cache-manager
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions & CacheKeyOptions,
  ): Promise<T> {
    try {
      const fullKey = this.buildKey(key, options);
      const ttl =
        (options?.ttl ?? this.configService.get<number>('CACHE_TTL', 300)) *
        1000;
      return await this.cacheManager.wrap(fullKey, fn, ttl);
    } catch (error) {
      this.logger.error(`Cache wrap error for key ${key}:`, error);
      // Fallback to direct function call
      return await fn();
    }
  }

  // ============= ADVANCED REDIS OPERATIONS =============

  /**
   * Delete keys by pattern using direct Redis client
   */
  async delPattern(
    pattern: string,
    options?: CacheKeyOptions,
  ): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, options);
      const keys = await this.redis.keys(fullPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(
          `Deleted ${keys.length} keys matching pattern: ${fullPattern}`,
        );
        return keys.length;
      }
      return 0;
    } catch (error) {
      this.logger.error(
        `Cache delete pattern error for pattern ${pattern}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheKeyOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string, options?: CacheKeyOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment numeric value
   */
  async increment(
    key: string,
    value: number = 1,
    options?: CacheKeyOptions,
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options);
      return await this.redis.incrby(fullKey, value);
    } catch (error) {
      this.logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement numeric value
   */
  async decrement(
    key: string,
    value: number = 1,
    options?: CacheKeyOptions,
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options);
      return await this.redis.decrby(fullKey, value);
    } catch (error) {
      this.logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  // ============= HASH OPERATIONS =============

  /**
   * Set hash field
   */
  async hset(
    key: string,
    field: string,
    value: any,
    options?: CacheKeyOptions,
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options);
      await this.redis.hset(fullKey, field, JSON.stringify(value));
    } catch (error) {
      this.logger.error(
        `Cache hset error for key ${key}, field ${field}:`,
        error,
      );
    }
  }

  /**
   * Get hash field
   */
  async hget<T>(
    key: string,
    field: string,
    options?: CacheKeyOptions,
  ): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options);
      const data = await this.redis.hget(fullKey, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(
        `Cache hget error for key ${key}, field ${field}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall<T>(
    key: string,
    options?: CacheKeyOptions,
  ): Promise<Record<string, T>> {
    try {
      const fullKey = this.buildKey(key, options);
      const data = await this.redis.hgetall(fullKey);
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      this.logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  /**
   * Delete hash field
   */
  async hdel(
    key: string,
    field: string,
    options?: CacheKeyOptions,
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options);
      await this.redis.hdel(fullKey, field);
    } catch (error) {
      this.logger.error(
        `Cache hdel error for key ${key}, field ${field}:`,
        error,
      );
    }
  }

  // ============= LIST OPERATIONS =============

  /**
   * Push to list (left)
   */
  async lpush(
    key: string,
    values: any[],
    options?: CacheKeyOptions,
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options);
      const stringValues = values.map((v) => JSON.stringify(v));
      return await this.redis.lpush(fullKey, ...stringValues);
    } catch (error) {
      this.logger.error(`Cache lpush error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Pop from list (left)
   */
  async lpop<T>(key: string, options?: CacheKeyOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options);
      const data = await this.redis.lpop(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Cache lpop error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get list range
   */
  async lrange<T>(
    key: string,
    start: number = 0,
    stop: number = -1,
    options?: CacheKeyOptions,
  ): Promise<T[]> {
    try {
      const fullKey = this.buildKey(key, options);
      const data = await this.redis.lrange(fullKey, start, stop);
      return data.map((item) => JSON.parse(item));
    } catch (error) {
      this.logger.error(`Cache lrange error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Get list length
   */
  async llen(key: string, options?: CacheKeyOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options);
      return await this.redis.llen(fullKey);
    } catch (error) {
      this.logger.error(`Cache llen error for key ${key}:`, error);
      return 0;
    }
  }

  // ============= SET OPERATIONS =============

  /**
   * Add to set
   */
  async sadd(
    key: string,
    values: any[],
    options?: CacheKeyOptions,
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options);
      const stringValues = values.map((v) => JSON.stringify(v));
      return await this.redis.sadd(fullKey, ...stringValues);
    } catch (error) {
      this.logger.error(`Cache sadd error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get all set members
   */
  async smembers<T>(key: string, options?: CacheKeyOptions): Promise<T[]> {
    try {
      const fullKey = this.buildKey(key, options);
      const data = await this.redis.smembers(fullKey);
      return data.map((item) => JSON.parse(item));
    } catch (error) {
      this.logger.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Check if value is in set
   */
  async sismember(
    key: string,
    value: any,
    options?: CacheKeyOptions,
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options);
      const result = await this.redis.sismember(fullKey, JSON.stringify(value));
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache sismember error for key ${key}:`, error);
      return false;
    }
  }

  // ============= UTILITY METHODS =============

  /**
   * Build cache key with options
   */
  private buildKey(key: string, options?: CacheKeyOptions): string {
    let fullKey = key;

    if (options?.namespace) {
      fullKey = `${options.namespace}:${fullKey}`;
    }

    if (options?.prefix) {
      fullKey = `${options.prefix}${fullKey}`;
    }

    if (options?.suffix) {
      fullKey = `${fullKey}${options.suffix}`;
    }

    return fullKey;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const memory = await this.redis.info('memory');
      const dbsize = await this.redis.dbsize();

      const hits = parseInt(this.parseInfoValue(info, 'keyspace_hits')) || 0;
      const misses =
        parseInt(this.parseInfoValue(info, 'keyspace_misses')) || 0;
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      return {
        keys: dbsize,
        memory: this.parseInfoValue(memory, 'used_memory_human'),
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return { keys: 0, memory: '0B', hits: 0, misses: 0, hitRate: 0 };
    }
  }

  /**
   * Parse Redis INFO response
   */
  private parseInfoValue(info: string, key: string): string {
    const lines = info.split('\r\n');
    const line = lines.find((l) => l.startsWith(`${key}:`));
    return line ? line.split(':')[1] : '0';
  }

  /**
   * Get Redis client for advanced operations
   */
  getRedisClient(): Redis {
    return this.redis;
  }

  /**
   * Get cache manager instance
   */
  getCacheManager(): Cache {
    return this.cacheManager;
  }

  onModuleDestroy() {
    this.redis.disconnect();
    this.logger.log('Redis connection closed');
  }
}
