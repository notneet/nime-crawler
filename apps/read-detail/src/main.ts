import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ReadDetailModule } from './read-detail.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReadDetailModule,
    {
      options: {
        port: 3002,
      },
    },
  );
  await app.listen();
}
bootstrap().then(() => Logger.verbose(`[ReadDetail] microservice is running`));
