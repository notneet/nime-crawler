import { rmqExchange } from '@commons';
import { AnimeSourceModule } from '@data-access/anime-source/anime-source.module';
import { MediaModule } from '@data-access/media/media.module';
import { PatternDetailModule } from '@data-access/pattern-detail/pattern-detail.module';
import { PatternIndexModule } from '@data-access/pattern-index/pattern-index.module';
import { PatternLinkModule } from '@data-access/pattern-link/pattern-link.module';
import { PatternWatchModule } from '@data-access/pattern-watch/pattern-watch.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorModule } from '@helpers/rabbitmq-populator/rabbitmq-populator.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CronIntervalController } from './cron-interval.controller';
import { CronIntervalService } from './cron-interval.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({ ...rmqExchange.config }),
    }),
    RabbitmqPopulatorModule,
    AnimeSourceModule,
    MediaModule,
    PatternIndexModule,
    PatternDetailModule,
    PatternWatchModule,
    PatternLinkModule,
  ],
  controllers: [CronIntervalController],
  providers: [CronIntervalService],
})
export class CronIntervalModule {}
