import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SchedulerModule);
  await app.init();
}
bootstrap();
