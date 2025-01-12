import { rmqExchange } from '@commons';
import { AnimeSourceModule } from '@commons/anime-source/anime-source.module';
import { HtmlModule } from '@commons/html/html.module';
import { MediaModule } from '@commons/media/media.module';
import { PatternDetailModule } from '@commons/pattern-detail/pattern-detail.module';
import { PatternIndexModule } from '@commons/pattern-index/pattern-index.module';
import { PatternLinkModule } from '@commons/pattern-link/pattern-link.module';
import { PatternWatchModule } from '@commons/pattern-watch/pattern-watch.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorModule } from '@helpers/rabbitmq-populator/rabbitmq-populator.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TestRepository } from '@repositories/repositories/test.repository';
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
    HtmlModule,
  ],
  controllers: [CronIntervalController],
  providers: [CronIntervalService, TestRepository],
})
export class CronIntervalModule {}
