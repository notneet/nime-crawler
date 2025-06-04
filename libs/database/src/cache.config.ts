import { CacheModuleOptions } from '@nestjs/cache-manager';
import { registerAs } from '@nestjs/config';

export default registerAs(
  'cache',
  (): CacheModuleOptions => ({
    store: 'redis',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_CACHE_DB || '1', 10) || 1,
    ttl: parseInt(process.env.CACHE_TTL || '300', 10) || 300, // 5 minutes default
    max: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10) || 1000,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'anime_crawler:',
    // Redis connection options
    socket: {
      connectTimeout: 10000,
      commandTimeout: 5000,
      keepAlive: 30000,
    },
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  }),
);
