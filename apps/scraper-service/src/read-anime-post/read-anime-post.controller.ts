import { FieldPipeOptionsPattern } from '@libs/commons/entities/field-field-pattern';
import {
  EventKey,
  NodeItem,
  Q_ANIME_SOURCE_STREAM,
} from '@libs/commons/helper/constant';
import {
  HtmlScraperService,
  ParsedPattern,
} from '@libs/commons/html-scraper/html-scraper.service';
import { StringHelperService } from '@libs/commons/string-helper/string-helper.service';
import { Controller, Inject, Logger, UseInterceptors } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { WatchService } from 'apps/api/src/watch/watch.service';
import { arrayNotEmpty, isNotEmpty } from 'class-validator';
import { DateTime } from 'luxon';
import { ScrapeAnime } from '../../../cron-interval/src/cron-interval.service';
import { AcknolageMessageInterceptor } from '../interceptors/acknolage-message.interceptor';

@Controller()
@UseInterceptors(AcknolageMessageInterceptor)
export class ReadAnimePostController {
  private readonly logger = new Logger(ReadAnimePostController.name);

  constructor(
    private readonly htmlScraper: HtmlScraperService,
    private readonly watchService: WatchService,
    @Inject(Q_ANIME_SOURCE_STREAM)
    private readonly clientPostStream: ClientProxy,
    private readonly stringHelperService: StringHelperService,
  ) {}

  /**
   * - will added new payload. e.g oldOrigin. (done)
   * - before insert. make object_id use old pageUrl for find by object_id. then make new object use oldOrigin for replace old object_id
   *
   * how about find by object_id with a new value? sedangkan value lama sudah ter-replace dengan yang baru?
   * mungkin bisa dengan cara ngirim param tambahan. jika current origin sama dengan media url lama. maka pake object_id lama. selain itu yang baru
   */
  @EventPattern(EventKey.READ_ANIME_DETAIL)
  async handleReadAnimeDetail(@Payload() data: ScrapeAnime) {
    if (data.engine === 'html') {
      await this.scrapeWithHTML(data);
    }
  }

  private async scrapeWithHTML(data: ScrapeAnime) {
    const { pageUrl, oldOrigin } = data || { pageUrl: null, oldOrigin: null };
    const parsedPattern: ParsedPattern[] = JSON.parse(
      data?.patternPostDetail?.pattern || '',
    );
    const parsedPaginationPattern: ParsedPattern[] = JSON.parse(
      data?.patternPostDetail?.pagination_pattern || '',
    );
    const patterns: Record<string, string | null> = {};

    for (const key of Object.values(NodeItem)) {
      const patternProperty = this.patternMappings[key]!;

      if (isNotEmpty(patternProperty)) {
        patterns[patternProperty] =
          this.getPattern(parsedPattern, key)?.pattern || null;
      }
    }

    const { containerPattern, ...restPatterns } = patterns;

    if (!containerPattern) {
      return this.logger.error(`${pageUrl} haven't valid container pattern`);
    }

    const result = await this.htmlScraper.detail({
      baseUrl: String(pageUrl),
      oldOrigin,
      parsedPattern,
    });

    if (!arrayNotEmpty(result)) {
      return;
    }

    // console.log(result);

    for (const item of result!) {
      await this.watchService.saveToDB(
        {
          object_id: item?.object_id,
          cover_url: item?.POST_COVER,
          title: item?.POST_TITLE,
          title_jp: item?.POST_TITLE_JP,
          title_en: item?.POST_TITLE_EN,
          type: item?.POST_TYPE,
          score: item?.POST_SCORE,
          status: item?.POST_STATUS,
          duration: item?.POST_DURATION,
          total_episode: item?.POST_TOTAL_EPISODE,
          published: DateTime.fromSeconds(
            Number(item?.PUBLISHED_DATE),
          ).toJSDate(),
          published_ts: Number(item?.PUBLISHED_DATE),
          season: item?.POST_SEASON,
          genres: item?.POST_GENRES,
          producers: item?.POST_PRODUCERS,
          description: item?.POST_DESCRIPTION,
          url: data.pageUrl!,
          media_id: data.mediaId,
        },
        data.mediaId,
        oldOrigin,
      );

      const mediaOpt = this.extractMediaOptions(parsedPattern);
      this.sendToQueueStream(
        data,
        item?.EPISODE_PATTERN,
        mediaOpt?.batch_in_detail ? data?.pageUrl : item?.BATCH_PATTERN,
        mediaOpt,
        item?.object_id!,
        item?.PUBLISHED_DATE!,
      );
    }
  }

  private sendToQueueStream(
    data: ScrapeAnime,
    urlEpisodes: string[] | undefined,
    urlBatch: string | null | undefined,
    mediaOpt: FieldPipeOptionsPattern | undefined,
    watchId: string,
    publishedDate: Date,
  ) {
    if (isNotEmpty(urlBatch)) {
      const payloadBatch: ScrapeAnime = {
        ...data,
        pageUrl: mediaOpt?.batch_in_detail ? data?.pageUrl! : urlBatch!,
        patternPostEpisode: {
          media_id: data.mediaId,
          watchId,
          publishedDate,
          pattern: data?.patternPostEpisode?.pattern!,
        },
      };

      this.clientPostStream.emit(EventKey.READ_ANIME_BATCH, payloadBatch);
    }

    if (arrayNotEmpty(urlEpisodes)) {
      for (const urlEpisode of urlEpisodes!) {
        const payloadEpisode: ScrapeAnime = {
          ...data,
          pageUrl: urlEpisode,
          patternPostEpisode: {
            media_id: data.mediaId,
            watchId,
            publishedDate,
            pattern: data?.patternPostEpisode?.pattern!,
          },
        };

        this.clientPostStream.emit(EventKey.READ_ANIME_STREAM, payloadEpisode);
      }
    }
  }

  private getPattern(parsedPattern: ParsedPattern[], key: string) {
    return parsedPattern?.find((it) => it.key === key);
  }

  private get patternMappings() {
    const patternMappings: Partial<Record<NodeItem, string>> = {
      [NodeItem.POST_CONTAINER]: 'containerPattern',
      [NodeItem.POST_TITLE]: 'titlePattern',
      [NodeItem.POST_TITLE_JP]: 'titleJpPattern',
      [NodeItem.POST_TITLE_EN]: 'titleEnPattern',
      [NodeItem.POST_TYPE]: 'postTypePattern',
      [NodeItem.POST_SCORE]: 'postScorePattern',
      [NodeItem.POST_STATUS]: 'postStatusPattern',
      [NodeItem.POST_DURATION]: 'postDurationPattern',
      [NodeItem.POST_TOTAL_EPISODE]: 'postEpsPattern',
      [NodeItem.POST_SEASON]: 'postSeasonPattern',
      [NodeItem.POST_GENRES]: 'postGenrePattern',
      [NodeItem.POST_PRODUCERS]: 'postProducerPattern',
      [NodeItem.POST_DESCRIPTION]: 'postDescPattern',
      [NodeItem.POST_COVER]: 'postCoverPattern',
      [NodeItem.PUBLISHED_DATE]: 'postPublishedDatePattern',
      [NodeItem.EPISODE_PATTERN]: 'postListEpsPattern',
      [NodeItem.BATCH_PATTERN]: 'postListBatchPattern',
    };

    return patternMappings;
  }

  private extractMediaOptions(
    parsedPatterns: ParsedPattern[],
  ): FieldPipeOptionsPattern | undefined {
    return parsedPatterns?.find(
      (pattern) => pattern?.key === NodeItem.POST_CONTAINER,
    )?.options;
  }
}
