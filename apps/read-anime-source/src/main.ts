import { queueConfig } from '@libs/commons/config/main';
import { DefKey, EnvKey } from '@libs/commons/helper/constant';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ReadAnimeSourceModule } from './read-anime-source.module';

async function bootstrap() {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  );
  const configService = configModule.get(ConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReadAnimeSourceModule,
    queueConfig(
      configService,
      configService.get<string>(DefKey.Q_ANIME_SOURCE, DefKey.Q_ANIME_SOURCE),
      configService.get<number>(EnvKey.CONSUMER_PREFETCH_COUNT, 5),
    ),
  );
  await configModule.close();
  await app.listen();
}
bootstrap();
