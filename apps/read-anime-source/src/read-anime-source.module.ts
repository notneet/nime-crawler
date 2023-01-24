import { queueConfig } from '@libs/commons/config/main';
import { DefKey, EnvKey, Q_ANIME_SOURCE } from '@libs/commons/helper/constant';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { ReadAnimeSourceController } from './read-anime-source.controller';
import { ReadAnimeSourceService } from './read-anime-source.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: Q_ANIME_SOURCE,
        inject: [ConfigService],
        useFactory(config: ConfigService) {
          return queueConfig(
            config,
            config.get<string>(DefKey.Q_ANIME_SOURCE, DefKey.Q_ANIME_SOURCE),
          );
        },
      },
    ]),
  ],
  controllers: [ReadAnimeSourceController],
  providers: [ReadAnimeSourceService],
})
export class ReadAnimeSourceModule {}
