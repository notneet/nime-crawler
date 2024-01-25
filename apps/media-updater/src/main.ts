import { NestFactory } from '@nestjs/core';
import { MediaUpdaterModule } from './media-updater.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(MediaUpdaterModule);
  await app.listen();
}
bootstrap();
