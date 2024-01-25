import { NestFactory } from '@nestjs/core';
import { CronIntervalModule } from './cron-interval.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(CronIntervalModule);
  await app.listen();
}
bootstrap();
