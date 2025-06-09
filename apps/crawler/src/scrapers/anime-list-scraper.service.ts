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

export interface AnimeListScraperConfig {
  selector: string;
  title: string;
  posterUrl?: string;
  sourceId: string;
  sourceUrl: string;
  pagination?: {
    selector: string;
    maxPages?: number;
  };
}

@Injectable()
export class AnimeListScraperService {
  private readonly logger = new Logger(AnimeListScraperService.name);

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

      const requestOptions = this.getRequestOptions(source);
      const response: HtmlFetchResponse = await this.htmlParser.fetchHtml(
        url,
        requestOptions,
      );

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${url}`);
      }

      const animeElements = this.htmlParser.extractMultiple(
        response.data,
        config.selector,
        'xpath',
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
        config.pagination?.maxPages &&
        config.pagination.maxPages < maxPages
      ) {
        maxPages = config.pagination.maxPages;
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

  private scrapeAnimeListItem(
    html: string,
    config: AnimeListScraperConfig,
    index: number,
    source: Source,
  ): ScrapedAnimeListItem | null {
    try {
      const baseSelector = `(${config.selector})[${index + 1}]`;

      const title = this.extractText(html, `${baseSelector}${config.title}`);
      if (!title) {
        this.logger.warn(`No title found for anime at index ${index}`);
        return null;
      }

      const sourceAnimeId = this.extractText(
        html,
        `${baseSelector}${config.sourceId}`,
      );
      const sourceUrl = this.extractText(
        html,
        `${baseSelector}${config.sourceUrl}`,
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
      if (config.posterUrl) {
        animeData.poster_url = this.normalizeUrl(
          this.extractAttribute(
            html,
            `${baseSelector}${config.posterUrl}`,
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

  private buildPageUrl(baseUrl: string, page: number): string {
    // Implement based on the source URL pattern
    // Examples:
    // - https://example.com/anime/page/2
    // - https://example.com/anime?page=2
    return `${baseUrl}/page/${page}`;
  }

  private parseSourceConfig(source: Source): AnimeListScraperConfig {
    // Parse source.selectors into AnimeListScraperConfig format
    // This is a placeholder - actual implementation will depend on how selectors are stored
    return source.selectors.animeList as AnimeListScraperConfig;
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

  private extractText(html: string, selector: string): string | null {
    try {
      return this.htmlParser.extractSingle(html, selector, 'xpath') || null;
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
    url: string | null,
    baseUrl: string,
  ): string | undefined {
    if (!url) return undefined;

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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
