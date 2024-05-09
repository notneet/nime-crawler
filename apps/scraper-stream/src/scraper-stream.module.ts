import { queueConfig } from '@libs/commons/config/main';
import { DefKey, Q_ANIME_SOURCE_STREAM } from '@libs/commons/helper/constant';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperStreamController } from './scraper-stream.controller';
import { ScraperStreamService } from './scraper-stream.service';

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
