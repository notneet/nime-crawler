import { AnimeSourceService } from '@commons/anime-source/anime-source.service';
import { MediaService } from '@commons/media/media.service';
import { PatternDetailService } from '@commons/pattern-detail/pattern-detail.service';
import { PatternIndexService } from '@commons/pattern-index/pattern-index.service';
import { PatternLinkService } from '@commons/pattern-link/pattern-link.service';
import { PatternWatchService } from '@commons/pattern-watch/pattern-watch.service';
import { AnimeSource } from '@entities/anime-source.entity';
import { Media } from '@entities/media.entity';
import { PatternDetail } from '@entities/pattern-detail.entity';
import { PatternIndex } from '@entities/pattern-index.entity';
import { PatternLink } from '@entities/pattern-link.entity';
import { PatternWatch } from '@entities/pattern-watch.entity';
import { PayloadMessage } from '@entities/types/payload-anime-index.type';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class CronIntervalService {
  constructor(
    private readonly animeSourceService: AnimeSourceService,
    private readonly mediaService: MediaService,
    private readonly patternIndexService: PatternIndexService,
    private readonly patternDetailService: PatternDetailService,
    private readonly patternWatchService: PatternWatchService,
    private readonly patternLinkService: PatternLinkService,
  ) {}

  async getJobFilteredByIntervalMinute() {
    const jobData = await this.animeSourceService.findGrouped();

    const filteredAnimeSources = jobData?.filter((animeSource) => {
      const lastRunAt = DateTime.fromJSDate(animeSource.last_run_at);
      const now = DateTime.now();
      const elapsedMinutes = now.diff(lastRunAt, 'minutes').minutes;
      return elapsedMinutes >= animeSource.interval_minute;
    });

    return filteredAnimeSources;
  }

  async getAllMedia() {
    return this.mediaService.findAll();
  }

  async getAllPatternIndex() {
    return this.patternIndexService.findAll();
  }

  async getAllPatternDetail() {
    return this.patternDetailService.findAll();
  }

  async getAllPatternWatch() {
    return this.patternWatchService.findAll();
  }

  async getAllPatternLink() {
    return this.patternLinkService.findAll();
  }

  constructPayloadAnimeIndex(
    source: AnimeSource,
    mediaId: bigint,
    media: Media[],
    patternIndex: PatternIndex[],
    patternDetail: PatternDetail[],
    patternWatch: PatternWatch[],
    patternLink: PatternLink[],
  ): PayloadMessage {
    const mediaEntity = media.find(
      (media) => media.id.toString() === mediaId.toString(),
    );
    const patternIndexEntity = patternIndex.find(
      (patternIndex) => patternIndex.media_id.toString() === mediaId.toString(),
    );
    const patternDetailEntity = patternDetail.find(
      (patternDetail) =>
        patternDetail.media_id.toString() === mediaId.toString(),
    );
    const patternWatchEntity = patternWatch.find(
      (patternWatch) => patternWatch.media_id.toString() === mediaId.toString(),
    );
    const patternLinkEntity = patternLink.find(
      (patternLink) => patternLink.media_id.toString() === mediaId.toString(),
    );

    return {
      media_id: mediaId,
      media_url: mediaEntity?.url,
      page_url: source.url,
      page_num: 1,
      pattern_index: patternIndexEntity?.pattern || null,
      pattern_detail: patternDetailEntity?.pattern || null,
      pattern_watch: patternWatchEntity?.pattern || null,
      pattern_link: patternLinkEntity?.pattern || null,
    } satisfies PayloadMessage;
  }

  getHello(): string {
    return 'Hello World!';
  }
}
