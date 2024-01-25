import { Module } from '@nestjs/common';
import { ScraperStreamController } from './scraper-stream.controller';
import { ScraperStreamService } from './scraper-stream.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { DefKey, Q_ANIME_SOURCE_STREAM } from '@libs/commons/helper/constant';
import { queueConfig } from '@libs/commons/config/main';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: Q_ANIME_SOURCE_STREAM,
        inject: [ConfigService],
        useFactory(config: ConfigService) {
          return queueConfig(config, DefKey.Q_ANIME_SOURCE_STREAM);
        },
      },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [ScraperStreamController],
  providers: [ScraperStreamService],
})
export class ScraperStreamModule {}
