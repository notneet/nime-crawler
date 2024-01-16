import {
  LogLevel,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    logger,
  });

  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableVersioning({ type: VersioningType.URI });

  const swaggerOpt = new DocumentBuilder()
    .setTitle('Nime Crawler API')
    .setDescription('Simple documentation of Nime Crawler API')
    .setVersion('1.0.0')
    .addTag('Root', 'About This API')
    .addTag('Medias', 'Examples of data media')
    .addTag('Watches', 'Examples of data watch')
    .addTag('Streams', 'Examples of data stream (!Under Dev)')
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerOpt);
  SwaggerModule.setup('docs', app, swaggerDoc);

  await app.listen(port);
}
bootstrap().then(() => {
  Logger.verbose(`Api service run on ${port}`);
});
