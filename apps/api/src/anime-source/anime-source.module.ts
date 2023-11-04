import { AnimeSource } from '@libs/commons/entities/anime-source.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimeSourceController } from './anime-source.controller';
import { AnimeSourceService } from './anime-source.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnimeSource])],
  controllers: [AnimeSourceController],
  providers: [AnimeSourceService],
  exports: [AnimeSourceService],
})
export class AnimeSourceModule {}
