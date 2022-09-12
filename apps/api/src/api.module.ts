import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { MediaModule } from './media/media.module';
import { AnimeSourceModule } from './anime-source/anime-source.module';
import { PostPatternModule } from './post-pattern/post-pattern.module';
import { PostPatternDetailModule } from './post-pattern-detail/post-pattern-detail.module';

@Module({
  imports: [MediaModule, AnimeSourceModule, PostPatternModule, PostPatternDetailModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
