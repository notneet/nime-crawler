import { NestMicroserviceOptions } from '@nestjs/common/interfaces/microservices/nest-microservice-options.interface';
import { NestFactory } from '@nestjs/core';
import { CrawlerModule } from './crawler.module';

async function bootstrap() {
  const app =
    await NestFactory.createMicroservice<NestMicroserviceOptions>(
      CrawlerModule,
    );
  await app.listen();
}
bootstrap().then(() => console.log(`${CrawlerModule.name} is running`));
