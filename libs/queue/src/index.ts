// Main module
export { QueueModule, QueueModuleOptions } from './queue.module';

// Producers
export { QueueProducerService } from './producers/queue-producer.service';

// Consumers
export { BaseQueueConsumer } from './consumers/base-queue-consumer';

// Services
export { QueueMetricsService } from './services/queue-metrics.service';
export { DeadLetterQueueService } from './services/dead-letter-queue.service';
export { 
  QueueConfigService,
  QueueConnectionConfig,
  QueueRetryConfig,
  QueueMetricsConfig,
  QueueConfiguration,
} from './services/queue-config.service';