import { Stream } from '@libs/commons/entities/stream.entity';
import { HtmlScraperModule } from '@libs/commons/html-scraper/html-scraper.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamModule } from 'apps/api/src/stream/stream.module';
import { ReadAnimeEpisodeController } from './read-anime-episode.controller';
import { ReadAnimeEpisodeService } from './read-anime-episode.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stream]),
    HtmlScraperModule,
    StreamModule,
  ],
  controllers: [ReadAnimeEpisodeController],
  providers: [ReadAnimeEpisodeService],
})
export class ReadAnimeEpisodeModule {}
