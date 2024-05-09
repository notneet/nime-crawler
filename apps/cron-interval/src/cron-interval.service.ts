import { AnimeSource } from '@libs/commons/entities/anime-source.entity';
import { Media } from '@libs/commons/entities/media.entity';
import {
  EventKey,
  Q_ROUTING_QUEUE,
  TimeUnit,
} from '@libs/commons/helper/constant';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AnimeSourceService } from 'apps/api/src/anime-source/anime-source.service';
import { MediaService } from 'apps/api/src/media/media.service';
import { PostPatternDetailService } from 'apps/api/src/post-pattern-detail/post-pattern-detail.service';
import { PostPatternEpisodeService } from 'apps/api/src/post-pattern-episode/post-pattern-episode.service';
import { PostPatternService } from 'apps/api/src/post-pattern/post-pattern.service';

interface BaseAnimePattern {
  media_id: number | null;
  pattern: string;
}

interface IPostPattern extends BaseAnimePattern {
  pagination_pattern: string;
}

interface IPostPatternDetail extends BaseAnimePattern {
  pagination_pattern: string;
}

interface IPostPatternEpisode extends BaseAnimePattern {
  watchId?: string | null;
}

export interface ScrapeAnime {
  origin: string;
  pageUrl: string | undefined;
  oldOrigin: string | null | undefined;
  nextPage?: string | null | undefined;
  patternPost: IPostPattern | undefined;
  patternPostDetail: IPostPatternDetail | undefined;
  patternPostEpisode: IPostPatternEpisode | undefined;
  description: string;
  timeout: number;
  langCode: string;
  countryCode: string;
  mediaId: number;
  numItterate: number;
  maxItteratePost: number | undefined;
  maxItteratePostDetail: number | undefined;
  numRetry: number;
  numPage: number;
  engine: string;
}

type ScapperOpt = {
  pageUrl?: string;
  oldOrigin: string | null | undefined;
  postPattern?: IPostPattern;
  postPatternDetail?: IPostPatternDetail;
  postPatternEpisode?: IPostPatternEpisode;
  maxItteratePostPage?: number;
  maxItteratePostDetailPage?: number;
  description: string;
  numPage?: number;
  engine: string;
} & AnimeSource;

@Injectable()
export class CronIntervalService {
  private readonly logger = new Logger(CronIntervalService.name);
  private lastInterval = new Map<number, Date>();

  constructor(
    @Inject(Q_ROUTING_QUEUE) private readonly client: ClientProxy,
    private readonly mediaService: MediaService,
    private readonly animeSourceService: AnimeSourceService,
    private readonly postPatternService: PostPatternService,
    private readonly postPatternDetailService: PostPatternDetailService,
    private readonly postPatternEpisodeService: PostPatternEpisodeService,
  ) {}

  // getAllAnimeResource() {
  //   return this.animeSourceRepo.find();
  // }

  /**
   * Pass alt origin url as rmq payload. it will be consumed at scraper (done)
   */
  async doJob() {
    for (const interval of await this.animeSourceService.findByIntervalsAndGroup()) {
      await this.createJobCrawling(interval);
    }
  }

  async createJobCrawling(interval: number) {
    const now = new Date();

    if (this.lastInterval.has(interval)) {
      const lastRun = this.lastInterval.get(interval) || new Date();
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
      const patternPostsEpisode =
        await this.postPatternEpisodeService.findByMediaIds(
          animeSources.map((it) => it.media_id),
        );

      for (const animeSource of animeSources) {
        let media: Media | null | undefined;

        try {
          media = await this.mediaService.findOne(animeSource?.media_id);
        } catch (err) {
          this.logger.error(err?.message + ` for ${animeSource?.url}`);
        }

        const postPattern = patternPosts.find(
          (it) => it.media_id === animeSource.media_id,
        );
        const postPatternDetail = patternPostsDetail.find(
          (it) => it.media_id === animeSource.media_id,
        );
        const postPatternEpisode = patternPostsEpisode.find(
          (it) => it.media_id === animeSource.media_id,
        );

        const desc = `scraping data from ${animeSource.url} (${animeSource.media_id}) on interval ${animeSource.interval}`;
        const postPatternPayload: IPostPattern = {
          media_id: postPattern?.media_id || null,
          pattern: postPattern?.pattern || '[]',
          pagination_pattern: postPattern?.pagination_pattern || '[]',
        };
        const postPatternDetailPayload: IPostPatternDetail = {
          media_id: postPatternDetail?.media_id || null,
          pattern: postPatternDetail?.pattern || '[]',
          pagination_pattern: postPatternDetail?.pagination_pattern || '[]',
        };
        const postPatternEpisodePayload: IPostPatternEpisode = {
          media_id: postPatternEpisode?.media_id || null,
          watchId: null,
          pattern: postPatternEpisode?.pattern || '[]',
        };

        this.logger.debug(desc);

        await this.emitToScrapper({
          ...animeSource,
          pageUrl: animeSource.url,
          oldOrigin: media?.url_old,
          postPattern: postPatternPayload,
          postPatternDetail: postPatternDetailPayload,
          postPatternEpisode: postPatternEpisodePayload,
          maxItteratePostPage: animeSource.max_itterate_post,
          maxItteratePostDetailPage: animeSource.max_itterate_detail,
          description: desc,
          engine: animeSource.engine,
        });
      }
      await new Promise((res) => setTimeout(res, 300));
    } while (true);

    return;
  }

  async emitToScrapper(opts: ScapperOpt) {
    const data: ScrapeAnime = {
      origin: this.extractOrigin(opts.url),
      pageUrl: opts.pageUrl,
      oldOrigin: opts?.oldOrigin,
      nextPage: null,
      patternPost: opts.postPattern,
      patternPostDetail: opts.postPatternDetail,
      patternPostEpisode: opts.postPatternEpisode,
      description: opts.description,
      timeout: opts.timeout,
      langCode: opts.lang_code,
      countryCode: opts.country_code,
      mediaId: opts.media_id,
      numItterate: 0,
      maxItteratePost: opts.maxItteratePostPage,
      maxItteratePostDetail: opts.maxItteratePostDetailPage,
      numRetry: 0,
      numPage: 1,
      engine: opts.engine,
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
