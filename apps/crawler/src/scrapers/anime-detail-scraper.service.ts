import {
  AnimeSeason,
  AnimeStatus,
  AnimeType,
} from '@app/common/entities/core/anime.entity';
import { Source } from '@app/common/entities/core/source.entity';
import {
  HtmlParserOptions,
  HtmlParserService,
} from '@hanivanrizky/nestjs-html-parser';
import { Injectable, Logger } from '@nestjs/common';

export interface ScrapedAnimeDetail {
  title: string;
  slug: string;
  alternative_title?: string;
  synopsis?: string;
  poster_url?: string;
  banner_url?: string;
  type?: AnimeType;
  status?: AnimeStatus;
  total_episodes?: number;
  release_year?: number;
  season?: AnimeSeason;
  rating?: number;
  source_anime_id: string;
  source_url: string;
  episodes_urls?: string[]; // URLs to episode pages
}

export interface AnimeDetailScraperConfig {
  title: string;
  alternativeTitle?: string;
  synopsis?: string;
  posterUrl?: string;
  bannerUrl?: string;
  type?: string;
  status?: string;
  totalEpisodes?: string;
  releaseYear?: string;
  season?: string;
  rating?: string;
  episodeList?: {
    selector: string;
    sourceUrl: string;
  };
}

@Injectable()
export class AnimeDetailScraperService {
  private readonly logger = new Logger(AnimeDetailScraperService.name);

  constructor(private readonly htmlParser: HtmlParserService) {}

  /**
   * Scrape anime detail page to get comprehensive info about an anime
   */
  async scrapeAnimeDetail(
    source: Source,
    detailUrl: string,
    sourceAnimeId?: string,
  ): Promise<ScrapedAnimeDetail | null> {
    try {
      this.logger.log(`Scraping anime detail from: ${detailUrl}`);

      const config = this.parseSourceConfig(source);
      const requestOptions = this.getRequestOptions(source);

      const response = await this.htmlParser.fetchHtml(
        detailUrl,
        requestOptions,
      );

      if (response.status !== 200) {
        throw new Error(
          `HTTP ${response.status}: Failed to fetch anime detail from ${detailUrl}`,
        );
      }

      const html = response.data;

      // Extract basic anime info
      const title = this.extractText(html, config.title);

      if (!title) {
        this.logger.warn(`No title found for anime detail page: ${detailUrl}`);
        return null;
      }

      // Create the base anime detail object
      const animeDetail: ScrapedAnimeDetail = {
        title: title.trim(),
        slug: this.generateSlug(title),
        source_anime_id:
          sourceAnimeId || this.extractSourceAnimeIdFromUrl(detailUrl),
        source_url: detailUrl,
      };

      // Extract optional fields
      if (config.alternativeTitle) {
        animeDetail.alternative_title = this.nullToUndefined(
          this.extractText(html, config.alternativeTitle),
        );
      }

      if (config.synopsis) {
        animeDetail.synopsis = this.nullToUndefined(
          this.extractText(html, config.synopsis),
        );
      }

      if (config.posterUrl) {
        animeDetail.poster_url = this.normalizeUrl(
          this.extractAttribute(html, config.posterUrl, 'src'),
          source.base_url,
        );
      }

      if (config.bannerUrl) {
        animeDetail.banner_url = this.normalizeUrl(
          this.extractAttribute(html, config.bannerUrl, 'src'),
          source.base_url,
        );
      }

      if (config.type) {
        animeDetail.type = this.parseAnimeType(
          this.extractText(html, config.type),
        );
      }

      if (config.status) {
        animeDetail.status = this.parseAnimeStatus(
          this.extractText(html, config.status),
        );
      }

      if (config.totalEpisodes) {
        animeDetail.total_episodes = this.parseNumber(
          this.extractText(html, config.totalEpisodes),
        );
      }

      if (config.releaseYear) {
        animeDetail.release_year = this.parseNumber(
          this.extractText(html, config.releaseYear),
        );
      }

      if (config.season) {
        animeDetail.season = this.parseAnimeSeason(
          this.extractText(html, config.season),
        );
      }

      if (config.rating) {
        animeDetail.rating = this.parseFloat(
          this.extractText(html, config.rating),
        );
      }

      // Extract episode URLs if available
      if (config.episodeList) {
        const episodeElements = this.htmlParser.extractMultiple(
          html,
          config.episodeList.selector,
          'xpath',
        );

        if (episodeElements && episodeElements.length > 0) {
          animeDetail.episodes_urls = [];

          for (let i = 0; i < episodeElements.length; i++) {
            const episodeUrl = this.extractAttribute(
              html,
              `(${config.episodeList.selector})[${i + 1}]${config.episodeList.sourceUrl}`,
              'href',
            );

            if (episodeUrl) {
              animeDetail.episodes_urls.push(
                this.normalizeUrl(episodeUrl, source.base_url),
              );
            }
          }

          this.logger.log(
            `Found ${animeDetail.episodes_urls.length} episode URLs for anime: ${title}`,
          );
        }
      }

      return animeDetail;
    } catch (error) {
      this.logger.error(
        `Error scraping anime detail from ${detailUrl}:`,
        error,
      );
      throw error;
    }
  }

  private parseSourceConfig(source: Source): AnimeDetailScraperConfig {
    // Parse source.selectors into AnimeDetailScraperConfig format
    return source.selectors.animeDetail as AnimeDetailScraperConfig;
  }

  private getRequestOptions(source: Source): HtmlParserOptions {
    return {
      timeout: source.timeout_seconds * 1000,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...source.headers,
        'User-Agent': source.user_agent || undefined,
      },
      useRandomUserAgent: !source.user_agent,
      retries: 3,
      retryDelay: 1000,
      verbose: false,
      rejectUnauthorized: false,
      ignoreSSLErrors: true,
      maxRedirects: 5,
      retryOnErrors: {
        ssl: false,
        timeout: true,
        dns: true,
        connectionRefused: false,
      },
    };
  }

  private extractSourceAnimeIdFromUrl(url: string): string {
    // Extract ID from URL - implement based on your URL patterns
    const matches = url.match(/\/([^\/]+)(?:\/?$|\.[^.]+$)/);
    return matches ? matches[1] : url;
  }

  private extractText(html: string, selector: string): string | null {
    try {
      return this.htmlParser.extractSingle(html, selector, 'xpath');
    } catch (error) {
      return null;
    }
  }

  private extractAttribute(
    html: string,
    selector: string,
    attribute: string,
  ): string | null {
    try {
      const attributes = this.htmlParser.extractAttributes(
        html,
        selector,
        attribute,
        'xpath',
      );
      return attributes.length > 0 ? attributes[0] : null;
    } catch (error) {
      return null;
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeUrl(
    url: string | null | undefined,
    baseUrl: string,
  ): string {
    if (!url) return '';

    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        const domain = new URL(baseUrl).origin;
        return `${domain}${url}`;
      }

      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return `https:${url}`;
      }

      // Handle absolute URLs
      if (url.match(/^https?:\/\//)) {
        return url;
      }

      // Handle other relative URLs
      return new URL(url, baseUrl).href;
    } catch (error) {
      return url; // Return as is if URL parsing fails
    }
  }

  private parseAnimeType(typeStr: string | null): AnimeType | undefined {
    if (!typeStr) return undefined;

    const normalized = typeStr.toLowerCase().trim();

    if (normalized.includes('tv')) return AnimeType.TV;
    if (normalized.includes('movie')) return AnimeType.MOVIE;
    if (normalized.includes('ova') || normalized.includes('oav'))
      return AnimeType.OVA;
    if (normalized.includes('ona')) return AnimeType.ONA;
    if (normalized.includes('special')) return AnimeType.SPECIAL;
    if (normalized.includes('music')) return AnimeType.MUSIC;

    return AnimeType.TV; // Default to TV if unknown
  }

  private parseAnimeStatus(
    statusStr: string | null | undefined,
  ): AnimeStatus | undefined {
    if (!statusStr) return undefined;

    const normalized = statusStr.toLowerCase().trim();

    if (
      normalized.includes('ongoing') ||
      normalized.includes('airing') ||
      normalized.includes('current')
    )
      return AnimeStatus.ONGOING;

    if (normalized.includes('complete') || normalized.includes('finished'))
      return AnimeStatus.COMPLETED;

    if (normalized.includes('upcoming') || normalized.includes('not yet'))
      return AnimeStatus.UPCOMING;

    if (normalized.includes('hiatus') || normalized.includes('pause'))
      return AnimeStatus.HIATUS;

    if (normalized.includes('cancel')) return AnimeStatus.CANCELLED;

    return AnimeStatus.ONGOING; // Default to ongoing if unknown
  }

  private parseAnimeSeason(seasonStr: string | null): AnimeSeason | undefined {
    if (!seasonStr) return undefined;

    const normalized = seasonStr.toLowerCase().trim();

    if (normalized.includes('winter')) return AnimeSeason.WINTER;
    if (normalized.includes('spring')) return AnimeSeason.SPRING;
    if (normalized.includes('summer')) return AnimeSeason.SUMMER;
    if (normalized.includes('fall') || normalized.includes('autumn'))
      return AnimeSeason.FALL;

    // Try to determine by month if mentioned
    if (
      normalized.includes('january') ||
      normalized.includes('february') ||
      normalized.includes('december')
    )
      return AnimeSeason.WINTER;

    if (
      normalized.includes('march') ||
      normalized.includes('april') ||
      normalized.includes('may')
    )
      return AnimeSeason.SPRING;

    if (
      normalized.includes('june') ||
      normalized.includes('july') ||
      normalized.includes('august')
    )
      return AnimeSeason.SUMMER;

    if (
      normalized.includes('september') ||
      normalized.includes('october') ||
      normalized.includes('november')
    )
      return AnimeSeason.FALL;

    return undefined;
  }

  private parseNumber(numStr: string | null): number | undefined {
    if (!numStr) return undefined;
    const num = parseInt(numStr.replace(/\D/g, ''));
    return isNaN(num) ? undefined : num;
  }

  private parseFloat(numStr: string | null): number | undefined {
    if (!numStr) return undefined;
    const num = parseFloat(numStr.replace(/[^\d.]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  // Helper function to convert undefined to null for downstream functions that expect null
  private undefinedToNull<T>(value: T | undefined): T | null {
    return value === undefined ? null : value;
  }

  // Helper function to convert null to undefined for upstream functions that expect undefined
  private nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
  }
}
