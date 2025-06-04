import { NestFactory } from '@nestjs/core';
import { MailerModule } from './mailer.module';

async function bootstrap() {
  const app = await NestFactory.create(MailerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
