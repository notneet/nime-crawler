import { dbConnection } from '@commons/constants';
import { AnimeModel } from '@entities/anime_model.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimeModelRepository } from './anime-model.repository';
import { AnimeModelService } from './anime-model.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConnection.animeData,
      }),
    }),
    TypeOrmModule.forFeature([AnimeModel]),
  ],
  providers: [AnimeModelService, AnimeModelRepository],
  exports: [AnimeModelService],
})
export class AnimeModelModule {}
