import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { buildRabbitConfig, EXCHANGES, S3Module } from '@libs/commons';
import { Anime, Episode, Mirror, DownloadArchive } from '@libs/commons/entities';
import { ArchiveModule } from './archive/archive.module';
import { ArchiveConsumer } from './archive/archive.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'better-sqlite3',
        database: cfg.get<string>('SQLITE_PATH', 'data/results.sqlite'),
        entities: [Anime, Episode, Mirror, DownloadArchive],
        synchronize: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Anime, Episode, Mirror, DownloadArchive]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const base = buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672'));
        const retryDelay = Number(cfg.get<string>('DOWNLOAD_RETRY_DELAY_MS', '30000'));
        return {
          ...base,
          // Delayed bounded-retry topology (downloader-only):
          // archive --Nack--> dlx --> retry (TTL) --expire--> download --> archive ...
          // exhausted jobs are parked in the durable failed queue.
          queues: [
            {
              name: 'anime.download.retry',
              exchange: EXCHANGES.dlx,
              routingKey: 'download.episode.*',
              createQueueIfNotExists: true,
              options: {
                durable: true,
                messageTtl: retryDelay,
                deadLetterExchange: EXCHANGES.download,
              },
            },
            {
              name: 'anime.download.failed',
              exchange: EXCHANGES.dlx,
              routingKey: 'download.failed',
              createQueueIfNotExists: true,
              options: { durable: true },
            },
          ],
        };
      },
    }),
    S3Module,
    ArchiveModule,
  ],
  providers: [ArchiveConsumer],
})
export class DownloaderModule {}
