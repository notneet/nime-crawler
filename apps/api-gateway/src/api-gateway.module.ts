import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@app/database';
import { QueueModule } from '@app/queue';
import { Anime } from '@app/common/entities/core/anime.entity';
import { Source } from '@app/common/entities/core/source.entity';
import { Episode } from '@app/common/entities/core/episode.entity';
import { CrawlJob } from '@app/common/entities/crawler/crawl-job.entity';
import { SourceHealth } from '@app/common/entities/monitoring/source-health.entity';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { CrawlerController } from './controllers/crawler.controller';
import { AnimeController } from './controllers/anime.controller';
import { SourceController } from './controllers/source.controller';
import { CrawlerGatewayService } from './services/crawler-gateway.service';
import { AnimeGatewayService } from './services/anime-gateway.service';
import { SourceGatewayService } from './services/source-gateway.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QueueModule,
    TypeOrmModule.forFeature([Anime, Source, Episode, CrawlJob, SourceHealth]),
  ],
  controllers: [
    ApiGatewayController,
    CrawlerController,
    AnimeController,
    SourceController,
  ],
  providers: [
    ApiGatewayService,
    CrawlerGatewayService,
    AnimeGatewayService,
    SourceGatewayService,
  ],
})
export class ApiGatewayModule {}
