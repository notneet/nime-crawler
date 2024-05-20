import { EventKey, NodeItem } from '@libs/commons/helper/constant';
import {
  AnimeEpisode,
  HtmlScraperService,
  ParsedPattern,
} from '@libs/commons/html-scraper/html-scraper.service';
import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StreamService } from 'apps/api/src/stream/stream.service';
import { ScrapeAnime } from 'apps/cron-interval/src/cron-interval.service';
import { isEmpty } from 'class-validator';
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

  private async scrapeWithHTML(data: ScrapeAnime) {
    const { pageUrl, oldOrigin } = data || { pageUrl: null, oldOrigin: null };
    const parsedPattern: ParsedPattern[] = JSON.parse(
      data?.patternPostEpisode?.pattern || '',
    );
    const patterns: Record<string, string | null> = {};

    for (const key of Object.values(NodeItem)) {
      const patternProperty = this.patternMappings[key]!;
      if (isEmpty(patternProperty)) continue;
      patterns[patternProperty] =
        this.getPattern(parsedPattern, key)?.pattern || null;
    }

    const { containerEpisode, ...restPatterns } = patterns;

    if (!containerEpisode) {
      return this.logger.error(`${pageUrl} haven't valid container pattern`);
    }

    const [provider360, provider480, provider720] =
      await this.htmlScraper.episode({
        baseUrl: String(pageUrl),
        oldOrigin,
        parsedPattern,
      });

    await this.save(
      provider360,
      data?.patternPostEpisode?.watchId!,
      data?.mediaId,
      '360',
    );

    await this.save(
      provider480,
      data?.patternPostEpisode?.watchId!,
      data?.mediaId,
      '480',
    );

    await this.save(
      provider720,
      data?.patternPostEpisode?.watchId!,
      data?.mediaId,
      '720',
    );
  }

  private async save(
    datas: AnimeEpisode[],
    watchId: string,
    mediaId: number,
    quality: string,
  ) {
    for (const data of datas) {
      await this.streamService.saveToDB(
        {
          watch_id: watchId,
          object_id: data.object_id,
          author: data.EPISODE_PROVIDER as string,
          published: DateTime.now().toJSDate(),
          published_ts: DateTime.now().toJSDate(),
          num_episode: 1,
          name: '',
          url: data.EPISODE_HASH as string,
          quality,
          file_size: '',
          type: 'video',
          media_id: mediaId,
        },
        mediaId,
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
}
