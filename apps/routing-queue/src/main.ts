import { queueConfig } from '@libs/commons/config/main';
import { DefKey } from '@libs/commons/helper/constant';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { RoutingQueueModule } from './routing-queue.module';

async function bootstrap() {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  );
  const configService = configModule.get(ConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RoutingQueueModule,
    queueConfig(
      configService,
      configService.get<string>(DefKey.Q_ROUTING_QUEUE, DefKey.Q_ROUTING_QUEUE),
      5,
      false,
    ),
  );

  await configModule.close();
  await app.listen();
}
bootstrap();
