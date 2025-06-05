/**
 * Interface for cache service
 */
export interface ICacheService {
  /**
   * Get value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete value from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple keys from cache
   */
  deleteMany(keys: string[]): Promise<number>;

  /**
   * Check if key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get cache keys by pattern
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Clear entire cache
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<ICacheStats>;

  /**
   * Get TTL for a key
   */
  getTtl(key: string): Promise<number>;

  /**
   * Set TTL for a key
   */
  setTtl(key: string, ttl: number): Promise<boolean>;
}

/**
 * Interface for cache statistics
 */
export interface ICacheStats {
  totalKeys: number;
  usedMemory: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
}

/**
 * Interface for cache configuration
 */
export interface ICacheConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
  defaultTtl?: number;
  maxMemoryPolicy?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

/**
 * Interface for cache entry
 */
export interface ICacheEntry<T> {
  key: string;
  value: T;
  ttl?: number;
  createdAt: Date;
  expiresAt?: Date;
  hitCount?: number;
}
