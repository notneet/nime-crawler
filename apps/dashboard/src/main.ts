import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import * as hbs from 'hbs';
import { DashboardModule } from './dashboard.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(DashboardModule);
  // Views are served from source (not the webpack bundle) to avoid asset-copy wiring.
  const viewsDir = join(process.cwd(), 'apps/dashboard/src/views');
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('hbs');
  // Register partials synchronously: hbs.registerPartials() scans the dir async
  // and races the first render, which 500s with "partial could not be found".
  const partialsDir = join(viewsDir, 'partials');
  for (const file of readdirSync(partialsDir)) {
    if (file.endsWith('.hbs')) {
      hbs.handlebars.registerPartial(file.slice(0, -4), readFileSync(join(partialsDir, file), 'utf8'));
    }
  }
  app.enableShutdownHooks();
  const port = Number(process.env.DASH_PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
