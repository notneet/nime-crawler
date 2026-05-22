import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import type { Database } from 'better-sqlite3';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { buildRabbitConfig } from '@libs/commons/rabbit/rabbit.config';
import { SiteRegistry } from '@libs/commons/adapters/site-registry';
import { otakudesuAdapter } from '@libs/commons/adapters/otakudesu.adapter';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'better-sqlite3' as const,
        database: cfg.get<string>('SQLITE_PATH', 'data/results.sqlite'),
        entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink],
        // result-store owns schema creation; the dashboard never alters it.
        synchronize: false,
        // WAL lets the dashboard read/write while the worker writes concurrently.
        prepareDatabase: (db: Database) => {
          db.pragma('journal_mode = WAL');
        },
      }),
    }),
    TypeOrmModule.forFeature([Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672')),
    }),
  ],
  controllers: [StatsController, AnimeController, EpisodeController, InjectController],
  providers: [
    AnimeService,
    EpisodeService,
    StatsService,
    RecrawlService,
    InjectService,
    { provide: SiteRegistry, useFactory: () => new SiteRegistry([otakudesuAdapter]) },
  ],
})
export class DashboardModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BasicAuthMiddleware).forRoutes('*');
  }
}
