import { queueConfig } from '@libs/commons/config/main';
import { DefKey, EnvKey } from '@libs/commons/helper/constant';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ScraperStreamModule } from './scraper-stream.module';

async function bootstrap() {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  );
  const configService = configModule.get(ConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ScraperStreamModule,
    queueConfig(
      configService,
      DefKey.Q_ANIME_SOURCE_STREAM,
      configService.get<number>(EnvKey.CONSUMER_PREFETCH_COUNT, 3),
    ),
  );
  await app.listen();
}
bootstrap();
