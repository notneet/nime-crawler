import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { buildRabbitConfig, EngineModule, SiteRegistry, otakudesuAdapter } from '@libs/commons';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EngineModule,
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
  providers: [
    WorkerService,
    { provide: SiteRegistry, useFactory: () => new SiteRegistry([otakudesuAdapter]) },
  ],
})
export class ScraperWorkerModule {}
