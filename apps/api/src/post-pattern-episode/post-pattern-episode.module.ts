import { PostEpisodePattern } from '@libs/commons/entities/post-episode-pattern.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostPatternEpisodeController } from './post-pattern-episode.controller';
import { PostPatternEpisodeService } from './post-pattern-episode.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEpisodePattern])],
  controllers: [PostPatternEpisodeController],
  providers: [PostPatternEpisodeService],
  exports: [PostPatternEpisodeService],
})
export class PostPatternEpisodeModule {}
