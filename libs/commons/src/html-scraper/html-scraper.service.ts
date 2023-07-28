import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as useragent from 'random-useragent';
import { delay, lastValueFrom, map, retryWhen, take } from 'rxjs';
import { EnvKey } from '../helper/constant';
import * as libxmljs from 'libxmljs2';
import { hashUUID } from '../helper/md5';
import { arrayNotEmpty, isNotEmpty } from 'class-validator';

interface ParsedPattern {
  key: string;
  pattern: string;
}

interface WebsitePayload {
  baseUrl: string;
  rawHTML?: string;
  containerPattern: string;
  valuePattern: string;
  contentResultType: 'value' | 'text';
  secondaryPattern?: string;
}

interface WebsiteDetailPayload {
  baseUrl: string;
  rawHTML?: string;
  containerPattern: string;
  titlePattern: string;
  titleJpPattern: string;
  titleEnPattern: string;
  postTypePattern: string;
  postScorePattern: string;
  postStatusPattern: string;
  postDurationPattern: string;
  postEpsPattern: string;
  postSeasonPattern: string;
  postGenrePattern: string;
  postProducerPattern: string;
  postDescPattern: string;
  postCoverPattern: string;
  postListEpsPattern: string;
  contentResultType: 'value' | 'text';
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
  published: Date;
  season: string;
  genres: string;
  producers: string;
  description: string;
  cover_url: string;
  episode_urls: string[];
  n_status: number;
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
      return;
    }

    return this.evalutePostWebsite({ rawHTML: data, ...payload });
  }

  async detail(payload: WebsiteDetailPayload) {
    const { data } = await this.getHTML(payload.baseUrl);

    if (typeof data !== 'string') {
      this.logger.error(`HTML result not found`);
      return;
    }

    return this.evalutePostDetailWebsite({ rawHTML: data, ...payload });
  }

  private async evalutePostWebsite(
    payload: WebsitePayload,
  ): Promise<[string[], string]> {
    let document: libxmljs.Document;
    let content: string[] = [];
    let paginationLink: string;

    try {
      document = libxmljs.parseHtmlString(payload.rawHTML);

      if (!document) {
        throw new Error('Document is empty');
      }
      const resultContentXpath = document.find(
        `${payload.containerPattern}/${payload.valuePattern}`,
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
      document = libxmljs.parseHtmlString(payload.rawHTML);
      if (!document) {
        throw new Error('Document is empty');
      }

      const genreContentXpath = document.find(
        `${payload.containerPattern}/${payload.postGenrePattern}`,
      );
      const coverContentXpath = document.find(
        `${payload.containerPattern}/${payload.postCoverPattern}`,
      );
      const listEpsContentXpath = document.find(
        `${payload.containerPattern}/${payload.postListEpsPattern}`,
      );
      const descriptionComponent = document.find(
        `${payload.containerPattern}/${payload.postDescPattern}`,
      );

      const data: AnimeDetail = {
        object_id: hashUUID(payload.baseUrl),
        title: this.getSingleContent<string>(
          document,
          `${payload.containerPattern}/${payload.titlePattern}`,
        ),
        title_jp: this.getSingleContent<string>(
          document,
          `${payload.containerPattern}/${payload.titleJpPattern}`,
        ),
        title_en: this.getSingleContent<string>(
          document,
          `${payload.containerPattern}/${payload.titleEnPattern}`,
        ),
        type: this.getSingleContent<string>(
          document,
          `${payload.containerPattern}/${payload.postTypePattern}`,
        ),
        score: this.getSingleContent<number>(
          document,
          `${payload.containerPattern}/${payload.postScorePattern}`,
          'number',
        ),
        status: this.getSingleContent<string>(
          document,
          `${payload.containerPattern}/${payload.postStatusPattern}`,
        ),
        duration: Number(
          this.getSingleContent<number>(
            document,
            `${payload.containerPattern}/${payload.postDurationPattern}`,
          )
            ?.toString()
            ?.replace(/\D/g, ''),
        ),
        total_episode: Number(
          this.getSingleContent<number>(
            document,
            `${payload.containerPattern}/${payload.postEpsPattern}`,
          )
            ?.toString()
            ?.replace(/\D/g, ''),
        ),
        published: null,
        season: this.getSingleContent<string>(
          document,
          `${payload.containerPattern}/${payload.postSeasonPattern}`,
        ),
        genres: this.getContent(genreContentXpath, 'text')?.join(', ') || null,
        producers: this.getSingleContent<string>(
          document,
          `${payload.containerPattern}/${payload.postProducerPattern}`,
        ),
        description: this.getContent(descriptionComponent, 'text')?.join('\n'),
        cover_url: this.getContent(coverContentXpath, 'value')?.join(', '),
        episode_urls: this.getContent(listEpsContentXpath, 'value'),
        n_status: 1,
      };

      return data;
    } catch (error) {
      throw new Error('Fail parse the html result');
    }
  }

  private async getHTML(url: string): Promise<{ data: string | null }> {
    let isUseProxy = false;
    const proxyServer = this.config.get<string>(EnvKey.PROXY_SERVER, undefined);
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
          retryWhen((e) => e.pipe(delay(1000 * 10), take(5))),
          map(({ data }) => {
            return {
              data: data,
            };
          }),
        ),
    );

    return resHTML ? resHTML : { data: null };
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
    const regexDecimal = /[0-9]+(\.[0-9]+)?/g;
    const isFound = rawDocument.get(mixedPattern);

    if (!isNotEmpty(isFound)) return null;
    if (returnType === 'number') {
      const extractedResult = isFound?.toString()?.replace(/^:?\s*/, '');

      if (
        isNotEmpty(extractedResult) &&
        !isNaN(Number(extractedResult)) &&
        extractedResult !== '-'
      ) {
        return extractedResult?.match(regexDecimal)[0] as T;
      }

      return null;
    } else {
      return isFound?.toString()?.replace(':', '')?.trim() as T;
    }
  }

  private getLinkPagination(rawDocument: libxmljs.Node) {
    return rawDocument;
  }
}
