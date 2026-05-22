import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DashboardModule } from './dashboard.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(DashboardModule);
  // Views are served from source (not the webpack bundle) to avoid asset-copy wiring.
  app.setBaseViewsDir(join(process.cwd(), 'apps/dashboard/src/views'));
  app.setViewEngine('hbs');
  app.enableShutdownHooks();
  const port = Number(process.env.DASH_PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
