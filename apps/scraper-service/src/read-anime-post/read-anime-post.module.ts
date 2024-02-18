import { queueConfig } from '@libs/commons/config/main';
import { Watch } from '@libs/commons/entities/watch.entity';
import { DefKey, Q_ANIME_SOURCE_STREAM } from '@libs/commons/helper/constant';
import { HtmlScraperModule } from '@libs/commons/html-scraper/html-scraper.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchModule } from 'apps/api/src/watch/watch.module';
import { ReadAnimePostController } from './read-anime-post.controller';
import { ReadAnimePostService } from './read-anime-post.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: Q_ANIME_SOURCE_STREAM,
        inject: [ConfigService],
        useFactory(config: ConfigService) {
          return queueConfig(
            config,
            config.get<string>(
              DefKey.Q_ANIME_SOURCE_STREAM,
              DefKey.Q_ANIME_SOURCE_STREAM,
            ),
          );
        },
      },
    ]),
    TypeOrmModule.forFeature([Watch]),
    HtmlScraperModule,
    WatchModule,
  ],
  controllers: [ReadAnimePostController],
  providers: [ReadAnimePostService],
})
export class ReadAnimePostModule {}
