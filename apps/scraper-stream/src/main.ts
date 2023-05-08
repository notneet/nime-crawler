import { NestFactory } from '@nestjs/core';
import { ScraperStreamModule } from './scraper-stream.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { queueConfig } from '@libs/commons/config/main';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DefKey } from '@libs/commons/helper/constant';

async function bootstrap() {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  );
  const configService = configModule.get(ConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ScraperStreamModule,
    queueConfig(configService, DefKey.Q_ANIME_SOURCE_STREAM, 3),
  );
  await app.listen();
}
bootstrap();
