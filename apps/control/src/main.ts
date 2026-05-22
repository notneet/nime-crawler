import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RMQ_URI ?? 'amqp://guest:guest@localhost:5672'],
      queue: 'anime.control',
      queueOptions: { durable: true },
    },
  });
  await app.listen();
}
bootstrap();
