import { Module } from '@nestjs/common';
import { ReadAnimePostController } from './read-anime-post.controller';
import { ReadAnimePostService } from './read-anime-post.service';
import { HtmlScraperModule } from '@libs/commons/html-scraper/html-scraper.module';
import { WatchModule } from 'apps/api/src/watch/watch.module';
import { Watch } from '@libs/commons/entities/watch.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Watch]), HtmlScraperModule, WatchModule],
  controllers: [ReadAnimePostController],
  providers: [ReadAnimePostService],
})
export class ReadAnimePostModule {}
