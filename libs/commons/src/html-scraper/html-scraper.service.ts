import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { plainToInstance } from 'class-transformer';
import { arrayNotEmpty, isEmpty, isNotEmpty } from 'class-validator';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as libxmljs from 'libxmljs2';
import { fromPairs, zip } from 'lodash';
import * as useragent from 'random-useragent';
import { catchError, lastValueFrom, map, of, retry } from 'rxjs';
import {
  CleanerTypeRules,
  FieldPipeOptionsPattern,
  FieldPipePattern,
} from '../entities/field-field-pattern';
import {
  AnimeDetailField,
  ExistAnimeDetailKeys,
} from '../entities/post-detail-pattern.entity';
import {
  AnimeBatchField,
  AnimeEpisodeField,
  ExistAnimeBatchKeys,
  ExistAnimeEpisodeKeys,
} from '../entities/post-episode-pattern.entity';
import {
  AnimePostField,
  ExistAnimePostKeys,
} from '../entities/post-pattern.entity';
import { EnvKey, TimeUnit } from '../helper/constant';
import { hashUUID } from '../helper/md5';
import { mappingStreamProviderByQuality } from '../helper/otakudesu-episode-mapping';
import { StringHelperService } from '../string-helper/string-helper.service';
import { SystemMonitorService } from '../system-monitor/system-monitor.service';

export interface ParsedPattern {
  key: string;
  pattern: string;
  result_type: string;
  options?: FieldPipeOptionsPattern;
  pipes?: CleanerTypeRules;
}

export interface WebsitePayload {
  baseUrl: string;
  rawHTML?: string;
  patterns?: AnimePostField;
  containerPattern: string;
  valuePattern: string;
  contentResultType: 'value' | 'text';
  secondaryPattern?: string | null;
}

export interface WebsiteDetailPayload {
  baseUrl: string;
  oldOrigin?: string | null | undefined;
  rawHTML?: string;
  parsedPattern: ParsedPattern[];
}

export interface WebsiteEpisodePayload extends WebsiteDetailPayload {
  watchId: string;
}

export interface AnimeDetail {
  object_id: string;
  POST_TITLE: string;
  POST_TITLE_JP: string;
  POST_TITLE_EN: string;
  POST_TYPE: string;
  POST_SCORE: number;
  POST_STATUS: string;
  POST_DURATION: number;
  POST_TOTAL_EPISODE: number;
  PUBLISHED_DATE: Date | null;
  POST_SEASON: string;
  POST_GENRES: string | null;
  POST_PRODUCERS: string;
  POST_DESCRIPTION: string;
  POST_COVER: string;
  BATCH_PATTERN: string | null;
  EPISODE_PATTERN: string[];
}

export interface AnimeEpisode {
  object_id: string;
  EPISODE_PROVIDER: string[] | string;
  EPISODE_HASH: string[] | string;
}

export interface AnimeBatch {
  object_id: string;
  BATCH_AUTHOR: string | null;
  BATCH_TITLE: string | null;
  BATCH_RESOLUTION: string | null;
  BATCH_ITEMS: Record<string, string> | null;
  BATCH_PUBLISHED_DATE: Date | null;
}

export interface AnimeBatchLinks {
  BATCH_PROVIDER: string | null;
  BATCH_LINK: string | null;
}

@Injectable()
export class HtmlScraperService {
  private readonly logger = new Logger(HtmlScraperService.name);

  constructor(
    private readonly htmlService: HttpService,
    private readonly systemMonitService: SystemMonitorService,
    private readonly stringHelperService: StringHelperService,
    private readonly config: ConfigService,
  ) {}

  async post(payload: WebsitePayload): Promise<[string[], string]> {
    const { data } = await this.getHTML(payload.baseUrl);

    if (typeof data !== 'string') {
      this.logger.error(`HTML result not found`);
      return [[''], ''];
    }

    return this.evalutePostWebsite({ rawHTML: data, ...payload });
  }

  async detail(payload: WebsiteDetailPayload) {
    const { data } = await this.getHTML(payload.baseUrl);

    if (typeof data !== 'string') {
      this.logger.error(`HTML result not found`);
      return;
    }

    return this.pipeData(
      await this.evalutePostDetailWebsite({ rawHTML: data, ...payload }),
      payload?.parsedPattern,
      payload?.baseUrl,
    ) as AnimeDetail;
  }

  async episode(
    payload: WebsiteEpisodePayload,
  ): Promise<[AnimeEpisode[], AnimeEpisode[], AnimeEpisode[]]> {
    const { data } = await this.getHTML(payload.baseUrl);

    if (typeof data !== 'string') {
      this.logger.error(`HTML result not found`);
      return [[], [], []];
    }

    return this.evaluteEpisodeWebsite({
      rawHTML: data,
      ...payload,
    });
  }

  async batch(payload: WebsiteEpisodePayload) {
    const { data } = await this.getHTML(payload.baseUrl);

    if (typeof data !== 'string') {
      this.logger.error(`HTML result not found`);
      return;
    }

    return this.pipeData(
      await this.evaluteBatchWebsite({ rawHTML: data, ...payload }),
      payload?.parsedPattern,
      payload?.baseUrl,
    ) as AnimeBatch[];
  }

  private async evalutePostWebsite(
    payload: WebsitePayload,
  ): Promise<[string[], string]> {
    let document: libxmljs.Document;
    let content: string[] = [];
    let paginationLink: string = '';

    try {
      document = libxmljs.parseHtmlString(payload.rawHTML!);

      if (!document) {
        throw new Error('Document is empty');
      }
      const resultContentXpath = document.find(
        this.makeXpath(payload?.containerPattern, payload?.valuePattern),
      );
      content.push(
        ...this.getContent(resultContentXpath, payload.contentResultType),
      );
      if (payload?.secondaryPattern) {
        const paginationXpath = document.get(`${payload?.secondaryPattern}`);
        paginationLink = paginationXpath
          ? (<any>paginationXpath).value()
          : null;
      }

      return [content, paginationLink];
    } catch (error) {
      throw new Error('Fail parse the html result');
    }
  }

  private async evalutePostDetailWebsite(payload: WebsiteDetailPayload) {
    let document: libxmljs.Document;

    try {
      document = libxmljs.parseHtmlString(payload.rawHTML!);
      if (!document) {
        throw new Error('Document is empty');
      }

      const genreContentXpath = document.find(
        // this.makeXpath(payload?.containerPattern, payload?.postGenrePattern),
        this.makeXpathNew<ExistAnimeDetailKeys>(
          ExistAnimeDetailKeys.POST_GENRES,
          payload?.parsedPattern,
        ),
      );
      const coverContentXpath = document.find(
        // this.makeXpath(payload?.containerPattern, payload?.postCoverPattern),
        this.makeXpathNew<ExistAnimeDetailKeys>(
          ExistAnimeDetailKeys.POST_COVER,
          payload?.parsedPattern,
        ),
      );
      const listEpsContentXpath = document.find(
        // this.makeXpath(payload?.containerPattern, payload?.postListEpsPattern),
        this.makeXpathNew<ExistAnimeDetailKeys>(
          ExistAnimeDetailKeys.POST_EPISODES,
          payload?.parsedPattern,
        ),
      );
      const descriptionComponent = document.find(
        // this.makeXpath(payload?.containerPattern, payload?.postDescPattern),
        this.makeXpathNew<ExistAnimeDetailKeys>(
          ExistAnimeDetailKeys.POST_DESCRIPTION,
          payload?.parsedPattern,
        ),
      );
      const listBatchContentXpath = document.find(
        this.makeXpathNew<ExistAnimeDetailKeys>(
          ExistAnimeDetailKeys.POST_BATCH,
          payload?.parsedPattern,
        ),
      );

      const data: AnimeDetail = {
        object_id: this.stringHelperService.createUUID(
          payload?.baseUrl,
          payload?.oldOrigin,
        ),
        POST_TITLE: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.titlePattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TITLE,
            payload?.parsedPattern,
          ),
        ),
        POST_TITLE_JP: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.titleJpPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TITLE_JP,
            payload?.parsedPattern,
          ),
        ),
        POST_TITLE_EN: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.titleEnPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TITLE_EN,
            payload?.parsedPattern,
          ),
        ),
        POST_TYPE: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.postTypePattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TYPE,
            payload?.parsedPattern,
          ),
        ),
        POST_SCORE: Number(
          this.getSingleContent<number>(
            document,
            // this.makeXpath(payload?.containerPattern, payload?.postScorePattern),
            this.makeXpathNew<ExistAnimeDetailKeys>(
              ExistAnimeDetailKeys.POST_SCORE,
              payload?.parsedPattern,
            ),
            'number',
          ) || 0,
        ),
        POST_STATUS: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.postStatusPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_STATUS,
            payload?.parsedPattern,
          ),
        ),
        POST_DURATION:
          this.getSingleContent<number>(
            document,
            this.makeXpathNew<ExistAnimeDetailKeys>(
              ExistAnimeDetailKeys.POST_DURATION,
              payload?.parsedPattern,
            ),
          ) || 0,
        POST_TOTAL_EPISODE:
          this.getSingleContent<number>(
            document,
            // this.makeXpath(payload?.containerPattern, payload?.postEpsPattern),
            this.makeXpathNew<ExistAnimeDetailKeys>(
              ExistAnimeDetailKeys.POST_TOTAL_EPISODE,
              payload?.parsedPattern,
            ),
          ) || 0,
        PUBLISHED_DATE: this.getSingleContent<string>(
          document,
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.PUBLISHED_DATE,
            payload?.parsedPattern,
          ),
        ) as any,
        POST_SEASON: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.postSeasonPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_SEASON,
            payload?.parsedPattern,
          ),
        ),
        POST_GENRES:
          this.getContent(genreContentXpath, 'text')?.join(',') || null,
        POST_PRODUCERS: this.getSingleContent<string>(
          document,
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_PRODUCERS,
            payload?.parsedPattern,
          ),
        )
          ?.split(', ')
          ?.join(','),
        POST_DESCRIPTION: this.getContent(descriptionComponent, 'text')?.join(
          '\n',
        ),
        POST_COVER: this.getContent(coverContentXpath, 'value')?.join(','),
        BATCH_PATTERN:
          this.getContent(listBatchContentXpath, 'value')?.join(',') || null,
        EPISODE_PATTERN: this.getContent(listEpsContentXpath, 'value'),
      };

      return data;
    } catch (error) {
      throw new Error('Fail parse the html result');
    }
  }

  private async evaluteEpisodeWebsite(
    payload: WebsiteEpisodePayload,
  ): Promise<[AnimeEpisode[], AnimeEpisode[], AnimeEpisode[]]> {
    let document: libxmljs.Document;

    try {
      document = libxmljs.parseHtmlString(payload.rawHTML!);
      if (!document) {
        throw new Error('Document is empty');
      }

      const listProviderContentXpath = document.find(
        this.makeXpathNew<ExistAnimeEpisodeKeys>(
          ExistAnimeEpisodeKeys.EPISODE_PROVIDER,
          payload?.parsedPattern,
        ),
      );
      const listHashContentXpath = document.find(
        this.makeXpathNew<ExistAnimeEpisodeKeys>(
          ExistAnimeEpisodeKeys.EPISODE_HASH,
          payload?.parsedPattern,
        ),
      );
      const rawContent: AnimeEpisode = {
        object_id: hashUUID(
          this.replaceUrl(payload?.baseUrl, String(payload?.oldOrigin)),
        ),
        EPISODE_PROVIDER: this.getContent(listProviderContentXpath, 'text'),
        EPISODE_HASH: this.getContent(listHashContentXpath, 'value'),
      };

      return mappingStreamProviderByQuality(rawContent);
    } catch (error) {
      throw new Error('Fail parse the html result');
    }
  }

  private async evaluteBatchWebsite(payload: WebsiteEpisodePayload) {
    let document: libxmljs.Document;

    try {
      document = libxmljs.parseHtmlString(payload.rawHTML!);
      if (!document) {
        throw new Error('Document is empty');
      }

      const listContainer = document.find(
        this.makeXpathNew<ExistAnimeBatchKeys>(
          ExistAnimeBatchKeys.BATCH_CONTAINER,
          payload?.parsedPattern,
        ),
      );

      let data: Partial<AnimeBatch>[] = [];
      if (isEmpty(listContainer)) return data;

      listContainer?.map((docContainer: libxmljs.Element, i) => {
        const listBatchProviderItems = this.getContent(
          docContainer.find(
            this.makeXpathNew<ExistAnimeBatchKeys>(
              ExistAnimeBatchKeys.BATCH_PROVIDER,
              payload?.parsedPattern,
            ),
          ),
          'text',
        );
        const listBatchLinkItems = this.getContent(
          docContainer.find(
            this.makeXpathNew<ExistAnimeBatchKeys>(
              ExistAnimeBatchKeys.BATCH_LINK,
              payload?.parsedPattern,
            ),
          ),
          'value',
        );
        const batchResolutionItem =
          this.getContent(
            docContainer.find(
              this.makeXpathNew<ExistAnimeBatchKeys>(
                ExistAnimeBatchKeys.BATCH_RESOLUTION,
                payload?.parsedPattern,
              ),
            ),
            'text',
          )?.join(',') || null;
        const batchAuthor =
          this.getContent(
            docContainer.find(
              this.makeXpathNew<ExistAnimeBatchKeys>(
                ExistAnimeBatchKeys.BATCH_AUTHOR,
                payload?.parsedPattern,
              ),
            ),
            'text',
          )?.join(',') || null;
        const batchTitle =
          this.getContent(
            docContainer.find(
              this.makeXpathNew<ExistAnimeBatchKeys>(
                ExistAnimeBatchKeys.BATCH_TITLE,
                payload?.parsedPattern,
              ),
            ),
            'text',
          )?.join(',') || null;
        const batchPubDate =
          this.getContent(
            docContainer.find(
              this.makeXpathNew<ExistAnimeBatchKeys>(
                ExistAnimeBatchKeys.BATCH_PUBLISHED_DATE,
                payload?.parsedPattern,
              ),
            ),
            'text',
          )?.join(',') || null;

        data.push({
          object_id: this.stringHelperService.createUUID(
            `${payload?.baseUrl}-${payload?.watchId}-${i}`,
            payload?.oldOrigin,
          ),
          BATCH_AUTHOR: batchAuthor,
          BATCH_TITLE: batchTitle,
          BATCH_RESOLUTION: batchResolutionItem,
          BATCH_ITEMS: fromPairs(
            zip(listBatchProviderItems, listBatchLinkItems),
          ),
          BATCH_PUBLISHED_DATE: batchPubDate as any,
        });
      });

      return data;
    } catch (error) {
      throw new Error('Fail parse the html result');
    }
  }

  private async getHTML(url: string): Promise<{ data: string | null }> {
    let isUseProxy = false;
    const proxyServer = this.config.get<string>(EnvKey.PROXY_SERVER, '');
    const userAgent = useragent.getRandom((it) => {
      return (
        it.folder.startsWith('/Browsers - ') &&
        it.browserName === 'Chrome' &&
        Number(it.browserMajor) > 50
      );
    });
    const fastCrawl = this.stringHelperService.convertStringBoolean(
      this.config.get<string>(EnvKey.USE_FAST, 'false'),
    );
    const waitSecondTime =
      this.config.get<number>(EnvKey.SLEEP_TIME_SECOND, 6) * TimeUnit.SECOND;
    const randomWaitTime =
      Math.floor(Math.random() * (waitSecondTime - 3 + 1)) + 3;
    this.logger.debug(
      `load ${url} with ua: ${userAgent}; sleep ${randomWaitTime}ms...`,
    );
    const resHTML = await lastValueFrom(
      this.htmlService
        .get(url, {
          headers: { 'User-Agent': userAgent },
          httpsAgent: isUseProxy ? new HttpsProxyAgent(proxyServer) : false,
        })
        .pipe(
          retry({
            count: 5,
            delay: 3 * TimeUnit.SECOND,
          }),
          catchError((error: AxiosError) => {
            if (error.code === 'CERT_HAS_EXPIRED') {
              const htmlResponseMessage = `${new URL(url).origin} has invalid certificate`;
              this.logger.warn(htmlResponseMessage);
              this.systemMonitService.sendAlert(
                'warning',
                htmlResponseMessage,
                error?.stack,
                error?.code,
              );

              return of({ data: null });
            }

            throw error;
          }),
          map(({ data }) => {
            return {
              data: data,
            };
          }),
        ),
    );

    if (!Boolean(fastCrawl)) {
      await new Promise((resolve) => setTimeout(resolve, randomWaitTime));
    }

    return resHTML ? resHTML : { data: null };
  }

  private makeXpathNew<T>(fieldName: T, rawPattern: ParsedPattern[]) {
    const containerItem = rawPattern?.find(
      (pattern) =>
        pattern.key === ExistAnimePostKeys.CONTAINER ||
        pattern.key === ExistAnimeDetailKeys.POST_CONTAINER ||
        pattern.key === ExistAnimeBatchKeys.BATCH_CONTAINER ||
        pattern.key === ExistAnimeEpisodeKeys.EPISODE_CONTAINER,
    );
    const contentItem = rawPattern?.find(
      (pattern) => pattern?.key === fieldName,
    );
    const containerPattern = containerItem?.pattern;
    const contentPattern = contentItem?.pattern;
    const contentOption = contentItem?.options;

    if (isEmpty(contentPattern)) {
      this.logger.warn(`${fieldName} has pattern: '${contentPattern}'`);
      return '';
    }

    return contentOption?.mix_with_container
      ? `${containerPattern}/${contentPattern}` || ''
      : contentPattern || '';
  }

  private makeXpath(...rawXpath: string[]) {
    return rawXpath.join('/');
  }

  private getContent(rawDocument: libxmljs.Node[], type: 'text' | 'value') {
    let result: string[] = [];
    switch (type) {
      case 'text':
        if (!arrayNotEmpty(rawDocument)) return [];

        rawDocument.forEach((val) => result.push((<any>val).text()));
        break;
      case 'value':
        if (!arrayNotEmpty(rawDocument)) return [];

        rawDocument.forEach((val) => result.push((<any>val).value()));
        break;
      default:
        throw new Error(`Please choose the type: ${typeof type}`);
    }
    return result;
  }

  private getSingleContent<T>(
    rawDocument: libxmljs.Document,
    mixedPattern: string,
    returnType?: 'string' | 'number',
  ): T {
    if (mixedPattern?.endsWith('/') || isEmpty(mixedPattern)) return null as T;

    const regexDecimal = /[0-9]+(\.[0-9]+)?/g;
    const isFound = rawDocument.get(mixedPattern);

    if (!isNotEmpty(isFound)) return null as T;
    if (returnType === 'number') {
      const extractedResult = isFound?.toString()?.replace(/^:?\s*/, '');

      if (
        isNotEmpty(extractedResult) &&
        !isNaN(Number(extractedResult)) &&
        extractedResult !== '-'
      ) {
        return extractedResult?.match(regexDecimal)![0] as T;
      }

      return null as T;
    } else {
      return isFound?.toString()?.replace(':', '')?.trim() as T;
    }
  }

  private getLinkPagination(rawDocument: libxmljs.Node) {
    return rawDocument;
  }

  private replaceUrl(currentPageUrl: string, oldOrigin?: string) {
    if (isEmpty(oldOrigin)) return currentPageUrl;

    // jika current origin sama dengan media url lama. maka pake object_id lama. selain itu yang baru
    const extractedEndpoint = new URL(currentPageUrl);
    const currentHost = extractedEndpoint?.host;
    const currentPath = extractedEndpoint?.pathname;

    return currentHost === oldOrigin
      ? `${extractedEndpoint?.protocol}//${oldOrigin}${currentPath}` //`use old`
      : currentPageUrl;
  }

  pipeData(
    rawData: AnimeDetail | AnimeEpisode | Partial<AnimeBatch>[],
    plainPattern: Array<Partial<FieldPipePattern>>,
    url: string,
  ) {
    const patterns = plainToInstance(FieldPipePattern, plainPattern);

    const processPipes = (
      data:
        | AnimePostField
        | AnimeDetailField
        | AnimeEpisodeField
        | Partial<AnimeBatchField>,
      pattern: FieldPipePattern,
    ) => {
      const dataVal = data[pattern.key];

      if (isNotEmpty(dataVal) && arrayNotEmpty(pattern?.pipes)) {
        const resPipe = pattern?.pipes?.reduce((pipeVal, pipe) => {
          pipe.baseUrl = url;

          if (typeof pipeVal === 'number') {
            pipeVal = pipeVal.toString();
          }

          if (typeof pipe.exec === 'function') {
            return pipe.exec(pipeVal);
          }

          return pipeVal;
        }, dataVal);

        data[pattern.key] = resPipe;
      }
    };

    if (Array.isArray(rawData)) {
      rawData.forEach((data) => {
        patterns.forEach((pattern: AnimeEpisodeField | AnimeBatchField) => {
          processPipes(
            data as AnimeEpisodeField | Partial<AnimeBatchField>,
            pattern,
          );
        });
      });
    } else {
      patterns.forEach((pattern: AnimePostField | AnimeDetailField) => {
        processPipes(
          rawData as unknown as AnimePostField | AnimeDetailField,
          pattern,
        );
      });
    }

    return rawData;
  }
}
