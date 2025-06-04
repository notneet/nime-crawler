import { NestFactory } from '@nestjs/core';
import { LinkCheckerModule } from './link-checker.module';

async function bootstrap() {
  const app = await NestFactory.create(LinkCheckerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
