import { NestFactory } from '@nestjs/core';
import { ScraperWorkerModule } from './scraper-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ScraperWorkerModule);
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
