import { Source } from '@app/common/entities/core/source.entity';
import {
  HtmlParserOptions,
  HtmlParserService,
} from '@hanivanrizky/nestjs-html-parser';
import { Injectable, Logger } from '@nestjs/common';

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

export interface EpisodeScraperConfig {
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
}

@Injectable()
export class EpisodeScraperService {
  private readonly logger = new Logger(EpisodeScraperService.name);

  constructor(private readonly htmlParser: HtmlParserService) {}

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
      const requestOptions = this.getRequestOptions(source);

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
        this.extractText(html, config.number),
      );
      if (!episodeNumber) {
        this.logger.warn(
          `No episode number found for episode page: ${episodeUrl}`,
        );
        return null;
      }

      // Extract source episode ID (required)
      const sourceEpisodeId =
        this.extractText(html, config.sourceId) ||
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
      if (config.title) {
        episode.title = this.extractText(html, config.title) || undefined;
      }

      if (config.thumbnailUrl) {
        episode.thumbnail_url = this.normalizeUrl(
          this.extractAttribute(html, config.thumbnailUrl, 'src'),
          source.base_url,
        );
      }

      if (config.description) {
        episode.description =
          this.extractText(html, config.description) || undefined;
      }

      if (config.duration) {
        episode.duration_seconds = this.parseDurationToSeconds(
          this.extractText(html, config.duration),
        );
      }

      if (config.airDate) {
        const airDateStr = this.extractText(html, config.airDate);
        if (airDateStr) {
          try {
            episode.air_date = new Date(airDateStr);
          } catch (e) {
            this.logger.warn(`Could not parse air date: ${airDateStr}`);
          }
        }
      }

      // Extract download links if available
      if (config.downloadLinks) {
        const linkElements = this.htmlParser.extractMultiple(
          html,
          config.downloadLinks.selector,
          'xpath',
        );

        if (linkElements && linkElements.length > 0) {
          episode.download_links = [];

          for (let i = 0; i < linkElements.length; i++) {
            try {
              const baseSelector = `(${config.downloadLinks.selector})[${i + 1}]`;

              const url = this.extractAttribute(
                html,
                `${baseSelector}${config.downloadLinks.url}`,
                'href',
              );

              if (url) {
                const provider =
                  this.extractText(
                    html,
                    `${baseSelector}${config.downloadLinks.provider}`,
                  ) || 'Unknown';
                const quality =
                  this.extractText(
                    html,
                    `${baseSelector}${config.downloadLinks.quality}`,
                  ) || 'Unknown';

                const downloadLink: ScrapedDownloadLink = {
                  provider: provider.trim(),
                  url: this.normalizeUrl(url, source.base_url) || '',
                  quality: quality.trim(),
                };

                if (config.downloadLinks.format) {
                  downloadLink.format =
                    this.extractText(
                      html,
                      `${baseSelector}${config.downloadLinks.format}`,
                    ) || undefined;
                }

                if (config.downloadLinks.fileSize) {
                  const fileSizeStr = this.extractText(
                    html,
                    `${baseSelector}${config.downloadLinks.fileSize}`,
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

  private parseSourceConfig(source: Source): EpisodeScraperConfig {
    // Parse source.selectors into EpisodeScraperConfig format
    return source.selectors.episode as EpisodeScraperConfig;
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

  private extractSourceEpisodeIdFromUrl(url: string): string {
    // Extract episode ID from URL - implement based on your URL patterns
    const matches = url.match(/\/episode[s]?\/([^\/]+)(?:\/?$|\.[^.]+$)/i);
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
}
