import {
  EventKey,
  NodeItem,
  Q_ANIME_SOURCE,
  Q_ANIME_SOURCE_DETAIL,
} from '@libs/commons/helper/constant';
import { HtmlScraperService } from '@libs/commons/html-scraper/html-scraper.service';
import { Controller, Inject, Logger, UseInterceptors } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { isEmpty, isNotEmpty } from 'class-validator';
import { ScrapeAnime } from '../../../cron-interval/src/cron-interval.service';
import { AcknolageMessageInterceptor } from '../interceptors/acknolage-message.interceptor';

export interface ParsedPattern {
  key: string;
  pattern: string;
  result_type: 'text' | 'value';
}

@Controller()
@UseInterceptors(AcknolageMessageInterceptor)
export class ReadAnimeController {
  private readonly logger = new Logger(ReadAnimeController.name);

  constructor(
    private readonly htmlScraper: HtmlScraperService,
    @Inject(Q_ANIME_SOURCE) private readonly clientPost: ClientProxy,
    @Inject(Q_ANIME_SOURCE_DETAIL)
    private readonly clientPostDetail: ClientProxy,
  ) {}

  @EventPattern(EventKey.READ_ANIME_SOURCE)
  async handleReadAnime(@Payload() data: ScrapeAnime) {
    if (data.engine === 'html') {
      await this.scrapeWithHTML(data);
    }
  }

  private scrapeAnimePost() {
    //
  }

  private async scrapeWithHTML(data: ScrapeAnime) {
    if (isEmpty(data.pageUrl)) return;

    const { pageUrl, ...payload } = data;
    const parsedPattern: ParsedPattern[] = JSON.parse(
      data.patternPost!.pattern,
    );
    const parsedPaginationPattern: ParsedPattern[] = JSON.parse(
      data.patternPost!.pagination_pattern,
    );
    const pContainer =
      parsedPattern.find((it) => it.key === NodeItem.CONTAINER)?.pattern ||
      null;
    const tPattern =
      parsedPattern.find((it) => it.key === NodeItem.LINK_PATTERN)?.pattern ||
      null;
    const tResultType =
      parsedPattern.find((it) => it.key === NodeItem.LINK_PATTERN)
        ?.result_type || null;
    const pPagination =
      parsedPaginationPattern.find(
        (it) => it.key === NodeItem.PAGINATION_PATTERN,
      )?.pattern || null;

    if (!pContainer || !tPattern) {
      return this.logger.error(`${data.pageUrl} haven't valid pattern`);
    }
    if (!tResultType && tResultType !== 'text' && tResultType !== 'value') {
      return this.logger.error(`Cannot parse result as ${tResultType}`);
    }

    const [contents, urlNextPage] = await this.htmlScraper.post({
      baseUrl: data.pageUrl!,
      containerPattern: pContainer,
      valuePattern: tPattern,
      contentResultType: tResultType,
      secondaryPattern: pPagination,
    });

    for (const urlPostDetail of contents) {
      if (pageUrl !== null) {
        const newData = {
          pageUrl: urlPostDetail,
          ...payload,
        };

        this.emitPostDetail(newData);
      }
    }

    data.pageUrl = urlNextPage;
    if (isNotEmpty(data?.pageUrl)) {
      this.emitNextPage(data);
    }
  }

  private async emitPostDetail(data: ScrapeAnime) {
    this.clientPostDetail.emit(EventKey.READ_ANIME_DETAIL, data);
  }

  private emitNextPage(data: ScrapeAnime) {
    this.clientPost.emit(EventKey.READ_ANIME_SOURCE, data);
  }
}
