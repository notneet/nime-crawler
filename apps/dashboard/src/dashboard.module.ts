import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import type { Database } from 'better-sqlite3';
import {
  Anime,
  Genre,
  AnimeGenre,
  Episode,
  Mirror,
  DownloadLink,
  Adapter,
} from '@libs/commons/entities';
import { buildRabbitConfig } from '@libs/commons/rabbit/rabbit.config';
import { EngineModule } from '@libs/commons';
import { AdapterService } from '@libs/commons/adapters/adapter.service';
import { BasicAuthMiddleware } from './auth/basic-auth.middleware';
import { AnimeService } from './anime/anime.service';
import { AnimeController } from './anime/anime.controller';
import { EpisodeService } from './episode/episode.service';
import { EpisodeController } from './episode/episode.controller';
import { StatsService } from './stats/stats.service';
import { StatsController } from './stats/stats.controller';
import { RecrawlService } from './recrawl/recrawl.service';
import { InjectService } from './inject/inject.service';
import { InjectController } from './inject/inject.controller';
import { AdapterModule } from './adapter/adapter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'better-sqlite3' as const,
        database: cfg.get<string>('SQLITE_PATH', 'data/results.sqlite'),
        entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink, Adapter],
        // result-store owns schema creation; the dashboard never alters it.
        synchronize: false,
        // WAL lets the dashboard read/write while the worker writes concurrently.
        prepareDatabase: (db: Database) => {
          db.pragma('journal_mode = WAL');
        },
      }),
    }),
    TypeOrmModule.forFeature([Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink, Adapter]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672')),
    }),
    AdapterModule,
    EngineModule,
  ],
  controllers: [StatsController, AnimeController, EpisodeController, InjectController],
  providers: [
    AnimeService,
    EpisodeService,
    StatsService,
    RecrawlService,
    AdapterService,
    InjectService,
  ],
})
export class DashboardModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BasicAuthMiddleware).forRoutes('*');
  }
}
