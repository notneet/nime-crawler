import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(8081);
}
bootstrap();
