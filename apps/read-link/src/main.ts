import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ReadLinkModule } from './read-link.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReadLinkModule,
    {
      options: {
        port: 3003,
      },
    },
  );
  await app.listen();
}
bootstrap().then(() => Logger.verbose(`[ReadLink] microservice is running`));
