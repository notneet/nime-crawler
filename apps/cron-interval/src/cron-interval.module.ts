import { queueConfig } from '@libs/commons/config/main';
import { DefKey, EnvKey, Q_ANIME_SOURCE } from '@libs/commons/helper/constant';
import { TypeOrmConfig } from '@libs/commons/typeorm-config/typeorm-config';
import { TypeOrmConfigModule } from '@libs/commons/typeorm-config/typeorm-config.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimeSourceModule } from '../../api/src/anime-source/anime-source.module';
import { CronIntervalController } from './cron-interval.controller';
import { CronIntervalService } from './cron-interval.service';
import { AnimeSource } from '../../../libs/commons/src/entities/anime-source.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return {
          type: 'mysql',
          url: config.get<string>(EnvKey.DATABASE_URL),
          entities: [AnimeSource],
          synchronize: false,
        };
      },
    }),
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
    AnimeSourceModule,
  ],
  controllers: [CronIntervalController],
  providers: [CronIntervalService],
})
export class CronIntervalModule {}
