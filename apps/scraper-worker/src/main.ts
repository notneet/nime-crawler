import { NestFactory } from '@nestjs/core';
import { ScraperWorkerModule } from './scraper-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ScraperWorkerModule);
  await app.init();
}
bootstrap();
