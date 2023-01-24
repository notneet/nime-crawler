import { Module } from '@nestjs/common';
import { AnimeSourceService } from './anime-source.service';
import { AnimeSourceController } from './anime-source.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimeSource } from '@libs/commons/entities/anime-source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnimeSource])],
  controllers: [AnimeSourceController],
  providers: [AnimeSourceService],
  exports: [AnimeSourceService],
})
export class AnimeSourceModule {}
