import { defaultConfigLibXMLConfig } from '@commons/constants';
import {
  AnimeEpisodeResult,
  AnimeEpisodeResultData,
  AnimeEpisodeResultDataUrl,
  AnimeEpisodeResultDataUrlList,
} from '@entities/types/anime-episode.interface';
import {
  AnimeLinkResult,
  AnimeLinkResultData,
  AnimeLinkResultDataUrl,
  AnimeLinkResultDataUrlList,
} from '@entities/types/anime-link.interface';
import {
  DataReturnType,
  PatternData,
  PatternKey,
} from '@entities/types/pattern-data.type';
import {
  AnimeDetailResult,
  AnimeDetailResultData,
  AnimeDetailResultDataEpisode,
} from '@entities/types/read-detail.interface';
import { AnimeIndexResult } from '@entities/types/read-index.interface';
import { PipesService } from '@helpers/pipes/pipes.service';
import { PipeConfig } from '@helpers/pipes/types/pipe.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { arrayNotEmpty, isEmpty, isNotEmpty } from 'class-validator';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Element, Node, parseHtml } from 'libxmljs2';
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

declare module 'libxmljs2' {
  interface Node {
    value(): string;
  }
}

@Injectable()
export class HtmlService {
  private readonly logger = new Logger(HtmlService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly pipesService: PipesService,
  ) {}

  private get proxyUrl(): string {
    return this.configService.get<string>('PROXY_URL', '');
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
          map((res) => {
            // setTimeout(() => {}, 5000);
            return res.data;
          }),
          catchError(this.handleHttpStatusError),
          retry({ count: 3 }),
        ),
    );
  }

  parseIndex(
    mediaId: bigint,
    pageUrl: string,
    currentPage: number,
    rawHtml: string,
    patternData: PatternData[],
  ): AnimeIndexResult {
    this.logger.verbose(`Parsing page: ${pageUrl}`);

    const [
      containerPattern,
      altContainerPattern,
      containerReturnType,
      containerPipes,
    ] = this.getPattern(patternData, 'container');

    const doc = parseHtml(rawHtml);
    const pageTitle = doc.get<Node>(`//title/text()[normalize-space()]`);
    const dContainer = doc.find<Node>(containerPattern);

    let result: AnimeIndexResult = {
      media_id: mediaId,
      page_num: currentPage,
      page_title: pageTitle?.toString({ ...defaultConfigLibXMLConfig }) || '',
      page_url: pageUrl,
      data: [],
    };

    if (arrayNotEmpty(dContainer)) dContainer.length = 2;

    if (arrayNotEmpty(dContainer)) {
      const [urlPattern, altUrlPattern, urlReturnType, urlPipes] =
        this.getPattern(patternData, 'url');
      const [titlePattern, altTitlePattern, titleReturnType, titlePipes] =
        this.getPattern(patternData, 'title');

      for (const item of dContainer) {
        if (isEmpty(urlPattern) || isEmpty(titlePattern)) continue;

        const element = item as unknown as Element;

        const urlNode = element.get(urlPattern);
        const titleNode = element.get(titlePattern);
        const url = urlNode?.value() || '';
        const title =
          titleNode?.toString({ ...defaultConfigLibXMLConfig }) || '';

        if (isNotEmpty(url) && isNotEmpty(title)) {
          result.data.push({
            title: this.pipesService.normalize(title?.trim(), titlePipes),
            url: this.pipesService.normalize(url?.trim(), urlPipes),
          });
        }
      }
    }

    this.logger.verbose(`Parsed ${result?.data?.length} items`);

    return result;
  }

  parseDetail(
    mediaId: bigint,
    pageUrl: string,
    currentPage: number,
    rawHtml: string,
    patternData: PatternData[],
  ): AnimeDetailResult {
    this.logger.verbose(`Parsing detail: ${pageUrl}`);

    const [
      containerPattern,
      altContainerPattern,
      containerReturnType,
      containerPipes,
    ] = this.getPattern(patternData, 'container');

    const doc = parseHtml(rawHtml);
    const pageTitle = doc.get<Node>(`//title/text()[normalize-space()]`);
    const dContainer = doc.find<Node>(containerPattern);

    let result: AnimeDetailResult = {
      media_id: mediaId,
      page_num: currentPage,
      page_title: pageTitle?.toString({ ...defaultConfigLibXMLConfig }) || '',
      page_url: pageUrl,
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

    if (arrayNotEmpty(dContainer)) {
      const [
        epsTitlePattern,
        altEpsTitlePattern,
        epsTitleReturnType,
        epsTitlePipes,
      ] = this.getPattern(patternData, 'title');
      const [
        epsDescPattern,
        altEpsDescPattern,
        epsDescReturnType,
        epsDescPipes,
      ] = this.getPattern(patternData, 'description');
      const [
        epsDatePattern,
        altEpsDatePattern,
        epsDateReturnType,
        epsDatePipes,
      ] = this.getPattern(patternData, 'date');
      const [epsImgPattern, altEpsImgPattern, epsImgReturnType, epsImgPipes] =
        this.getPattern(patternData, 'image');
      const [epsNumPattern, altEpsNumPattern, epsNumReturnType, epsNumPipes] =
        this.getPattern(patternData, 'episode_num');
      const [
        epsScorePattern,
        altEpsScorePattern,
        epsScoreReturnType,
        epsScorePipes,
      ] = this.getPattern(patternData, 'score');
      const [
        epsCompletePattern,
        altEpsCompletePattern,
        epsCompleteReturnType,
        epsCompletePipes,
      ] = this.getPattern(patternData, 'episode_complete');
      const [
        epsBatchPattern,
        altEpsBatchPattern,
        epsBatchReturnType,
        epsBatchPipes,
      ] = this.getPattern(patternData, 'batch');
      const [
        epsListConPattern,
        altEpsListConPattern,
        epsListConReturnType,
        epsListConPipes,
      ] = this.getPattern(patternData, 'episode_container');
      const [
        epsItemTitlePattern,
        altEpsItemTitlePattern,
        epsItemTitleReturnType,
        epsItemTitlePipes,
      ] = this.getPattern(patternData, 'episode_title');
      const [
        epsItemUrlPattern,
        altEpsItemUrlPattern,
        epsItemUrlReturnType,
        epsItemUrlPipes,
      ] = this.getPattern(patternData, 'episode_url');
      for (const item of dContainer) {
        const element = item as unknown as Element;
        const title = element.find<Node>(epsTitlePattern);
        const description = element.find<Node>(epsDescPattern);
        const date = element.find<Node>(epsDatePattern);
        const image = element.get<Node>(epsImgPattern);
        const episodeNum = element.find<Node>(epsNumPattern);
        const score = element.find<Node>(epsScorePattern);
        const episodeCompleteUrl = element.get<Node>(epsCompletePattern);
        const batchUrl = element.get<Node>(epsBatchPattern);
        const episodeListContainer = element.find<Node>(epsListConPattern);

        const episodeListItem: AnimeDetailResultDataEpisode[] = [];
        for (const episodeItem of episodeListContainer) {
          const episodeItemElement = episodeItem as unknown as Element;
          const episodeUrl = episodeItemElement.get<Node>(epsItemUrlPattern);
          const episodeTitle =
            episodeItemElement.get<Node>(epsItemTitlePattern);

          if (isNotEmpty(episodeUrl) && isNotEmpty(episodeTitle)) {
            episodeListItem.push({
              title:
                episodeTitle?.toString({ ...defaultConfigLibXMLConfig }) || '',
              url: episodeUrl?.value() || '',
            });
          }
        }

        const titleText = this.mergeHtmlNode(title, 'key_value');
        const descriptionText = this.mergeHtmlNode(description, 'multiline');
        const dateText = this.mergeHtmlNode(date, 'key_value');
        const imageText = image?.value();
        const episodeText = this.mergeHtmlNode(episodeNum, 'key_value');
        const scoreText = this.mergeHtmlNode(score, 'key_value');
        const episodeCompleteUrlText = episodeCompleteUrl?.value();
        const batchUrlText = batchUrl?.value();

        const resultData: AnimeDetailResultData = {
          title: this.pipesService.normalize(titleText, epsTitlePipes),
          description: this.pipesService.normalize(
            descriptionText,
            epsDescPipes,
          ),
          // datetime: isNotEmpty(dateText) ? new Date(dateText) : undefined,
          datetime: new Date(
            this.pipesService.normalize(dateText, epsDatePipes),
          ),
          image_url: this.pipesService.normalize(imageText, epsImgPipes),
          episode_count: this.pipesService.normalize(episodeText, epsNumPipes),
          score: this.pipesService.normalize(scoreText, epsScorePipes),
          batch_url: this.pipesService.normalize(batchUrlText, epsBatchPipes),
          episode_list: arrayNotEmpty(episodeListItem) ? episodeListItem : [],
          episode_url: this.pipesService.normalize(
            episodeCompleteUrlText,
            epsCompletePipes,
          ),
        };

        result.data = resultData;
      }
    }

    return result;
  }

  parseLink(
    mediaId: bigint,
    pageUrl: string,
    currentPage: number,
    rawHtml: string,
  ): AnimeLinkResult {
    this.logger.verbose(`Parsing link: ${pageUrl}`);

    const doc = parseHtml(rawHtml);
    const pageTitle = doc.get<Node>(`//title/text()[normalize-space()]`);
    const dContainer = doc.find<Node>(`//div[@class='download'][1]/ul`);

    let result: AnimeLinkResult = {
      media_id: mediaId,
      page_num: currentPage,
      page_title: pageTitle?.toString({ ...defaultConfigLibXMLConfig }) || '',
      page_url: pageUrl,
      data: [],
    };

    if (arrayNotEmpty(dContainer)) {
      const resultData: AnimeLinkResultData[] = [];

      for (const [index, itemContainer] of dContainer.entries()) {
        const dContainerLinkElement = itemContainer as unknown as Element;
        const dContainerTitle = dContainerLinkElement.find<Node>(
          `../h4/text()[normalize-space()]`,
        );
        const dContainerList = dContainerLinkElement.find<Node>(`./li`);

        const listData: AnimeLinkResultDataUrl[] = [];
        for (const item of dContainerList) {
          const element = item as unknown as Element;
          const anchors = element.find<Node>(`./a`);
          const resolution = element.get<Node>(
            `./strong/text()[normalize-space()]`,
          );

          const achorData: AnimeLinkResultDataUrlList[] = [];
          for (const anchor of anchors) {
            const anchorElement = anchor as unknown as Element;
            const title = anchorElement.get<Node>(
              `./text()[normalize-space()]`,
            );
            const url = anchorElement.get<Node>(`./@href`);

            if (isNotEmpty(title) && isNotEmpty(url)) {
              achorData.push({
                title: title?.toString({ ...defaultConfigLibXMLConfig }) || '',
                url: url?.value() || '',
              });
            }
          }

          if (arrayNotEmpty(achorData)) {
            listData.push({
              resolution:
                resolution?.toString({ ...defaultConfigLibXMLConfig }) || '',
              list: achorData,
            });
          }
        }

        if (arrayNotEmpty(listData)) {
          resultData.push({
            title:
              dContainerTitle?.[index]?.toString({
                ...defaultConfigLibXMLConfig,
              }) || '',
            data: listData,
          });
        }
      }

      if (arrayNotEmpty(resultData)) {
        result.data = resultData;
      }
    }

    return result;
  }

  parseEpisode(
    mediaId: bigint,
    pageUrl: string,
    currentPage: number,
    rawHtml: string,
  ): AnimeEpisodeResult {
    this.logger.verbose(`Parsing link: ${pageUrl}`);

    const doc = parseHtml(rawHtml);
    const pageTitle = doc.get<Node>(`//title/text()[normalize-space()]`);
    const dContainerDownload = doc.find<Node>(`//div[@class='download'][1]/ul`);
    const dContainer = doc.find<Node>(`//div[@class='venutama']`);

    let result: AnimeEpisodeResult = {
      media_id: mediaId,
      page_num: currentPage,
      page_title: pageTitle?.toString({ ...defaultConfigLibXMLConfig }) || '',
      page_url: pageUrl,
      data: null,
    };

    const resultData: AnimeEpisodeResultData = {
      download_list: [],
      embed_url: '',
    };

    if (arrayNotEmpty(dContainer)) {
      for (const [index, itemContainer] of dContainer.entries()) {
        const dContainerPage = itemContainer as unknown as Element;
        const dContainerEmbed = dContainerPage.get<Node>(
          `.//div[@class='responsive-embed-stream']/iframe/@src`,
        );
        const embedUrl = dContainerEmbed?.value();

        if (isNotEmpty(embedUrl)) {
          resultData.embed_url = embedUrl || '';
        }
      }
    }

    if (arrayNotEmpty(dContainerDownload)) {
      for (const [index, itemContainer] of dContainerDownload.entries()) {
        const dContainerLinkElement = itemContainer as unknown as Element;
        const dContainerList = dContainerLinkElement.find<Node>(`./li`);

        const downloadListData: AnimeEpisodeResultDataUrl[] = [];
        for (const item of dContainerList) {
          const element = item as unknown as Element;
          const anchors = element.find<Node>(`./a`);
          const resolution = element.get<Node>(
            `./strong/text()[normalize-space()]`,
          );

          const achorData: AnimeEpisodeResultDataUrlList[] = [];
          for (const anchor of anchors) {
            const anchorElement = anchor as unknown as Element;
            const title = anchorElement.get<Node>(
              `./text()[normalize-space()]`,
            );
            const url = anchorElement.get<Node>(`./@href`);

            if (isNotEmpty(title) && isNotEmpty(url)) {
              achorData.push({
                title: title?.toString({ ...defaultConfigLibXMLConfig }) || '',
                url: url?.value() || '',
              });
            }
          }

          if (arrayNotEmpty(achorData)) {
            downloadListData.push({
              resolution:
                resolution?.toString({ ...defaultConfigLibXMLConfig }) || '',
              list: achorData,
            });
          }
        }

        if (arrayNotEmpty(downloadListData)) {
          resultData.download_list.push(...(downloadListData || []));
        }
      }
    }

    /**
     *
     */

    // if (arrayNotEmpty(dContainerMirror)) {
    //   for (const [index, itemContainer] of dContainerMirror.entries()) {
    //     const dContainerLinkElement = itemContainer as unknown as Element;
    //     const dContainerList = dContainerLinkElement.find<Node>(`./li`);

    //     const mirrorListData: AnimeEpisodeResultDataUrl[] = [];
    //     for (const item of dContainerList) {
    //       const element = item as unknown as Element;
    //       const anchors = element.find<Node>(`./a`);
    //       const resolution = element.get<Node>(
    //         `./span/text()[normalize-space()]`,
    //       );

    //       const achorData: AnimeEpisodeResultDataUrlList[] = [];
    //       for (const anchor of anchors) {
    //         const anchorElement = anchor as unknown as Element;
    //         const title = anchorElement.get<Node>(
    //           `./text()[normalize-space()]`,
    //         );
    //         const url = anchorElement.get<Node>(`./@data-content`);

    //         if (isNotEmpty(title) && isNotEmpty(url)) {
    //           achorData.push({
    //             title: title?.toString({ ...defaultConfigLibXMLConfig }) || '',
    //             url: url?.value() || '',
    //           });
    //         }
    //       }

    //       if (arrayNotEmpty(achorData)) {
    //         mirrorListData.push({
    //           resolution:
    //             resolution?.toString({ ...defaultConfigLibXMLConfig }) || '',
    //           list: achorData,
    //         });
    //       }
    //     }

    //     if (arrayNotEmpty(mirrorListData)) {
    //       resultData.embed_url
    //     }
    //   }
    // }

    if (
      arrayNotEmpty(resultData.download_list) ||
      isNotEmpty(resultData.embed_url)
    ) {
      result.data = resultData;
    }

    return result;
  }

  private mergeHtmlNode(
    rawNode: Node[],
    type: DataReturnType = 'key_value',
  ): string {
    if (!arrayNotEmpty(rawNode)) return '';

    return rawNode
      ?.map((node) => node?.toString({ ...defaultConfigLibXMLConfig })?.trim())
      ?.filter((text) => text?.length > 0)
      ?.join(type === 'multiline' ? '\n' : '');
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
        console.log(`Network error: ${err?.message}`);
        // this.logger.verbose(`Network error: ${err?.message}`);

        return of(null);
      case 'EPROTO':
      case 'CERT_HAS_EXPIRED':
      case 'ERR_TLS_CERT_ALTNAME_INVALID':
      case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
      case 'SELF_SIGNED_CERT_IN_CHAIN':
      case 'DEPTH_ZERO_SELF_SIGNED_CERT':
        console.log('Certificate error');
        break;
      default:
        return throwError(() => err);
    }

    return throwError(() => err);
  }

  private getPattern(
    data: PatternData[],
    key: PatternKey,
  ): [string, string, DataReturnType, PipeConfig[]] {
    if (!arrayNotEmpty(data)) return null;

    const isFound = data.find((it) => it?.key === key)?.data;

    const mainPattern = isFound?.value;
    const altPattern = isFound?.alternative;
    const returnType = isFound?.return_type || 'key_value';
    const pipes = isFound?.pipes || [];

    return [mainPattern, altPattern, returnType, pipes];
  }
}
