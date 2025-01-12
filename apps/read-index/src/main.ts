import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ReadIndexModule } from './read-index.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReadIndexModule,
    {
      options: {
        port: 3001,
      },
    },
  );
  await app.listen();
}
bootstrap().then(() => Logger.verbose(`[ReadIndex] microservice is running`));
