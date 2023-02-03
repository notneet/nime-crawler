import { AnimeSource } from '@libs/commons/entities/anime-source.entity';
import {
  EventKey,
  Q_ROUTING_QUEUE,
  TimeUnit,
} from '@libs/commons/helper/constant';
import { Inject, Injectable } from '@nestjs/common';
import { PostPatternDetailService } from 'apps/api/src/post-pattern-detail/post-pattern-detail.service';
import { PostPatternService } from 'apps/api/src/post-pattern/post-pattern.service';
import { AnimeSourceService } from '../../api/src/anime-source/anime-source.service';
import { MediaService } from '../../api/src/media/media.service';
import { ClientProxy } from '@nestjs/microservices';

type ScapperOpt = {
  postPattern?: string;
  postPatternDetail?: string;
  maxItteratePostPage?: number;
  maxItteratePostDetailPage?: number;
  description: string;
  page?: number;
} & AnimeSource;

@Injectable()
export class CronIntervalService {
  private lastInterval = new Map<number, Date>();

  constructor(
    @Inject(Q_ROUTING_QUEUE) private readonly client: ClientProxy,
    private readonly mediaService: MediaService,
    private readonly animeSourceService: AnimeSourceService,
    private readonly postPatternService: PostPatternService,
    private readonly postPatternDetailService: PostPatternDetailService,
  ) {}

  // getAllAnimeResource() {
  //   return this.animeSourceRepo.find();
  // }

  async doJob() {
    for (const interval of await this.animeSourceService.findByIntervalsAndGroup()) {
      await this.createJobCrawling(interval);
    }
  }

  async createJobCrawling(interval: number) {
    const now = new Date();

    if (this.lastInterval.has(interval)) {
      const lastRun = this.lastInterval.get(interval);
      const diffTime = now.getTime() - lastRun.getTime();

      if (diffTime < interval * TimeUnit.MINUTE) {
        return;
      }
    }
    let lastId = 0;
    do {
      const animeSources =
        await this.animeSourceService.findByIntervalAndLastId(interval, lastId);

      if (animeSources.length < 1) {
        break;
      }
      lastId = animeSources[animeSources.length - 1].id;
      const patternPosts = await this.postPatternService.findByMediaIds(
        animeSources.map((it) => it.media_id),
      );
      const patternPostsDetail =
        await this.postPatternDetailService.findByMediaIds(
          animeSources.map((it) => it.media_id),
        );

      for (const animeSource of animeSources) {
        const postPattern = patternPosts.find(
          (it) => it.media_id === animeSource.media_id,
        );
        const postPatternDetail = patternPostsDetail.find(
          (it) => it.media_id === animeSource.media_id,
        );

        const desc = `scraping data from ${animeSource.url} (${animeSource.media_id}) on interval ${animeSource.interval}`;
        await this.emitToScrapper({
          ...animeSource,
          postPattern: postPattern?.pattern || '[]',
          postPatternDetail: postPatternDetail?.pattern || '[]',
          description: desc,
        });
      }
      await new Promise((res) => setTimeout(res, 300));
    } while (true);

    return;
  }

  async emitToScrapper(opts: ScapperOpt) {
    const data = {
      origin: this.extractOrigin(opts.url),
      patternPost: opts.postPattern,
      patternPostDetail: opts.postPatternDetail,
      description: opts.description,
      timeout: opts.timeout,
      langCode: opts.lang_code,
      countryCode: opts.country_code,
      mediaId: opts.media_id,
      numItterate: 0,
      numRetry: 0,
      page: 1,
    };

    await Promise.resolve(this.client.emit(EventKey.READ_ANIME_SOURCE, data));
  }

  private extractOrigin(rawUrl: string) {
    return new URL(rawUrl).host;
  }

  getHello(): string {
    return 'Hello World!';
  }
}
