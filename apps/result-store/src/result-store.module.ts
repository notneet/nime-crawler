import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { buildRabbitConfig } from '@libs/commons';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink, Adapter } from '@libs/commons/entities';
import { ResultMapper } from './result.mapper';
import { ResultStoreService } from './result-store.service';
import { AdapterSeedService } from './adapter-seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'better-sqlite3',
        database: cfg.get<string>('SQLITE_PATH', 'data/results.sqlite'),
        entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink, Adapter],
        synchronize: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink, Adapter]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672')),
    }),
  ],
  providers: [ResultStoreService, ResultMapper, AdapterSeedService],
})
export class ResultStoreModule {}
