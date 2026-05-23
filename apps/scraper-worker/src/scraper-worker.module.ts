import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { buildRabbitConfig, EngineModule } from '@libs/commons';
import { Anime, Episode } from '@libs/commons/entities';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EngineModule,
    // Read-only access for the freshness skip-check. result-store owns the schema
    // (synchronize), so the worker never writes or migrates — synchronize: false.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'better-sqlite3',
        database: cfg.get<string>('SQLITE_PATH', 'data/results.sqlite'),
        entities: [Anime, Episode],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([Anime, Episode]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        ...buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672')),
        // Heavy per-episode browser workflow serializes on the pool; without this,
        // RabbitMQ floods the worker with ~11 jobs at once and they pile up.
        prefetchCount: 1,
      }),
    }),
  ],
  providers: [WorkerService],
})
export class ScraperWorkerModule {}
