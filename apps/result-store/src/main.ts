import { NestFactory } from '@nestjs/core';
import { ResultStoreModule } from './result-store.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ResultStoreModule);
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
