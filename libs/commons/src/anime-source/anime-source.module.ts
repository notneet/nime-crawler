import { AnimeSource } from '@entities/anime-source.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConnection } from '../constants';
import { AnimeSourceRepository } from './anime-source.repository';
import { AnimeSourceService } from './anime-source.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConnection.animeData,
      }),
    }),
    TypeOrmModule.forFeature([AnimeSource]),
  ],
  providers: [AnimeSourceService, AnimeSourceRepository],
  exports: [AnimeSourceService],
})
export class AnimeSourceModule {}
