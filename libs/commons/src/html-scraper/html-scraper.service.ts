import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { arrayNotEmpty, isEmpty, isNotEmpty } from 'class-validator';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as libxmljs from 'libxmljs2';
import * as useragent from 'random-useragent';
import { catchError, lastValueFrom, map, of, retry } from 'rxjs';
import {
  CleanerTypeRules,
  FieldPipePattern,
} from '../entities/field-field-pattern';
import {
  AnimeDetailField,
  ExistAnimeDetailKeys,
} from '../entities/post-detail-pattern.entity';
import {
  AnimePostField,
  ExistAnimePostKeys,
} from '../entities/post-pattern.entity';
import { EnvKey, TimeUnit } from '../helper/constant';
import { hashUUID } from '../helper/md5';

export interface ParsedPattern {
  key: string;
  pattern: string;
  result_type: string;
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

export interface AnimeDetail {
  object_id: string;
  title: string;
  title_jp: string;
  title_en: string;
  type: string;
  score: number;
  status: string;
  duration: number;
  total_episode: number;
  published: Date | null;
  season: string;
  genres: string | null;
  producers: string;
  description: string;
  cover_url: string;
  episode_urls: string[];
}

@Injectable()
export class HtmlScraperService {
  private readonly logger = new Logger(HtmlScraperService.name);

  constructor(
    private readonly htmlService: HttpService,
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
          ExistAnimeDetailKeys.EPISODE_PATTERN,
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

      const data: AnimeDetail = {
        object_id: hashUUID(
          this.replaceUrl(payload?.baseUrl, String(payload?.oldOrigin)),
        ),
        title: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.titlePattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TITLE,
            payload?.parsedPattern,
          ),
        ),
        title_jp: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.titleJpPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TITLE_JP,
            payload?.parsedPattern,
          ),
        ),
        title_en: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.titleEnPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TITLE_EN,
            payload?.parsedPattern,
          ),
        ),
        type: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.postTypePattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_TYPE,
            payload?.parsedPattern,
          ),
        ),
        score: this.getSingleContent<number>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.postScorePattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_SCORE,
            payload?.parsedPattern,
          ),
          'number',
        ),
        status: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.postStatusPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_STATUS,
            payload?.parsedPattern,
          ),
        ),
        duration: Number(
          this.getSingleContent<number>(
            document,
            // this.makeXpath(
            //   payload?.containerPattern,
            //   payload?.postDurationPattern,
            // ),
            this.makeXpathNew<ExistAnimeDetailKeys>(
              ExistAnimeDetailKeys.POST_DURATION,
              payload?.parsedPattern,
            ),
          )
            ?.toString()
            ?.replace(/\D/g, ''),
        ),
        total_episode: Number(
          this.getSingleContent<number>(
            document,
            // this.makeXpath(payload?.containerPattern, payload?.postEpsPattern),
            this.makeXpathNew<ExistAnimeDetailKeys>(
              ExistAnimeDetailKeys.EPISODE_PATTERN,
              payload?.parsedPattern,
            ),
          )
            ?.toString()
            ?.replace(/\D/g, ''),
        ),
        published: this.getSingleContent<string>(
          document,
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.PUBLISHED_DATE,
            payload?.parsedPattern,
          ),
        ) as any,
        season: this.getSingleContent<string>(
          document,
          // this.makeXpath(payload?.containerPattern, payload?.postSeasonPattern),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_SEASON,
            payload?.parsedPattern,
          ),
        ),
        genres: this.getContent(genreContentXpath, 'text')?.join(',') || null,
        producers: this.getSingleContent<string>(
          document,
          // this.makeXpath(
          //   payload?.containerPattern,
          //   payload?.postProducerPattern,
          // ),
          this.makeXpathNew<ExistAnimeDetailKeys>(
            ExistAnimeDetailKeys.POST_PRODUCERS,
            payload?.parsedPattern,
          ),
        )
          ?.split(', ')
          ?.join(','),
        description: this.getContent(descriptionComponent, 'text')?.join('\n'),
        cover_url: this.getContent(coverContentXpath, 'value')?.join(', '),
        episode_urls: this.getContent(listEpsContentXpath, 'value'),
      };

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
    this.logger.debug(`load ${url} with ua: ${userAgent}`);
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
          catchError((error) => {
            if (error.code === 'CERT_HAS_EXPIRED') {
              this.logger.warn(
                `${new URL(url).origin} has invalid certificate`,
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

    return resHTML ? resHTML : { data: null };
  }

  private makeXpathNew<T>(fieldName: T, rawPattern: ParsedPattern[]) {
    const containerPattern = rawPattern?.find(
      (pattern) =>
        pattern.key === ExistAnimePostKeys.CONTAINER ||
        pattern.key === ExistAnimeDetailKeys.POST_CONTAINER,
    )?.pattern;
    const contentPattern = rawPattern?.find(
      (pattern) => pattern?.key === fieldName,
    )?.pattern;
    if (isEmpty(contentPattern)) return '';

    return `${containerPattern}/${contentPattern}` || '';
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
    rawData: AnimeDetail,
    plainPattern: Array<Partial<FieldPipePattern>>,
    url: string,
  ) {
    const patterns = plainToInstance(FieldPipePattern, plainPattern);
    for (const key in rawData) {
      const dataVal = rawData[key];

      patterns?.forEach((pattern: AnimePostField | AnimeDetailField) => {
        if (dataVal && arrayNotEmpty(pattern?.pipes)) {
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

          rawData[key] = resPipe;
        }
      });
    }

    return rawData;
  }
}
