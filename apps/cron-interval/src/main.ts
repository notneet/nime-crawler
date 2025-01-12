import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CronIntervalModule } from './cron-interval.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CronIntervalModule,
    {
      transport: Transport.TCP,
      options: {
        port: 3000,
      },
    },
  );
  await app.listen();
}
bootstrap().then(() =>
  Logger.verbose(`[CronInterval] microservice is running`),
);
