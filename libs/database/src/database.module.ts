import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

// Import all entities from common lib
import { Anime } from '@app/common/entities/core/anime.entity';

// Import configurations
import cacheConfig from './cache.config';
import databaseConfig from './database.config';

// Import services and repositories
import {
  AnimeUpdateHistory,
  CacheEntry,
  CrawlJob,
  CrawlLog,
  DownloadLink,
  Episode,
  Genre,
  QueueJob,
  Source,
  SourceHealth,
} from 'proposed.schema';
import { DatabaseService } from './database.service';
import { RedisService } from './redis.service';
import { AnimeRepository } from './repositories/anime.repository';
import { SourceRepository } from './repositories/source.repository';
import { SourceHealthRepository } from './repositories/source-health.repository';

// Define all entities
const entities = [
  // Core entities
  Anime,
  Source,
  Episode,
  DownloadLink,
  Genre,

  // Crawler entities
  CrawlJob,
  CrawlLog,

  // Monitoring entities
  AnimeUpdateHistory,
  SourceHealth,

  // Queue entities
  QueueJob,

  // Cache entities
  CacheEntry,
];

// Define repositories
const repositories = [
  AnimeRepository,
  SourceRepository,
  SourceHealthRepository,
  // Add more repositories here as you create them
];

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    ConfigModule.forFeature(cacheConfig),

    // TypeORM Configuration
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        configService.get('database') as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),

    // Register entities for dependency injection
    TypeOrmModule.forFeature(entities),

    // Cache Manager Configuration with Redis
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => configService.get('cache'),
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [DatabaseService, RedisService, ...repositories],
  exports: [
    TypeOrmModule,
    CacheModule,
    DatabaseService,
    RedisService,
    ...repositories,
  ],
})
export class DatabaseModule {}
