import { NestFactory } from '@nestjs/core';
import { DownloaderModule } from './downloader.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DownloaderModule);
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
