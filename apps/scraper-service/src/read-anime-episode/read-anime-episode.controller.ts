import { EventKey, NodeItem } from '@libs/commons/helper/constant';
import {
  HtmlScraperService,
  ParsedPattern,
} from '@libs/commons/html-scraper/html-scraper.service';
import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StreamService } from 'apps/api/src/stream/stream.service';
import { ScrapeAnime } from 'apps/cron-interval/src/cron-interval.service';
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
      data?.patternPostDetail?.pattern || '',
    );
    const parsedPaginationPattern: ParsedPattern[] = JSON.parse(
      data?.patternPostDetail?.pagination_pattern || '',
    );
    const patterns: Record<string, string | null> = {};

    for (const key of Object.values(NodeItem)) {
      const patternProperty = this.patternMappings[key]!;
      patterns[patternProperty] =
        this.getPattern(parsedPattern, key)?.pattern || null;
    }

    const { containerPattern, ...restPatterns } = patterns;

    if (!containerPattern) {
      return this.logger.error(`${pageUrl} haven't valid container pattern`);
    }

    const result = await this.htmlScraper.episode({
      baseUrl: String(pageUrl),
      oldOrigin,
      parsedPattern,
    });
  }

  private getPattern(parsedPattern: ParsedPattern[], key: string) {
    return parsedPattern?.find((it) => it.key === key);
  }

  private get patternMappings() {
    const patternMappings: Partial<Record<NodeItem, string>> = {
      [NodeItem.EPISODE_CONTAINER]: 'containerEpisode',
      [NodeItem.EPISODE_PROVIDER]: 'providerPattern',
      [NodeItem.EPISODE_HASH]: 'hashPattern',
    };

    return patternMappings;
  }
}
