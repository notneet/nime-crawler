import {
  EXCHANGE_NAMES,
  QUEUE_NAMES,
  QUEUE_OPTIONS,
} from '@app/common/constants/queue.constants';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CrawlerModule } from './crawler.module';

async function bootstrap() {
  const logger = new Logger('CrawlerMicroservice');

  try {
    // Create RabbitMQ microservice
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      CrawlerModule,
      {
        logger: ['error', 'warn', 'log', 'verbose', 'debug'],
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: QUEUE_NAMES.CRAWL,
          queueOptions: {
            durable: QUEUE_OPTIONS.DURABLE,
            autoDelete: QUEUE_OPTIONS.AUTO_DELETE,
            exclusive: QUEUE_OPTIONS.EXCLUSIVE,
            arguments: {
              'x-message-ttl': QUEUE_OPTIONS.ARGUMENTS['x-message-ttl'],
              'x-max-retries': QUEUE_OPTIONS.ARGUMENTS['x-max-retries'],
              'x-retry-delay': QUEUE_OPTIONS.ARGUMENTS['x-retry-delay'],
              'x-dead-letter-exchange': EXCHANGE_NAMES.DEAD_LETTER,
              'x-dead-letter-routing-key': 'crawl.dead',
            },
          },
          prefetchCount: 3, // Process one message at a time
          noAck: false, // Require acknowledgment
        },
      },
    );

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Start the microservice
    await app.listen();

    logger.log('🚀 Crawler Microservice is ready to process crawl jobs');
    logger.log(
      `📡 Connected to RabbitMQ: ${process.env.RABBITMQ_URL || 'amqp://localhost:5672'}`,
    );
    logger.log(`🔄 Listening on queue: ${QUEUE_NAMES.CRAWL}`);
  } catch (error) {
    logger.error('❌ Failed to start Crawler Microservice:', error);
    process.exit(1);
  }
}

bootstrap();
