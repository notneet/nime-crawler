import { Module } from '@nestjs/common';
import { AnimeEpisodeModelModule } from './anime-episode-model/anime-episode-model.module';
import { AnimeModelModule } from './anime-model/anime-model.module';
import { AnimeSourceModule } from './anime-source/anime-source.module';
import { DataAccessService } from './data-access.service';
import { MediaModule } from './media/media.module';
import { PatternDetailModule } from './pattern-detail/pattern-detail.module';
import { PatternIndexModule } from './pattern-index/pattern-index.module';
import { PatternLinkModule } from './pattern-link/pattern-link.module';
import { PatternWatchModule } from './pattern-watch/pattern-watch.module';

@Module({
  imports: [
    MediaModule,
    AnimeSourceModule,
    PatternIndexModule,
    PatternDetailModule,
    PatternWatchModule,
    PatternLinkModule,
    AnimeModelModule,
    AnimeEpisodeModelModule,
  ],
  providers: [DataAccessService],
  exports: [DataAccessService],
})
export class DataAccessModule {}
