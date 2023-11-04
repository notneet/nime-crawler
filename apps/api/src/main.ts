import {
  LogLevel,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

let port: number;

async function bootstrap() {
  const configModule = await NestFactory.createApplicationContext(ConfigModule);
  const configService = configModule.get(ConfigService);
  port = configService.get<number>('APP_PORT', 8081);
  const isDev =
    configService.get<string>('APP_ENV', 'production') === 'development';
  const logger: LogLevel[] = isDev
    ? ['log', 'debug', 'error', 'verbose']
    : ['error', 'fatal', 'warn', 'verbose'];
  configModule.close();

  const app = await NestFactory.create(ApiModule, { logger });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(port);
}
bootstrap().then(() => {
  Logger.verbose(`Api service run on ${port}`);
});
