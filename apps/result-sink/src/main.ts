import { NestFactory } from '@nestjs/core';
import { ResultSinkModule } from './result-sink.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ResultSinkModule);
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
