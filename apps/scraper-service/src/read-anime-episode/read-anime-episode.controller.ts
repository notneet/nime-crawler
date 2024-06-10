import { EventKey, NodeItem } from '@libs/commons/helper/constant';
import {
  HtmlScraperService,
  ParsedPattern,
} from '@libs/commons/html-scraper/html-scraper.service';
import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StreamService } from 'apps/api/src/stream/stream.service';
import { ScrapeAnime } from 'apps/cron-interval/src/cron-interval.service';
import { arrayNotEmpty, isEmpty, isNotEmpty } from 'class-validator';
import { remove } from 'lodash';
import { DateTime } from 'luxon';
import { AcknolageMessageInterceptor } from '../interceptors/acknolage-message.interceptor';

@Controller('read-anime-episode')
@UseInterceptors(AcknolageMessageInterceptor)
export class ReadAnimeEpisodeController {
  private readonly logger = new Logger(ReadAnimeEpisodeController.name);

  constructor(
    private readonly htmlScraper: HtmlScraperService,
    private readonly streamService: StreamService,
  ) {}

  @EventPattern(EventKey.READ_ANIME_STREAM)
  async handleReadAnimeDetail(@Payload() data: ScrapeAnime) {
    if (data.engine === 'html') {
      await this.scrapeWithHTML(data);
    }
  }

  @EventPattern(EventKey.READ_ANIME_BATCH)
  async handleReadAnimeBatch(@Payload() data: ScrapeAnime) {
    if (data.engine === 'html') {
      await this.scrapeBatchWithHTML(data);
    }
  }

  private async scrapeWithHTML(data: ScrapeAnime) {
    const { pageUrl, oldOrigin } = data || { pageUrl: null, oldOrigin: null };
    const parsedPattern: ParsedPattern[] = JSON.parse(
      data?.patternPostEpisode?.pattern || '',
    );
    const patterns: Record<string, string | null> = {};

    for (const key of Object.values(NodeItem)) {
      const patternProperty = this.patternMappings[key]!;

      if (isNotEmpty(patternProperty)) {
        patterns[patternProperty] =
          this.getPattern(parsedPattern, key)?.pattern || null;
      }
    }

    const { containerEpisode, ...restPatterns } = patterns;

    if (!containerEpisode) {
      return this.logger.error(`${pageUrl} haven't valid container pattern`);
    }

    // console.log(pageUrl, 'scrapeWithHTML');

    // const [provider360, provider480, provider720] =
    //   await this.htmlScraper.episode({
    //     baseUrl: String(pageUrl),
    //     oldOrigin,
    //     parsedPattern,
    //   });

    // await this.save(
    //   provider360,
    //   data?.patternPostEpisode?.watchId!,
    //   data?.mediaId,
    //   '360',
    // );

    // await this.save(
    //   provider480,
    //   data?.patternPostEpisode?.watchId!,
    //   data?.mediaId,
    //   '480',
    // );

    // await this.save(
    //   provider720,
    //   data?.patternPostEpisode?.watchId!,
    //   data?.mediaId,
    //   '720',
    // );
  }

  private async scrapeBatchWithHTML(data: ScrapeAnime) {
    const { pageUrl, oldOrigin } = data || { pageUrl: null, oldOrigin: null };
    const parsedPattern: ParsedPattern[] = remove(
      JSON.parse(data?.patternPostEpisode?.pattern || ''),
      (obj) => obj?.key?.startsWith('BATCH_'),
    );
    const patterns: Record<string, string | null> = {};

    if (isEmpty(data?.patternPostEpisode?.watchId)) {
      return this.logger.error(
        `${pageUrl} haven't valid watchId while scrape batch`,
      );
    }

    for (const key of Object.values(NodeItem)) {
      const patternProperty = this.patternBatchMappings[key]!;

      if (isNotEmpty(patternProperty)) {
        patterns[patternProperty] =
          this.getPattern(parsedPattern, key)?.pattern || null;
      }
    }

    const { containerBatch, ...restPatterns } = patterns;

    if (!containerBatch) {
      return this.logger.error(`${pageUrl} haven't valid container pattern`);
    }

    const result = await this.htmlScraper.batch({
      baseUrl: String(pageUrl),
      watchId: data?.patternPostEpisode?.watchId!,
      parsedPattern,
    });

    if (!arrayNotEmpty(result)) {
      return;
    }

    // console.log(result);

    for (const item of result!) {
      const itemPublishedDate = isEmpty(item?.BATCH_PUBLISHED_DATE)
        ? data?.patternPostEpisode?.publishedDate
        : item?.BATCH_PUBLISHED_DATE;

      await this.streamService.saveToDB(
        {
          watch_id: data?.patternPostEpisode?.watchId!,
          author: item?.BATCH_AUTHOR!,
          published: DateTime.fromSeconds(Number(itemPublishedDate)).toJSDate(),
          published_ts: Number(itemPublishedDate),
          num_episode: 0,
          object_id: item?.object_id,
          type: 'batch',
          name: item?.BATCH_TITLE!,
          url: data?.pageUrl!,
          providers: JSON.stringify(item?.BATCH_ITEMS || {}) || undefined,
          quality: item?.BATCH_RESOLUTION || undefined,
          file_size: '',
          media_id: data?.mediaId,
        },
        data?.mediaId,
      );
    }
  }

  private getPattern(parsedPattern: ParsedPattern[], key: string) {
    return parsedPattern?.find((it) => it.key === key);
  }

  private get patternMappings() {
    const patternMappings: Partial<Record<NodeItem, string>> = {
      [NodeItem.EPISODE_CONTAINER]: 'containerEpisode',
      [NodeItem.EPISODE_PROVIDER]: 'providerPattern',
      [NodeItem.EPISODE_LINK]: 'linkPattern',
    };

    return patternMappings;
  }

  private get patternBatchMappings() {
    const patternMappings: Partial<Record<NodeItem, string>> = {
      [NodeItem.BATCH_CONTAINER]: 'containerBatch',
      [NodeItem.BATCH_AUTHOR]: 'authorPattern',
      [NodeItem.BATCH_TITLE]: 'titlePattern',
      [NodeItem.BATCH_LIST]: 'batchListPattern',
      [NodeItem.BATCH_PROVIDER]: 'batchPattern',
      [NodeItem.BATCH_RESOLUTION]: 'batchResolutionPattern',
      [NodeItem.BATCH_LINK]: 'batchLinkPattern',
      [NodeItem.BATCH_SIZE]: 'batchSizePattern',
      [NodeItem.BATCH_PUBLISHED_DATE]: 'batchPublishedDatePattern',
    };

    return patternMappings;
  }
}
