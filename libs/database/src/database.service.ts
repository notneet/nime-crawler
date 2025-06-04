import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisService } from './redis.service';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing database module...');

    try {
      // Check database connection
      if (!this.dataSource.isInitialized) {
        this.logger.log('Initializing database connection...');
        await this.dataSource.initialize();
      }

      if (this.dataSource.isInitialized) {
        this.logger.log('Database connection established successfully');
      } else {
        this.logger.error(
          'Database connection failed - DataSource not initialized',
        );
        throw new Error('Database connection failed');
      }

      // Check Redis connection
      try {
        const stats = await this.redisService.getStats();
        this.logger.log(
          `Redis connected - Keys: ${stats.keys}, Memory: ${stats.memory}`,
        );
      } catch (error) {
        this.logger.error('Redis connection check failed:', error);
        // Don't throw here, as Redis is optional for caching
      }

      // Run migrations in production
      if (this.configService.get('NODE_ENV') === 'production') {
        await this.runMigrations();
      }
    } catch (error) {
      this.logger.error('Failed to initialize database module:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    try {
      const migrations = await this.dataSource.runMigrations();
      if (migrations.length > 0) {
        this.logger.log(
          `Executed ${migrations.length} migrations successfully`,
        );
      } else {
        this.logger.log('No pending migrations to execute');
      }
    } catch (error) {
      this.logger.error('Migration execution failed:', error);
      throw error;
    }
  }

  /**
   * Revert last migration
   */
  async revertMigration(): Promise<void> {
    try {
      await this.dataSource.undoLastMigration();
      this.logger.log('Last migration reverted successfully');
    } catch (error) {
      this.logger.error('Migration revert failed:', error);
      throw error;
    }
  }

  /**
   * Get database connection status
   */
  async getConnectionStatus(): Promise<{
    database: boolean;
    redis: boolean;
  }> {
    const database = this.dataSource.isInitialized;

    let redis = false;
    try {
      await this.redisService.getStats();
      redis = true;
    } catch (error) {
      redis = false;
    }

    return { database, redis };
  }

  /**
   * Get database and cache statistics
   */
  async getStats(): Promise<{
    database: {
      isConnected: boolean;
      driver: string;
      database: string;
    };
    cache: {
      keys: number;
      memory: string;
      hits: number;
      misses: number;
      hitRate: number;
    };
  }> {
    const dbOptions = this.dataSource.options;
    const cacheStats = await this.redisService.getStats();

    return {
      database: {
        isConnected: this.dataSource.isInitialized,
        driver: dbOptions.type,
        database: (dbOptions as any).database,
      },
      cache: cacheStats,
    };
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    try {
      await this.redisService.reset();
      this.logger.log('All caches cleared successfully');
    } catch (error) {
      this.logger.error('Cache clear failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async closeConnection(): Promise<void> {
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        this.logger.log('Database connection closed');
      }
    } catch (error) {
      this.logger.error('Database connection close failed:', error);
      throw error;
    }
  }

  /**
   * Get TypeORM DataSource instance
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Get Redis service instance
   */
  getRedisService(): RedisService {
    return this.redisService;
  }
}
