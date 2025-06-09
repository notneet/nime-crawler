import {
  AnimeSeason,
  AnimeStatus,
  AnimeType,
} from '@app/common/entities/core/anime.entity';
import { Source } from '@app/common/entities/core/source.entity';
import {
  HtmlFetchResponse,
  HtmlParserOptions,
  HtmlParserService,
} from '@hanivanrizky/nestjs-html-parser';
import { Injectable, Logger } from '@nestjs/common';

export interface ScrapedAnimeListItem {
  title: string;
  slug: string;
  poster_url?: string;
  source_anime_id: string;
  source_url: string;
}

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

export interface ScrapedEpisode {
  episode_number: number;
  title?: string;
  thumbnail_url?: string;
  description?: string;
  duration_seconds?: number;
  air_date?: Date;
  source_episode_id: string;
  source_url: string;
  download_links?: ScrapedDownloadLink[];
}

export interface ScrapedDownloadLink {
  provider: string;
  url: string;
  quality: string;
  format?: string;
  file_size_bytes?: number;
}

export interface ScraperConfig {
  // Anime List Page Configuration
  animeList: {
    selector: string;
    title: string;
    posterUrl?: string;
    sourceId: string;
    sourceUrl: string;
    pagination?: {
      selector: string;
      maxPages?: number;
    };
  };

  // Anime Detail Page Configuration
  animeDetail: {
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
  };

  // Episode Page Configuration
  episode: {
    number: string;
    title?: string;
    thumbnailUrl?: string;
    description?: string;
    duration?: string;
    airDate?: string;
    sourceId: string;
    downloadLinks?: {
      selector: string;
      provider: string;
      url: string;
      quality: string;
      format?: string;
      fileSize?: string;
    };
  };

  headers?: Record<string, string>;
}

export interface ScrapedAnimeData {
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
}

@Injectable()
export class AnimeScraperService {
  private readonly logger = new Logger(AnimeScraperService.name);

  constructor(private readonly htmlParser: HtmlParserService) {}

  /**
   * Scrape anime list page to get basic info and URLs to detail pages
   */
  async scrapeAnimeList(
    source: Source,
    startUrl?: string,
  ): Promise<ScrapedAnimeListItem[]> {
    try {
      this.logger.log(
        `Starting scrape for anime list from source: ${source.name}`,
      );

      const url = startUrl || source.base_url;
      const config = this.parseSourceConfig(source);

      const requestOptions: HtmlParserOptions = this.getRequestOptions(
        source,
        config,
      );
      const response: HtmlFetchResponse = await this.htmlParser.fetchHtml(
        url,
        requestOptions,
      );

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${url}`);
      }

      const animeElements = this.htmlParser.extractMultiple(
        response.data,
        config.animeList.selector,
        'xpath', // Use XPath as default selector type
      );

      this.logger.log(
        `Found ${animeElements.length} anime elements in list page`,
      );

      const scrapedData: ScrapedAnimeListItem[] = [];

      for (let i = 0; i < animeElements.length; i++) {
        try {
          const animeData = await this.scrapeAnimeListItem(
            response.data,
            config,
            i,
            source,
          );

          if (animeData) {
            scrapedData.push(animeData);
          }
        } catch (error) {
          this.logger.error(
            `Error scraping anime list item ${i}:`,
            error.message,
          );
        }
      }

      this.logger.log(
        `Successfully scraped ${scrapedData.length} anime list items`,
      );
      return scrapedData;
    } catch (error) {
      this.logger.error(
        `Error scraping anime list from source ${source.name}:`,
        error,
      );
      throw error;
    }
  }

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
      const requestOptions = this.getRequestOptions(source, config);

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
      const title = this.extractText(html, config.animeDetail.title);

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
      animeDetail.alternative_title = this.nullToUndefined(
        this.extractText(html, config.animeDetail.alternativeTitle || ''),
      );

      animeDetail.synopsis = this.nullToUndefined(
        this.extractText(html, config.animeDetail.synopsis || ''),
      );

      if (config.animeDetail.posterUrl) {
        animeDetail.poster_url = this.normalizeUrl(
          this.extractAttribute(html, config.animeDetail.posterUrl, 'src'),
          source.base_url,
        );
      }

      if (config.animeDetail.bannerUrl) {
        animeDetail.banner_url = this.normalizeUrl(
          this.extractAttribute(html, config.animeDetail.bannerUrl, 'src'),
          source.base_url,
        );
      }

      if (config.animeDetail.type) {
        animeDetail.type = this.parseAnimeType(
          this.extractText(html, config.animeDetail.type),
        );
      }

      if (config.animeDetail.status) {
        animeDetail.status = this.parseAnimeStatus(
          this.extractText(html, config.animeDetail.status),
        );
      }

      if (config.animeDetail.totalEpisodes) {
        animeDetail.total_episodes = this.parseNumber(
          this.extractText(html, config.animeDetail.totalEpisodes),
        );
      }

      if (config.animeDetail.releaseYear) {
        animeDetail.release_year = this.parseNumber(
          this.extractText(html, config.animeDetail.releaseYear),
        );
      }

      if (config.animeDetail.season) {
        animeDetail.season = this.parseAnimeSeason(
          this.extractText(html, config.animeDetail.season),
        );
      }

      if (config.animeDetail.rating) {
        animeDetail.rating = this.parseFloat(
          this.extractText(html, config.animeDetail.rating),
        );
      }

      // Extract episode URLs if available
      if (config.animeDetail.episodeList) {
        const episodeElements = this.htmlParser.extractMultiple(
          html,
          config.animeDetail.episodeList.selector,
          'xpath',
        );

        if (episodeElements && episodeElements.length > 0) {
          animeDetail.episodes_urls = [];

          for (let i = 0; i < episodeElements.length; i++) {
            const episodeUrl = this.extractAttribute(
              html,
              `(${config.animeDetail.episodeList.selector})[${i + 1}]${config.animeDetail.episodeList.sourceUrl}`,
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

  /**
   * Scrape episode page to get episode details and download links
   */
  async scrapeEpisode(
    source: Source,
    episodeUrl: string,
    animeId?: string,
  ): Promise<ScrapedEpisode | null> {
    try {
      this.logger.log(`Scraping episode from: ${episodeUrl}`);

      const config = this.parseSourceConfig(source);
      const requestOptions = this.getRequestOptions(source, config);

      const response = await this.htmlParser.fetchHtml(
        episodeUrl,
        requestOptions,
      );

      if (response.status !== 200) {
        throw new Error(
          `HTTP ${response.status}: Failed to fetch episode from ${episodeUrl}`,
        );
      }

      const html = response.data;

      // Extract episode number (required)
      const episodeNumber = this.parseNumber(
        this.extractText(html, config.episode.number),
      );
      if (!episodeNumber) {
        this.logger.warn(
          `No episode number found for episode page: ${episodeUrl}`,
        );
        return null;
      }

      // Extract source episode ID (required)
      const sourceEpisodeId =
        this.extractText(html, config.episode.sourceId) ||
        this.extractSourceEpisodeIdFromUrl(episodeUrl);

      if (!sourceEpisodeId) {
        this.logger.warn(
          `No source episode ID found for episode page: ${episodeUrl}`,
        );
        return null;
      }

      // Create the base episode object
      const episode: ScrapedEpisode = {
        episode_number: episodeNumber,
        source_episode_id: sourceEpisodeId,
        source_url: episodeUrl,
      };

      // Extract optional fields
      episode.title = this.nullToUndefined(
        this.extractText(html, config.episode.title || ''),
      );

      if (config.episode.thumbnailUrl) {
        episode.thumbnail_url = this.normalizeUrl(
          this.extractAttribute(html, config.episode.thumbnailUrl, 'src'),
          source.base_url,
        );
      }

      episode.description = this.nullToUndefined(
        this.extractText(html, config.episode.description || ''),
      );

      if (config.episode.duration) {
        episode.duration_seconds = this.parseDurationToSeconds(
          this.extractText(html, config.episode.duration),
        );
      }

      if (config.episode.airDate) {
        const airDateStr = this.extractText(html, config.episode.airDate);
        if (airDateStr) {
          try {
            episode.air_date = new Date(airDateStr);
          } catch (e) {
            this.logger.warn(`Could not parse air date: ${airDateStr}`);
          }
        }
      }

      // Extract download links if available
      if (config.episode.downloadLinks) {
        const linkElements = this.htmlParser.extractMultiple(
          html,
          config.episode.downloadLinks.selector,
          'xpath',
        );

        if (linkElements && linkElements.length > 0) {
          episode.download_links = [];

          for (let i = 0; i < linkElements.length; i++) {
            try {
              const baseSelector = `(${config.episode.downloadLinks.selector})[${i + 1}]`;

              const url = this.extractAttribute(
                html,
                `${baseSelector}${config.episode.downloadLinks.url}`,
                'href',
              );

              if (url) {
                const provider =
                  this.extractText(
                    html,
                    `${baseSelector}${config.episode.downloadLinks.provider}`,
                  ) || 'Unknown';
                const quality =
                  this.extractText(
                    html,
                    `${baseSelector}${config.episode.downloadLinks.quality}`,
                  ) || 'Unknown';

                const downloadLink: ScrapedDownloadLink = {
                  provider: provider.trim(),
                  url: this.normalizeUrl(url, source.base_url),
                  quality: quality.trim(),
                };

                downloadLink.format = this.nullToUndefined(
                  this.extractText(
                    html,
                    `${baseSelector}${config.episode.downloadLinks.format}`,
                  ),
                );

                if (config.episode.downloadLinks.fileSize) {
                  const fileSizeStr = this.extractText(
                    html,
                    `${baseSelector}${config.episode.downloadLinks.fileSize}`,
                  );
                  downloadLink.file_size_bytes =
                    this.parseFileSizeToBytes(fileSizeStr);
                }

                episode.download_links.push(downloadLink);
              }
            } catch (error) {
              this.logger.error(
                `Error scraping download link ${i}:`,
                error.message,
              );
            }
          }

          this.logger.log(
            `Found ${episode.download_links.length} download links for episode ${episodeNumber}`,
          );
        }
      }

      return episode;
    } catch (error) {
      this.logger.error(`Error scraping episode from ${episodeUrl}:`, error);
      throw error;
    }
  }

  private scrapeAnimeListItem(
    html: string,
    config: ScraperConfig,
    index: number,
    source: Source,
  ): ScrapedAnimeListItem | null {
    try {
      const baseSelector = `(${config.animeList.selector})[${index + 1}]`;

      const title = this.extractText(
        html,
        `${baseSelector}${config.animeList.title}`,
      );
      if (!title) {
        this.logger.warn(`No title found for anime at index ${index}`);
        return null;
      }

      const sourceAnimeId = this.extractText(
        html,
        `${baseSelector}${config.animeList.sourceId}`,
      );
      const sourceUrl = this.extractText(
        html,
        `${baseSelector}${config.animeList.sourceUrl}`,
      );

      if (!sourceAnimeId || !sourceUrl) {
        this.logger.warn(`Missing required data for anime: ${title}`);
        return null;
      }

      const animeData: ScrapedAnimeListItem = {
        title: title.trim(),
        slug: this.generateSlug(title),
        source_anime_id: sourceAnimeId.trim(),
        source_url: this.normalizeUrl(sourceUrl, source.base_url) || '',
      };

      // Extract poster URL if available
      if (config.animeList.posterUrl) {
        animeData.poster_url = this.normalizeUrl(
          this.extractAttribute(
            html,
            `${baseSelector}${config.animeList.posterUrl}`,
            'src',
          ),
          source.base_url,
        );
      }

      return animeData;
    } catch (error) {
      this.logger.error(`Error scraping anime list item:`, error);
      return null;
    }
  }

  // Helper methods for scrapers

  private getRequestOptions(
    source: Source,
    config: ScraperConfig,
  ): HtmlParserOptions {
    return {
      timeout: source.timeout_seconds * 1000,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...config.headers,
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

  private extractSourceEpisodeIdFromUrl(url: string): string {
    // Extract episode ID from URL - implement based on your URL patterns
    const matches = url.match(/\/episode[s]?\/([^\/]+)(?:\/?$|\.[^.]+$)/i);
    return matches ? matches[1] : url;
  }

  private parseDurationToSeconds(
    durationStr: string | null,
  ): number | undefined {
    if (!durationStr) return undefined;

    // Handle formats like "24m", "1h 30m", "1:30:00"
    const hourMinSecPattern = /(\d+):(\d+)(?::(\d+))?/;
    const hourMinPattern = /(?:(\d+)h)?\s*(?:(\d+)m)?/i;

    if (hourMinSecPattern.test(durationStr)) {
      const [_, hours, minutes, seconds] =
        durationStr.match(hourMinSecPattern) || [];
      return (
        parseInt(hours) * 3600 +
        parseInt(minutes) * 60 +
        parseInt(seconds || '0')
      );
    } else if (hourMinPattern.test(durationStr)) {
      const [_, hours, minutes] = durationStr.match(hourMinPattern) || [];
      return parseInt(hours || '0') * 3600 + parseInt(minutes || '0') * 60;
    }

    return undefined;
  }

  private parseFileSizeToBytes(
    sizeStr: string | null | undefined,
  ): number | undefined {
    if (!sizeStr) return undefined;

    try {
      const normalized = sizeStr.toLowerCase().trim();
      const match = normalized.match(/^([\d.]+)\s*([kmgt]?b)$/i);

      if (!match) return undefined;

      const [, value, unit] = match;
      const numValue = parseFloat(value);

      if (isNaN(numValue)) return undefined;

      switch (unit.toLowerCase()) {
        case 'kb':
          return numValue * 1024;
        case 'mb':
          return numValue * 1024 * 1024;
        case 'gb':
          return numValue * 1024 * 1024 * 1024;
        case 'tb':
          return numValue * 1024 * 1024 * 1024 * 1024;
        default:
          return numValue;
      }
    } catch (error) {
      return undefined;
    }
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

  private parseSourceConfig(source: Source): ScraperConfig {
    // Parse source.selectors into ScraperConfig format
    // This is a placeholder - actual implementation will depend on how selectors are stored
    return source.selectors as unknown as ScraperConfig;
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

  private parseAnimeType(
    typeStr: string | null | undefined,
  ): AnimeType | undefined {
    if (!typeStr) return undefined;

    const normalized = typeStr.toLowerCase().trim();

    if (normalized.includes('tv')) return AnimeType.TV;
    if (normalized.includes('movie')) return AnimeType.MOVIE;
    if (normalized.includes('ova')) return AnimeType.OVA;
    if (normalized.includes('ona')) return AnimeType.ONA;
    if (normalized.includes('special')) return AnimeType.SPECIAL;
    if (normalized.includes('music')) return AnimeType.MUSIC;

    return AnimeType.TV; // Default to TV
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

  private parseNumber(numStr: string | null | undefined): number | undefined {
    if (!numStr) return undefined;

    try {
      // Extract only numeric part, handling different formats
      const matches = numStr.match(/(-?\d+(?:\.\d+)?)/);
      if (!matches) return undefined;

      const num = parseFloat(matches[1]);
      return isNaN(num) ? undefined : num;
    } catch (error) {
      return undefined;
    }
  }

  private parseFloat(numStr: string | null): number | undefined {
    if (!numStr) return undefined;
    const num = parseFloat(numStr.replace(/[^\d.]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Scrape paginated anime list pages
   */
  async scrapePaginatedAnimeList(
    source: Source,
    maxPages: number = 10,
  ): Promise<ScrapedAnimeListItem[]> {
    try {
      this.logger.log(
        `Starting paginated scrape for source: ${source.name}, max pages: ${maxPages}`,
      );

      const config = this.parseSourceConfig(source);
      let allAnime: ScrapedAnimeListItem[] = [];

      // Limit to configured max pages if available
      if (
        config.animeList.pagination?.maxPages &&
        config.animeList.pagination.maxPages < maxPages
      ) {
        maxPages = config.animeList.pagination.maxPages;
      }

      // Start with the first page
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages && currentPage <= maxPages) {
        const pageUrl = this.buildPageUrl(source.base_url, currentPage);
        this.logger.log(`Scraping page ${currentPage}: ${pageUrl}`);

        try {
          // Add delay between requests to avoid rate limiting
          if (currentPage > 1) {
            await this.delay(source.delay_ms || 5000);
          }

          const animeOnPage = await this.scrapeAnimeList(source, pageUrl);
          if (animeOnPage.length === 0) {
            this.logger.log(
              `No anime found on page ${currentPage}, stopping pagination`,
            );
            hasMorePages = false;
          } else {
            allAnime = [...allAnime, ...animeOnPage];
            this.logger.log(
              `Found ${animeOnPage.length} anime on page ${currentPage}, total so far: ${allAnime.length}`,
            );
            currentPage++;
          }
        } catch (error) {
          this.logger.error(`Error scraping page ${currentPage}:`, error);
          hasMorePages = false;
        }
      }

      this.logger.log(
        `Completed paginated scrape, found ${allAnime.length} anime across ${currentPage - 1} pages`,
      );
      return allAnime;
    } catch (error) {
      this.logger.error(`Error in paginated anime scrape:`, error);
      throw error;
    }
  }

  private buildPageUrl(baseUrl: string, page: number): string {
    // Implement based on the source URL pattern
    // Examples:
    // - https://example.com/anime/page/2
    // - https://example.com/anime?page=2
    return `${baseUrl}/page/${page}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
  }
}
