import { EventKey, NodeItem } from '@libs/commons/helper/constant';
import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ScrapeAnime } from '../../../cron-interval/src/cron-interval.service';
import { AcknolageMessageInterceptor } from '../interceptors/acknolage-message.interceptor';
import { ParsedPattern } from '../read-anime/read-anime.controller';
import { HtmlScraperService } from '@libs/commons/html-scraper/html-scraper.service';
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

  private scrapeAnimeDetail() {
    //
  }

  private async scrapeWithHTML(data: ScrapeAnime) {
    const { pageUrl, ...payload } = data;
    const parsedPattern: ParsedPattern[] = JSON.parse(
      data.patternPostDetail.pattern,
    );
    const parsedPaginationPattern: ParsedPattern[] = JSON.parse(
      data.patternPostDetail.pagination_pattern,
    );
    const pContainer =
      this.getPattern(parsedPattern, NodeItem.POST_CONTAINER)?.pattern || null;
    const pTitle =
      this.getPattern(parsedPattern, NodeItem.POST_TITLE)?.pattern || null;
    const pTitleJP =
      this.getPattern(parsedPattern, NodeItem.POST_TITLE_JP)?.pattern || null;
    const pTitleEN =
      this.getPattern(parsedPattern, NodeItem.POST_TITLE_EN)?.pattern || null;
    const pPostType =
      this.getPattern(parsedPattern, NodeItem.POST_TYPE)?.pattern || null;
    const pPostScore =
      this.getPattern(parsedPattern, NodeItem.POST_SCORE)?.pattern || null;
    const pPostStatus =
      this.getPattern(parsedPattern, NodeItem.POST_STATUS)?.pattern || null;
    const pPostDuration =
      this.getPattern(parsedPattern, NodeItem.POST_DURATION)?.pattern || null;
    const pPostEps =
      this.getPattern(parsedPattern, NodeItem.POST_TOTAL_EPISODE)?.pattern ||
      null;
    const pSeason =
      this.getPattern(parsedPattern, NodeItem.POST_SEASON)?.pattern || null;
    const pGenre =
      this.getPattern(parsedPattern, NodeItem.POST_GENRES)?.pattern || null;
    const pProducer =
      this.getPattern(parsedPattern, NodeItem.POST_PRODUCERS)?.pattern || null;
    const pDescription =
      this.getPattern(parsedPattern, NodeItem.POST_DESCRIPTION)?.pattern ||
      null;
    const pCover =
      this.getPattern(parsedPattern, NodeItem.POST_COVER)?.pattern || null;
    const pListEps =
      this.getPattern(parsedPattern, NodeItem.EPISODE_PATTERN)?.pattern || null;

    if (!pContainer) {
      return this.logger.error(
        `${data.pageUrl} haven't valid container pattern`,
      );
    }

    const result = await this.htmlScraper.detail({
      baseUrl: data.pageUrl,
      containerPattern: pContainer,
      titlePattern: pTitle,
      titleJpPattern: pTitleJP,
      titleEnPattern: pTitleEN,
      postTypePattern: pPostType,
      postScorePattern: pPostScore,
      postStatusPattern: pPostStatus,
      postDurationPattern: pPostDuration,
      postEpsPattern: pPostEps,
      postSeasonPattern: pSeason,
      postGenrePattern: pGenre,
      postProducerPattern: pProducer,
      postDescPattern: pDescription,
      postCoverPattern: pCover,
      postListEpsPattern: pListEps,
      contentResultType: 'text',
    });
<<<<<<< HEAD
    // console.log(`result`, result);
=======
    console.log(`result`, result);
>>>>>>> 52cdb53cedd47ffb12ab82f4aee89182589ecf85

    await this.watchService.saveToDB(
      {
        object_id: result.object_id,
        cover_url: result.cover_url,
        title: result.title,
        title_jp: result.title_jp,
        title_en: result.title_en,
        type: result.type,
<<<<<<< HEAD
        score: 0, //result.score,
=======
        score: result.score,
>>>>>>> 52cdb53cedd47ffb12ab82f4aee89182589ecf85
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
      },
      data.mediaId,
    );
  }

  private getPattern(parsedPattern: ParsedPattern[], key: string) {
    switch (key) {
      case NodeItem.POST_CONTAINER:
        return parsedPattern.find((it) => it.key === NodeItem.POST_CONTAINER);
      case NodeItem.POST_TITLE:
        return parsedPattern.find((it) => it.key === NodeItem.POST_TITLE);
      case NodeItem.POST_TITLE_JP:
        return parsedPattern.find((it) => it.key === NodeItem.POST_TITLE_JP);
      case NodeItem.POST_TITLE_EN:
        return parsedPattern.find((it) => it.key === NodeItem.POST_TITLE_EN);
      case NodeItem.POST_TYPE:
        return parsedPattern.find((it) => it.key === NodeItem.POST_TYPE);
      case NodeItem.POST_SCORE:
        return parsedPattern.find((it) => it.key === NodeItem.POST_SCORE);
      case NodeItem.POST_STATUS:
        return parsedPattern.find((it) => it.key === NodeItem.POST_STATUS);
      case NodeItem.POST_DURATION:
        return parsedPattern.find((it) => it.key === NodeItem.POST_DURATION);
      case NodeItem.POST_TOTAL_EPISODE:
        return parsedPattern.find(
          (it) => it.key === NodeItem.POST_TOTAL_EPISODE,
        );
      case NodeItem.POST_SEASON:
        return parsedPattern.find((it) => it.key === NodeItem.POST_SEASON);
      case NodeItem.POST_GENRES:
        return parsedPattern.find((it) => it.key === NodeItem.POST_GENRES);
      case NodeItem.POST_PRODUCERS:
        return parsedPattern.find((it) => it.key === NodeItem.POST_PRODUCERS);
      case NodeItem.POST_DESCRIPTION:
        return parsedPattern.find((it) => it.key === NodeItem.POST_DESCRIPTION);
      case NodeItem.POST_COVER:
        return parsedPattern.find((it) => it.key === NodeItem.POST_COVER);
      case NodeItem.EPISODE_PATTERN:
        return parsedPattern.find((it) => it.key === NodeItem.EPISODE_PATTERN);
    }
  }
}
