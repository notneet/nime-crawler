import { Module } from '@nestjs/common';
import { AnimeSourceService } from './anime-source.service';
import { AnimeSourceController } from './anime-source.controller';

@Module({
  imports: [],
  controllers: [AnimeSourceController],
  providers: [AnimeSourceService],
  exports: [AnimeSourceService],
})
export class AnimeSourceModule {}
