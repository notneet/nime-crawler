import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { buildRabbitConfig, S3Module } from '@libs/commons';
import { Anime, Episode, DownloadLink, DownloadArchive } from '@libs/commons/entities';
import { ArchiveModule } from './archive/archive.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'better-sqlite3',
        database: cfg.get<string>('SQLITE_PATH', 'data/results.sqlite'),
        entities: [Anime, Episode, DownloadLink, DownloadArchive],
        synchronize: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Anime, Episode, DownloadLink, DownloadArchive]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672')),
    }),
    S3Module,
    ArchiveModule,
  ],
})
export class DownloaderModule {}
