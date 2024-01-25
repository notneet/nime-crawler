import { queueConfig } from '@libs/commons/config/main';
import {
  DefKey,
  Q_ANIME_SOURCE,
  Q_ANIME_SOURCE_DETAIL,
} from '@libs/commons/helper/constant';
import { HtmlScraperModule } from '@libs/commons/html-scraper/html-scraper.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { ReadAnimeController } from './read-anime.controller';
import { ReadAnimeService } from './read-anime.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: Q_ANIME_SOURCE,
        inject: [ConfigService],
        useFactory(config: ConfigService) {
          return queueConfig(
            config,
            config.get<string>(DefKey.Q_ANIME_SOURCE, DefKey.Q_ANIME_SOURCE),
          );
        },
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: Q_ANIME_SOURCE_DETAIL,
        inject: [ConfigService],
        useFactory(config: ConfigService) {
          return queueConfig(
            config,
            config.get<string>(
              DefKey.Q_ANIME_SOURCE_DETAIL,
              DefKey.Q_ANIME_SOURCE_DETAIL,
            ),
          );
        },
      },
    ]),
    HtmlScraperModule,
  ],
  controllers: [ReadAnimeController],
  providers: [ReadAnimeService],
})
export class ReadAnimeModule {}
