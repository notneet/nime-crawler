import { Injectable, Logger } from '@nestjs/common';
import { HtmlParserService } from '@hanivanrizky/nestjs-html-parser';
import { Source } from '@app/common/entities/core/source.entity';
import {
  AnimeType,
  AnimeStatus,
  AnimeSeason,
} from '@app/common/entities/core/anime.entity';

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

export interface ScraperConfig {
  selectors: {
    animeList: string;
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
    sourceId: string;
    sourceUrl: string;
  };
  headers?: Record<string, string>;
  pagination?: {
    selector: string;
    maxPages?: number;
  };
}

@Injectable()
export class AnimeScraperService {
  private readonly logger = new Logger(AnimeScraperService.name);

  constructor(private readonly htmlParser: HtmlParserService) {}

  async scrapeAnimeList(
    source: Source,
    startUrl?: string,
  ): Promise<ScrapedAnimeData[]> {
    try {
      this.logger.log(`Starting scrape for source: ${source.name}`);

      const url = startUrl || source.base_url;
      const config = this.parseSourceConfig(source);

      const response = await this.htmlParser.fetchHtml(url, {
        headers: config.headers || source.headers,
        timeout: 30000,
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${url}`);
      }

      const animeElements = this.htmlParser.extractMultiple(
        response.data,
        config.selectors.animeList,
      );

      this.logger.log(`Found ${animeElements.length} anime elements`);

      const scrapedData: ScrapedAnimeData[] = [];

      for (let i = 0; i < animeElements.length; i++) {
        try {
          const animeData = await this.scrapeAnimeDetails(
            response.data,
            config,
            i,
            source,
          );

          if (animeData) {
            scrapedData.push(animeData);
          }
        } catch (error) {
          this.logger.error(`Error scraping anime ${i}:`, error.message);
        }
      }

      this.logger.log(`Successfully scraped ${scrapedData.length} anime`);
      return scrapedData;
    } catch (error) {
      this.logger.error(`Error scraping source ${source.name}:`, error);
      throw error;
    }
  }

  private async scrapeAnimeDetails(
    html: string,
    config: ScraperConfig,
    index: number,
    source: Source,
  ): Promise<ScrapedAnimeData | null> {
    try {
      const baseSelector = `(${config.selectors.animeList})[${index + 1}]`;

      const title = this.extractText(
        html,
        `${baseSelector}${config.selectors.title}`,
      );
      if (!title) {
        this.logger.warn(`No title found for anime at index ${index}`);
        return null;
      }

      const sourceAnimeId = this.extractText(
        html,
        `${baseSelector}${config.selectors.sourceId}`,
      );
      const sourceUrl = this.extractText(
        html,
        `${baseSelector}${config.selectors.sourceUrl}`,
      );

      if (!sourceAnimeId || !sourceUrl) {
        this.logger.warn(`Missing required data for anime: ${title}`);
        return null;
      }

      const animeData: ScrapedAnimeData = {
        title: title.trim(),
        slug: this.generateSlug(title),
        source_anime_id: sourceAnimeId.trim(),
        source_url: this.normalizeUrl(sourceUrl, source.base_url) || '',
      };

      // Extract optional fields
      if (config.selectors.alternativeTitle) {
        animeData.alternative_title = this.extractText(
          html,
          `${baseSelector}${config.selectors.alternativeTitle}`,
        ) || undefined;
      }

      if (config.selectors.synopsis) {
        animeData.synopsis = this.extractText(
          html,
          `${baseSelector}${config.selectors.synopsis}`,
        ) || undefined;
      }

      if (config.selectors.posterUrl) {
        animeData.poster_url = this.normalizeUrl(
          this.extractAttribute(
            html,
            `${baseSelector}${config.selectors.posterUrl}`,
            'src',
          ),
          source.base_url,
        );
      }

      if (config.selectors.bannerUrl) {
        animeData.banner_url = this.normalizeUrl(
          this.extractAttribute(
            html,
            `${baseSelector}${config.selectors.bannerUrl}`,
            'src',
          ),
          source.base_url,
        );
      }

      if (config.selectors.type) {
        animeData.type = this.parseAnimeType(
          this.extractText(html, `${baseSelector}${config.selectors.type}`),
        );
      }

      if (config.selectors.status) {
        animeData.status = this.parseAnimeStatus(
          this.extractText(html, `${baseSelector}${config.selectors.status}`),
        );
      }

      if (config.selectors.totalEpisodes) {
        animeData.total_episodes = this.parseNumber(
          this.extractText(
            html,
            `${baseSelector}${config.selectors.totalEpisodes}`,
          ),
        );
      }

      if (config.selectors.releaseYear) {
        animeData.release_year = this.parseNumber(
          this.extractText(
            html,
            `${baseSelector}${config.selectors.releaseYear}`,
          ),
        );
      }

      if (config.selectors.season) {
        animeData.season = this.parseAnimeSeason(
          this.extractText(html, `${baseSelector}${config.selectors.season}`),
        );
      }

      if (config.selectors.rating) {
        animeData.rating = this.parseFloat(
          this.extractText(html, `${baseSelector}${config.selectors.rating}`),
        );
      }

      return animeData;
    } catch (error) {
      this.logger.error(
        `Error extracting anime details at index ${index}:`,
        error,
      );
      return null;
    }
  }

  private extractText(html: string, selector: string): string | null {
    try {
      return this.htmlParser.extractSingle(html, selector);
    } catch {
      return null;
    }
  }

  private extractAttribute(
    html: string,
    selector: string,
    attribute: string,
  ): string | null {
    try {
      return this.htmlParser.extractSingle(html, `${selector}/@${attribute}`);
    } catch {
      return null;
    }
  }

  private parseSourceConfig(source: Source): ScraperConfig {
    if (!source.selectors) {
      throw new Error(`Source ${source.name} has no selector configuration`);
    }

    return source.selectors as ScraperConfig;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
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
      if (url.startsWith('http')) {
        return url;
      }

      const base = new URL(baseUrl);
      return new URL(url, base.origin).toString();
    } catch {
      return undefined;
    }
  }

  private parseAnimeType(typeStr: string | null): AnimeType | undefined {
    if (!typeStr) return undefined;

    const normalized = typeStr.toLowerCase().trim();

    switch (normalized) {
      case 'tv':
      case 'series':
        return AnimeType.TV;
      case 'movie':
      case 'film':
        return AnimeType.MOVIE;
      case 'ova':
        return AnimeType.OVA;
      case 'ona':
        return AnimeType.ONA;
      case 'special':
        return AnimeType.SPECIAL;
      case 'music':
        return AnimeType.MUSIC;
      default:
        return AnimeType.TV; // Default fallback
    }
  }

  private parseAnimeStatus(statusStr: string | null): AnimeStatus | undefined {
    if (!statusStr) return undefined;

    const normalized = statusStr.toLowerCase().trim();

    switch (normalized) {
      case 'ongoing':
      case 'airing':
      case 'currently airing':
        return AnimeStatus.ONGOING;
      case 'completed':
      case 'finished':
      case 'finished airing':
        return AnimeStatus.COMPLETED;
      case 'upcoming':
      case 'not yet aired':
        return AnimeStatus.UPCOMING;
      case 'hiatus':
      case 'on hiatus':
        return AnimeStatus.HIATUS;
      case 'cancelled':
      case 'canceled':
        return AnimeStatus.CANCELLED;
      default:
        return AnimeStatus.ONGOING; // Default fallback
    }
  }

  private parseAnimeSeason(seasonStr: string | null): AnimeSeason | undefined {
    if (!seasonStr) return undefined;

    const normalized = seasonStr.toLowerCase().trim();

    switch (normalized) {
      case 'spring':
      case 'musim semi':
        return AnimeSeason.SPRING;
      case 'summer':
      case 'musim panas':
        return AnimeSeason.SUMMER;
      case 'fall':
      case 'autumn':
      case 'musim gugur':
        return AnimeSeason.FALL;
      case 'winter':
      case 'musim dingin':
        return AnimeSeason.WINTER;
      default:
        return undefined;
    }
  }

  private parseNumber(numStr: string | null): number | undefined {
    if (!numStr) return undefined;

    const num = parseInt(numStr.replace(/\D/g, ''), 10);
    return isNaN(num) ? undefined : num;
  }

  private parseFloat(numStr: string | null): number | undefined {
    if (!numStr) return undefined;

    const num = parseFloat(numStr.replace(/[^\d.]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  async scrapePaginatedAnimeList(
    source: Source,
    maxPages: number = 10,
  ): Promise<ScrapedAnimeData[]> {
    const allAnime: ScrapedAnimeData[] = [];
    const config = this.parseSourceConfig(source);

    if (!config.pagination) {
      return this.scrapeAnimeList(source);
    }

    for (let page = 1; page <= maxPages; page++) {
      try {
        const pageUrl = this.buildPageUrl(source.base_url, page);
        this.logger.log(`Scraping page ${page}: ${pageUrl}`);

        const pageAnime = await this.scrapeAnimeList(source, pageUrl);

        if (pageAnime.length === 0) {
          this.logger.log(
            `No anime found on page ${page}, stopping pagination`,
          );
          break;
        }

        allAnime.push(...pageAnime);

        // Respect rate limiting
        await this.delay(source.delay_ms);
      } catch (error) {
        this.logger.error(`Error scraping page ${page}:`, error);
        break;
      }
    }

    this.logger.log(
      `Total anime scraped across ${maxPages} pages: ${allAnime.length}`,
    );
    return allAnime;
  }

  private buildPageUrl(baseUrl: string, page: number): string {
    if (baseUrl.includes('?')) {
      return `${baseUrl}&page=${page}`;
    }
    return `${baseUrl}?page=${page}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
