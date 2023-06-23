import { queueConfig } from '@libs/commons/config/main';
import { DefKey, EnvKey } from '@libs/commons/helper/constant';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ScraperServiceModule } from './scraper-service.module';

async function bootstrap() {
  let queueName: string;
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  );
  const configService = configModule.get(ConfigService);
  const scrapeType = configService.get<string>(EnvKey.SCRAPE_TYPE, 'post');

  if (scrapeType === 'post') {
    queueName = DefKey.Q_ANIME_SOURCE;
  } else {
    queueName = DefKey.Q_ANIME_SOURCE_DETAIL;
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ScraperServiceModule,
    queueConfig(
      configService,
      configService.get<string>(queueName, queueName),
      5,
    ),
  );
  await configModule.close();
  Logger.log(`Bot for scrape anime ${scrapeType} is running 🚀!`);
  await app.listen();
}
bootstrap();
