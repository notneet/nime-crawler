import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ReadEpisodeModule } from './read-episode.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReadEpisodeModule,
    {
      options: {
        port: 3004,
      },
    },
  );
  await app.listen();
}
bootstrap().then(() => Logger.verbose(`[ReadEpisode] microservice is running`));
