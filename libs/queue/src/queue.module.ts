import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueProducerService } from './producers/queue-producer.service';
import { DeadLetterQueueService } from './services/dead-letter-queue.service';
import { QueueConfigService } from './services/queue-config.service';
import { QueueMetricsService } from './services/queue-metrics.service';

export interface QueueModuleOptions {
  rabbitmqUrl?: string;
  enableMetrics?: boolean;
  defaultExchange?: string;
  deadLetterExchange?: string;
}

@Module({})
export class QueueModule {
  static forRoot(options: QueueModuleOptions = {}): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        RabbitMQModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            exchanges: [
              {
                name: options.defaultExchange || 'nime.exchange',
                type: 'topic',
                options: {
                  durable: true,
                },
              },
              {
                name: options.deadLetterExchange || 'nime.dlx',
                type: 'topic',
                options: {
                  durable: true,
                },
              },
            ],
            uri:
              options.rabbitmqUrl ||
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://localhost:5672',
              ),
            connectionInitOptions: { wait: false },
            enableControllerDiscovery: true,
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [
        QueueProducerService,
        DeadLetterQueueService,
        QueueMetricsService,
        QueueConfigService,
        {
          provide: 'QUEUE_OPTIONS',
          useValue: options,
        },
      ],
      exports: [
        QueueProducerService,
        DeadLetterQueueService,
        QueueMetricsService,
        QueueConfigService,
      ],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: QueueModule,
      providers: [
        QueueProducerService,
        DeadLetterQueueService,
        QueueMetricsService,
        QueueConfigService,
      ],
      exports: [
        QueueProducerService,
        DeadLetterQueueService,
        QueueMetricsService,
        QueueConfigService,
      ],
    };
  }
}
