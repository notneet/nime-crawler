import { Source } from '@app/common/entities/core/source.entity';
import { SourceRepository } from '@app/database/repositories/source.repository';
import { Injectable, Logger } from '@nestjs/common';
import { AnimeProcessor } from '../processors/anime.processor';
import {
  AnimeDetailScraperService,
  ScrapedAnimeDetail,
} from '../scrapers/anime-detail-scraper.service';
import { AnimeListScraperService } from '../scrapers/anime-list-scraper.service';
import { ScrapedAnimeData } from '../scrapers/anime-scraper.service';
import {
  EpisodeScraperService,
  ScrapedEpisode,
} from '../scrapers/episode-scraper.service';

export interface CrawlResult {
  animeDetails: ScrapedAnimeDetail[];
  episodes: { [animeId: string]: ScrapedEpisode[] };
}

@Injectable()
export class CrawlerManager {
  private readonly logger = new Logger(CrawlerManager.name);

  constructor(
    private readonly animeListScraper: AnimeListScraperService,
    private readonly animeDetailScraper: AnimeDetailScraperService,
    private readonly episodeScraper: EpisodeScraperService,
    private readonly sourceRepository: SourceRepository,
    private readonly animeProcessor: AnimeProcessor,
  ) {}

  /**
   * Crawl a source using the three-step process
   * 1. Crawl the anime list
   * 2. Crawl each anime detail page
   * 3. Crawl each episode page
   */
  async crawlSource(
    sourceId: bigint,
    maxPages: number = 5,
  ): Promise<CrawlResult> {
    try {
      this.logger.log(
        `Starting three-step crawl for source ${sourceId}, max pages: ${maxPages}`,
      );

      // Get source configuration
      const source = await this.sourceRepository.findById(sourceId);
      if (!source) {
        throw new Error(`Source with ID ${sourceId} not found`);
      }

      // Step 1: Crawl anime list pages
      this.logger.log(`Step 1: Crawling anime list from ${source.name}`);
      const animeListItems =
        await this.animeListScraper.scrapePaginatedAnimeList(source, maxPages);

      this.logger.log(`Found ${animeListItems.length} anime in list pages`);

      // Step 2: Crawl each anime detail page
      this.logger.log(
        `Step 2: Crawling anime details for ${animeListItems.length} anime`,
      );
      const animeDetails: ScrapedAnimeDetail[] = [];

      for (let i = 0; i < animeListItems.length; i++) {
        try {
          // Add delay between requests to avoid rate limiting
          if (i > 0) {
            await this.delay(source.delay_ms);
          }

          const animeItem = animeListItems[i];
          this.logger.log(
            `Crawling detail for anime ${i + 1}/${animeListItems.length}: ${animeItem.title}`,
          );

          const detail = await this.animeDetailScraper.scrapeAnimeDetail(
            source,
            animeItem.source_url,
            animeItem.source_anime_id,
          );

          if (detail) {
            animeDetails.push(detail);
          }
        } catch (error) {
          this.logger.error(
            `Error crawling anime detail at index ${i}:`,
            error.message,
          );
        }
      }

      this.logger.log(
        `Successfully crawled ${animeDetails.length} anime details`,
      );

      // Step 3: Crawl episode pages
      this.logger.log(
        `Step 3: Crawling episodes for ${animeDetails.length} anime`,
      );
      const episodes: { [animeId: string]: ScrapedEpisode[] } = {};

      for (let i = 0; i < animeDetails.length; i++) {
        const animeDetail = animeDetails[i];
        const animeId = animeDetail.source_anime_id;

        if (
          !animeDetail.episodes_urls ||
          animeDetail.episodes_urls.length === 0
        ) {
          this.logger.log(
            `No episode URLs found for anime: ${animeDetail.title}`,
          );
          continue;
        }

        this.logger.log(
          `Crawling ${animeDetail.episodes_urls.length} episodes for anime ${i + 1}/${animeDetails.length}: ${animeDetail.title}`,
        );

        episodes[animeId] = [];

        for (let j = 0; j < animeDetail.episodes_urls.length; j++) {
          try {
            // Add delay between requests
            if (j > 0) {
              await this.delay(source.delay_ms);
            }

            const episodeUrl = animeDetail.episodes_urls[j];

            const episode = await this.episodeScraper.scrapeEpisode(
              source,
              episodeUrl,
              animeId,
            );

            if (episode) {
              episodes[animeId].push(episode);
            }
          } catch (error) {
            this.logger.error(
              `Error crawling episode ${j + 1} for anime ${animeDetail.title}:`,
              error.message,
            );
          }
        }

        this.logger.log(
          `Successfully crawled ${episodes[animeId].length} episodes for anime: ${animeDetail.title}`,
        );
      }

      // Process and save the crawled data
      await this.processAndSaveCrawledData(source, animeDetails, episodes);

      // Update source last crawled timestamp
      await this.sourceRepository.updateLastCrawledAt(sourceId);

      return {
        animeDetails,
        episodes,
      };
    } catch (error) {
      this.logger.error(
        `Error during three-step crawl for source ${sourceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Process and save crawled data
   */
  private async processAndSaveCrawledData(
    source: Source,
    animeDetails: ScrapedAnimeDetail[],
    episodes: { [animeId: string]: ScrapedEpisode[] },
  ) {
    this.logger.log(
      `Processing and saving data for ${animeDetails.length} anime`,
    );

    // Convert scraped data to format expected by processor
    const processedData: ScrapedAnimeData[] = animeDetails.map(detail => {
      return {
        title: detail.title,
        slug: detail.slug,
        alternative_title: detail.alternative_title,
        synopsis: detail.synopsis,
        poster_url: detail.poster_url,
        banner_url: detail.banner_url,
        type: detail.type,
        status: detail.status,
        total_episodes: detail.total_episodes,
        release_year: detail.release_year,
        season: detail.season,
        rating: detail.rating,
        source_anime_id: detail.source_anime_id,
        source_url: detail.source_url,
      };
    });

    // Process and save data using existing processor
    const result = await this.animeProcessor.bulkProcessScrapedAnime(
      source,
      processedData,
    );

    this.logger.log(
      `Bulk processing complete: Created ${result.created}, Updated ${result.updated}, Errors: ${result.errors.length}`,
    );

    return result;
  }

  /**
   * Crawl all active sources
   */
  async crawlAllActiveSources(
    maxPages: number = 3,
  ): Promise<{ [sourceId: string]: any }> {
    try {
      this.logger.log(
        `Starting three-step crawl for all active sources, max pages: ${maxPages}`,
      );

      const activeSources = await this.sourceRepository.find({
        where: { is_active: true },
        order: { priority: 'ASC' },
      });
      this.logger.log(`Found ${activeSources.length} active sources to crawl`);

      const results: { [sourceId: string]: any } = {};

      for (const source of activeSources) {
        try {
          this.logger.log(`Crawling source: ${source.name} (ID: ${source.id})`);
          const result = await this.crawlSource(source.id, maxPages);
          results[source.id.toString()] = {
            name: source.name,
            animeCount: result.animeDetails.length,
            episodeCount: Object.values(result.episodes).reduce(
              (sum, eps) => sum + eps.length,
              0,
            ),
          };
        } catch (error) {
          this.logger.error(`Error crawling source ${source.name}:`, error);
          results[source.id.toString()] = { error: error.message };
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error crawling all sources:', error);
      throw error;
    }
  }

  /**
   * Utility method to add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
