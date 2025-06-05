import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';
import { QueueModule } from '@app/queue';
import { Anime } from '@app/common/entities/core/anime.entity';
import { Source } from '@app/common/entities/core/source.entity';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { AnimeScraperService } from './scrapers/anime-scraper.service';
import { AnimeProcessor } from './processors/anime.processor';
import { AnimeValidator } from './validators/anime.validator';
import { CrawlJobProducer } from './producers/crawl-job.producer';
import { CrawlJobConsumer } from './consumers/crawl-job.consumer';
import { CrawlerMicroservice } from './crawler.microservice';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QueueModule,
    HtmlParserModule,
    TypeOrmModule.forFeature([Anime, Source]),
  ],
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
    AnimeScraperService,
    AnimeProcessor,
    AnimeValidator,
    CrawlJobProducer,
    CrawlJobConsumer,
    CrawlerMicroservice,
  ],
})
export class CrawlerModule {}
