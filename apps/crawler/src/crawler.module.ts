import { Anime } from '@app/common/entities/core/anime.entity';
import { Source } from '@app/common/entities/core/source.entity';
import { DatabaseModule } from '@app/database';
import { QueueModule } from '@app/queue';
import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlJobConsumer } from './consumers/crawl-job.consumer';
import { CrawlerController } from './crawler.controller';
import { CrawlerMicroservice } from './crawler.microservice';
import { CrawlerService } from './crawler.service';
import { AnimeProcessor } from './processors/anime.processor';
import { CrawlJobProducer } from './producers/crawl-job.producer';
import { AnimeScraperService } from './scrapers/anime-scraper.service';
import { SourceHealthCheckService } from './services/source-health-check.service';
import { AnimeValidator } from './validators/anime.validator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QueueModule.forRoot(),
    HtmlParserModule,
    TypeOrmModule.forFeature([Anime, Source]),
    ScheduleModule.forRoot(),
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
  ],
})
export class CrawlerModule {}
