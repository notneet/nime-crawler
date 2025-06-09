import { Anime } from '@app/common/entities/core/anime.entity';
import { Source } from '@app/common/entities/core/source.entity';
import { DatabaseModule } from '@app/database';
import { QueueModule } from '@app/queue';
import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlJobConsumer } from './consumers/crawl-job.consumer';
import { CrawlerController } from './crawler.controller';
import { CrawlerMicroservice } from './crawler.microservice';
import { CrawlerService } from './crawler.service';
import { AnimeProcessor } from './processors/anime.processor';
import { CrawlJobProducer } from './producers/crawl-job.producer';
import { AnimeDetailScraperService } from './scrapers/anime-detail-scraper.service';
import { AnimeListScraperService } from './scrapers/anime-list-scraper.service';
import { AnimeScraperService } from './scrapers/anime-scraper.service';
import { EpisodeScraperService } from './scrapers/episode-scraper.service';
import { CrawlerManager } from './services/crawler-manager.service';
import { SourceHealthCheckService } from './services/source-health-check.service';
import { AnimeValidator } from './validators/anime.validator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QueueModule.forRoot(),
    HtmlParserModule.forRoot({
      loggerLevel: ['log', 'error'],
    }),
    TypeOrmModule.forFeature([Anime, Source]),
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NIME_CRAWLER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'crawler_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
    AnimeScraperService,
    SourceHealthCheckService,
    AnimeProcessor,
    AnimeValidator,
    CrawlJobProducer,
    CrawlJobConsumer,
    CrawlerMicroservice,
    AnimeListScraperService,
    AnimeDetailScraperService,
    EpisodeScraperService,
    CrawlerManager,
  ],
  exports: [CrawlerService],
})
export class CrawlerModule {}
