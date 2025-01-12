import { configureHandlebars } from '@helpers/handlebars';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { resolve } from 'path';
import { PatternDashboardModule } from './pattern-dashboard.module';

let port: number = 3005;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    PatternDashboardModule,
    { bodyParser: true },
  );

  app.use(cookieParser());

  // Add ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve static assets from the public directory
  app.useStaticAssets(resolve('public'));

  // Configure Handlebars
  configureHandlebars(app);

  await app.listen(process.env.port ?? port);
}
bootstrap().then(() =>
  Logger.verbose(`[PatternDashboard] microservice is running`),
);
