import { EventKey, NodeItem } from '@libs/commons/helper/constant';
import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ScrapeAnime } from '../../../cron-interval/src/cron-interval.service';
import { AcknolageMessageInterceptor } from '../interceptors/acknolage-message.interceptor';
import { ParsedPattern } from '../read-anime/read-anime.controller';
import {
  HtmlScraperService,
  WebsiteDetailPayload,
} from '@libs/commons/html-scraper/html-scraper.service';
import { WatchService } from 'apps/api/src/watch/watch.service';

@Controller()
@UseInterceptors(AcknolageMessageInterceptor)
export class ReadAnimePostController {
  private readonly logger = new Logger(ReadAnimePostController.name);

  constructor(
    private readonly htmlScraper: HtmlScraperService,
    private readonly watchService: WatchService,
  ) {}

  @EventPattern(EventKey.READ_ANIME_DETAIL)
  async handleReadAnimeDetail(@Payload() data: ScrapeAnime) {
    if (data.engine === 'html') {
      await this.scrapeWithHTML(data);
    }
  }

  private async scrapeWithHTML(data: ScrapeAnime) {
    const { pageUrl } = data || { pageUrl: null };
    const parsedPattern: ParsedPattern[] = JSON.parse(
      data?.patternPostDetail?.pattern || '',
    );
    const parsedPaginationPattern: ParsedPattern[] = JSON.parse(
      data?.patternPostDetail?.pagination_pattern || '',
    );
    const patterns: Record<string, string | null> = {};

    for (const key of Object.values(NodeItem)) {
      const patternProperty = this.patternMappings[key];
      patterns[patternProperty] =
        this.getPattern(parsedPattern, key)?.pattern || null;
    }

    const { containerPattern, ...restPatterns } = patterns;

    if (!containerPattern) {
      return this.logger.error(`${pageUrl} haven't valid container pattern`);
    }

    const result = await this.htmlScraper.detail({
      baseUrl: pageUrl,
      containerPattern,
      contentResultType: 'text',
      ...restPatterns,
    } as WebsiteDetailPayload);

    await this.watchService.saveToDB(
      {
        object_id: result.object_id,
        cover_url: result.cover_url,
        title: result.title,
        title_jp: result.title_jp,
        title_en: result.title_en,
        type: result.type,
        score: result.score,
        status: result.status,
        duration: result.duration,
        total_episode: result.total_episode,
        published: result.published,
        published_ts: result.published ? new Date(result.published) : null,
        season: result.season,
        genres: result.genres,
        producers: result.producers,
        description: result.description,
        url: data.pageUrl,
        media_id: data.mediaId,
        n_status: result.n_status,
      },
      data.mediaId,
    );
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
      [NodeItem.EPISODE_PATTERN]: 'postListEpsPattern',
    };

    return patternMappings;
  }
}
