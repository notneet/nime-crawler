import { dbConnection } from '@commons/constants';
import { AnimeEpisodeModel } from '@entities/anime_episode_model.entity';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimeEpisodeModelRepository } from './anime-episode-model.repository';
import { AnimeEpisodeModelService } from './anime-episode-model.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...dbConnection.animeData,
        logging:
          configService.get<string>('APP_ENV', 'development') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([AnimeEpisodeModel]),
  ],
  providers: [AnimeEpisodeModelService, AnimeEpisodeModelRepository],
  exports: [AnimeEpisodeModelService],
})
export class AnimeEpisodeModelModule {}
