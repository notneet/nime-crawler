import { Module } from '@nestjs/common';
import { AnimeEpisodeModelModule } from './anime-episode-model/anime-episode-model.module';
import { AnimeModelModule } from './anime-model/anime-model.module';
import { AnimeSourceModule } from './anime-source/anime-source.module';
import { CommonsService } from './commons.service';
import { HtmlModule } from './html/html.module';
import { MediaModule } from './media/media.module';
import { PatternDetailModule } from './pattern-detail/pattern-detail.module';
import { PatternIndexModule } from './pattern-index/pattern-index.module';
import { PatternLinkModule } from './pattern-link/pattern-link.module';
import { PatternWatchModule } from './pattern-watch/pattern-watch.module';
import { AuthModule } from './auth/auth.module';

@Module({
  providers: [CommonsService],
  exports: [CommonsService],
  imports: [
    AnimeSourceModule,
    MediaModule,
    PatternIndexModule,
    PatternDetailModule,
    PatternWatchModule,
    HtmlModule,
    PatternLinkModule,
    AnimeModelModule,
    AnimeEpisodeModelModule,
    AuthModule,
  ],
})
export class CommonsModule {}
