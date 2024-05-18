import { queueConfig } from '@libs/commons/config/main';
import { DefKey, Q_ROUTING_QUEUE } from '@libs/commons/helper/constant';
import { TypeOrmConfig } from '@libs/commons/typeorm-config/typeorm-config';
import { TypeOrmConfigModule } from '@libs/commons/typeorm-config/typeorm-config.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostPatternDetailModule } from 'apps/api/src/post-pattern-detail/post-pattern-detail.module';
import { PostPatternEpisodeModule } from 'apps/api/src/post-pattern-episode/post-pattern-episode.module';
import { PostPatternModule } from 'apps/api/src/post-pattern/post-pattern.module';
import { AnimeSourceModule } from '../../api/src/anime-source/anime-source.module';
import { MediaModule } from '../../api/src/media/media.module';
import { CronIntervalController } from './cron-interval.controller';
import { CronIntervalService } from './cron-interval.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmConfigModule.register()],
      useExisting: TypeOrmConfig,
    }),
    ClientsModule.registerAsync([
      {
        name: Q_ROUTING_QUEUE,
        inject: [ConfigService],
        useFactory(config: ConfigService) {
          return queueConfig(
            config,
            config.get<string>(DefKey.Q_ROUTING_QUEUE, DefKey.Q_ROUTING_QUEUE),
          );
        },
      },
    ]),
    MediaModule,
    AnimeSourceModule,
    PostPatternModule,
    PostPatternDetailModule,
    PostPatternEpisodeModule,
  ],
  controllers: [CronIntervalController],
  providers: [CronIntervalService],
})
export class CronIntervalModule {}
