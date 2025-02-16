import { Envs } from '@commons/env';
import {
  DataReturnType,
  PatternData,
  PatternKey,
} from '@entities/types/pattern-data.type';
import {
  AnimeDetailResult,
  AnimeDetailResultData,
} from '@entities/types/read-detail.interface';
import {
  AnimeIndexResult,
  AnimeIndexResultData,
} from '@entities/types/read-index.interface';
import { PipesService } from '@helpers/pipes/pipes.service';
import { PipeConfig } from '@helpers/pipes/types/pipe.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { arrayNotEmpty, isEmpty, isNotEmpty } from 'class-validator';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  catchError,
  lastValueFrom,
  map,
  Observable,
  ObservableInput,
  of,
  retry,
  throwError,
} from 'rxjs';
import { DocumentParser } from './document-parser';
import {
  BaseParseResult,
  ParseContext,
  PatternDocumentData,
  PatternReturnData,
} from './types/parser.type';

@Injectable()
export class HtmlService {
  private readonly logger = new Logger(HtmlService.name);
  private parser: DocumentParser;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly pipesService: PipesService,
  ) {
    this.parser = new DocumentParser({ type: 'html' });
  }

  private get proxyUrl(): string {
    return this.configService.get<string>(Envs.PROXY_URL, '');
  }

  async load(pageUrl: string): Promise<string> {
    this.logger.verbose(`Try to load page: ${pageUrl}`);

    return lastValueFrom(
      this.httpService
        .get(pageUrl, {
          httpsAgent: isNotEmpty(this.proxyUrl)
            ? new HttpsProxyAgent(this.proxyUrl)
            : undefined,
        })
        .pipe(
          map((res) => res.data),
          catchError(this.handleHttpStatusError),
          retry({ count: 3 }),
        ),
    );
  }

  private createBaseResult(context: ParseContext): BaseParseResult {
    return {
      media_id: context.mediaId,
      page_num: context.currentPage,
      page_title:
        this.parser.getContent('//title/text()[normalize-space()]') || '',
      page_url: context.pageUrl,
    };
  }

  private initializeParsing(context: ParseContext): BaseParseResult | null {
    try {
      this.parser.load(context.rawHtml);
      return this.createBaseResult(context);
    } catch (error) {
      this.logger.error(`Error initializing parsing: ${error.message}`);
      return null;
    }
  }

  private mergeHtmlNode(
    nodes: string[],
    type: DataReturnType = 'key_value',
  ): string {
    if (!arrayNotEmpty(nodes)) return '';

    return nodes
      .filter((text) => isNotEmpty(text?.trim()))
      .join(type === 'multiline' ? '\n' : '');
  }

  private parseContainerContent<T>(
    container: string,
    patterns: Record<string, [string, string, DataReturnType, PipeConfig[]]>,
    parser: DocumentParser,
  ): Partial<T> {
    const result: Record<string, any> = {};

    for (const [
      key,
      [pattern, altPattern, returnType, pipes],
    ] of Object.entries(patterns)) {
      if (isEmpty(pattern) && isEmpty(altPattern)) continue;

      // Find all matching nodes for the pattern
      const contents = parser.findContent(pattern);
      if (arrayNotEmpty(contents)) {
        // Merge the nodes based on return type
        const mergedContent = this.mergeHtmlNode(contents, returnType);

        if (isNotEmpty(mergedContent)) {
          result[key] = this.pipesService.normalize(
            mergedContent.trim(),
            pipes,
          );
        }
      }
    }

    return result as Partial<T>;
  }

  parseIndex(
    mediaId: bigint,
    pageUrl: string,
    currentPage: number,
    rawHtml: string,
    patternData: PatternData[],
  ): AnimeIndexResult {
    this.logger.verbose(`Parsing page: ${pageUrl}`);

    const context: ParseContext = {
      mediaId,
      pageUrl,
      currentPage,
      rawHtml,
      patternData,
    };
    const baseResult = this.initializeParsing(context);

    const result: AnimeIndexResult = {
      ...baseResult,
      data: [],
    };

    try {
      const [containerPattern] = this.getPattern(patternData, 'container');
      const containers = this.parser.findContent(containerPattern);

      if (arrayNotEmpty(containers)) {
        containers.length = Math.min(containers.length, 2);

        const patterns: PatternDocumentData<AnimeIndexResultData> = {
          url: this.getPattern(patternData, 'url'),
          title: this.getPattern(patternData, 'title'),
        };

        for (const container of containers) {
          const containerParser = new DocumentParser({ type: 'html' });
          containerParser.load(container);

          const parsedContent = this.parseContainerContent<{
            url: string;
            title: string;
          }>(container, patterns, containerParser);

          if (parsedContent.url && parsedContent.title) {
            result.data.push({
              title: parsedContent.title,
              url: parsedContent.url,
            });
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error parsing index: ${error.message}`);
      return result;
    }
  }

  parseDetail(
    mediaId: bigint,
    pageUrl: string,
    currentPage: number,
    rawHtml: string,
    patternData: PatternData[],
  ): AnimeDetailResult {
    this.logger.verbose(`Parsing detail: ${pageUrl}`);

    const context: ParseContext = {
      mediaId,
      pageUrl,
      currentPage,
      rawHtml,
      patternData,
    };
    const baseResult = this.initializeParsing(context);

    const result: AnimeDetailResult = {
      ...baseResult,
      data: {
        title: '',
        description: '',
        datetime: undefined,
        image_url: '',
        episode_count: '0',
        score: '0',
        episode_list: [],
        batch_url: '',
        episode_url: '',
      },
    };

    try {
      const [containerPattern] = this.getPattern(patternData, 'container');
      const containers = this.parser.findContent(containerPattern);

      if (arrayNotEmpty(containers)) {
        const patterns: PatternDocumentData<AnimeDetailResultData> = {
          title: this.getPattern(patternData, 'title'),
          description: this.getPattern(patternData, 'description'),
          datetime: this.getPattern(patternData, 'date'),
          image_url: this.getPattern(patternData, 'image'),
          episode_count: this.getPattern(patternData, 'episode_num'),
          score: this.getPattern(patternData, 'score'),
          episode_list: this.getPattern(patternData, 'episode_complete'),
          batch_url: this.getPattern(patternData, 'batch'),
          episode_url: this.getPattern(patternData, 'episode_url'),
        };

        for (const container of containers) {
          const containerParser = new DocumentParser({ type: 'html' });
          containerParser.load(container);

          const parsedContent = this.parseContainerContent<
            AnimeDetailResult['data']
          >(container, patterns, containerParser);

          // Handle episode list separately due to its nested structure
          const [epsListConPattern] = this.getPattern(
            patternData,
            'episode_container',
          );
          const episodeContainers =
            containerParser.findContent(epsListConPattern);

          const episodeListPatterns = {
            title: this.getPattern(patternData, 'episode_title'),
            url: this.getPattern(patternData, 'episode_url'),
          };

          const episodeList = [];
          for (const episodeContainer of episodeContainers) {
            const episodeParser = new DocumentParser({ type: 'html' });
            episodeParser.load(episodeContainer);

            const episodeContent = this.parseContainerContent<{
              title: string;
              url: string;
            }>(episodeContainer, episodeListPatterns, episodeParser);

            if (episodeContent.title && episodeContent.url) {
              episodeList.push({
                title: episodeContent.title,
                url: episodeContent.url,
              });
            }
          }

          result.data = {
            ...result.data,
            ...parsedContent,
            episode_list: episodeList,
            datetime: parsedContent.datetime
              ? new Date(parsedContent.datetime)
              : undefined,
          };
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error parsing detail: ${error.message}`);
      return result;
    }
  }

  parseLink() {
    //
  }

  parseEpisode() {
    //
  }

  private handleHttpStatusError(
    err: any,
    caught: Observable<any>,
  ): ObservableInput<any> {
    switch (err?.code) {
      case 'ERR_BAD_RESPONSE':
      case 'ERR_BAD_REQUEST':
      case 'ENOTFOUND':
      case 'ECONNRESET':
      case 'ECONNREFUSED':
        this.logger.warn(`Network error: ${err?.message}`);
        return of(null);
      case 'EPROTO':
      case 'CERT_HAS_EXPIRED':
      case 'ERR_TLS_CERT_ALTNAME_INVALID':
      case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
      case 'SELF_SIGNED_CERT_IN_CHAIN':
      case 'DEPTH_ZERO_SELF_SIGNED_CERT':
        this.logger.warn('Certificate error');
        break;
      default:
        return throwError(() => err);
    }

    return throwError(() => err);
  }

  private getPattern(data: PatternData[], key: PatternKey): PatternReturnData {
    if (!arrayNotEmpty(data)) return ['', '', 'key_value', []];

    const isFound = data.find((it) => it?.key === key)?.data;

    const mainPattern = isFound?.value || '';
    const altPattern = isFound?.alternative || '';
    const returnType = isFound?.return_type || 'key_value';
    const pipes = isFound?.pipes || [];

    return [mainPattern, altPattern, returnType, pipes];
  }
}
