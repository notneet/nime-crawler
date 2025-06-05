import { Injectable, Logger } from '@nestjs/common';
import { AnimeRepository } from '@app/database/repositories/anime.repository';
import { Source } from '@app/common/entities/core/source.entity';
import { Anime } from '@app/common/entities/core/anime.entity';
import { ScrapedAnimeData } from '../scrapers/anime-scraper.service';
import { AnimeValidator } from '../validators/anime.validator';

export interface ProcessedAnimeResult {
  anime: Anime;
  isNew: boolean;
  hasChanges: boolean;
}

export interface BulkProcessResult {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    sourceAnimeId: string;
    title: string;
    error: string;
  }>;
}

@Injectable()
export class AnimeProcessor {
  private readonly logger = new Logger(AnimeProcessor.name);

  constructor(
    private readonly animeRepository: AnimeRepository,
    private readonly animeValidator: AnimeValidator,
  ) {}

  async processScrapedAnime(
    source: Source,
    scrapedData: ScrapedAnimeData,
  ): Promise<ProcessedAnimeResult | null> {
    try {
      this.logger.log(
        `Processing anime: ${scrapedData.title} from source: ${source.name}`,
      );

      // Validate scraped data
      const validationResult =
        this.animeValidator.validateScrapedData(scrapedData);
      if (!validationResult.isValid) {
        this.logger.warn(
          `Validation failed for anime ${scrapedData.title}: ${validationResult.errors.join(', ')}`,
        );
        return null;
      }

      // Check if anime already exists
      const existingAnime = await this.animeRepository.findBySource(
        source.id,
        scrapedData.source_anime_id,
      );

      if (existingAnime) {
        return this.updateExistingAnime(existingAnime, scrapedData);
      } else {
        return this.createNewAnime(source, scrapedData);
      }
    } catch (error) {
      this.logger.error(`Error processing anime ${scrapedData.title}:`, error);
      throw error;
    }
  }

  private async createNewAnime(
    source: Source,
    scrapedData: ScrapedAnimeData,
  ): Promise<ProcessedAnimeResult> {
    try {
      this.logger.log(`Creating new anime: ${scrapedData.title}`);

      const animeData = {
        title: scrapedData.title,
        slug: scrapedData.slug,
        alternative_title: scrapedData.alternative_title,
        synopsis: scrapedData.synopsis,
        poster_url: scrapedData.poster_url,
        banner_url: scrapedData.banner_url,
        type: scrapedData.type,
        status: scrapedData.status,
        total_episodes: scrapedData.total_episodes,
        release_year: scrapedData.release_year,
        season: scrapedData.season,
        rating: scrapedData.rating,
        source_id: source.id,
        source_anime_id: scrapedData.source_anime_id,
        source_url: scrapedData.source_url,
        last_updated_at: new Date(),
      };

      const anime = await this.animeRepository.create(animeData);

      this.logger.log(
        `Successfully created anime: ${anime.title} (ID: ${anime.id})`,
      );

      return {
        anime,
        isNew: true,
        hasChanges: true,
      };
    } catch (error) {
      this.logger.error(`Error creating anime ${scrapedData.title}:`, error);
      throw error;
    }
  }

  private async updateExistingAnime(
    existingAnime: Anime,
    scrapedData: ScrapedAnimeData,
  ): Promise<ProcessedAnimeResult> {
    try {
      this.logger.log(`Checking for updates to anime: ${existingAnime.title}`);

      const hasChanges = this.detectChanges(existingAnime, scrapedData);

      if (!hasChanges) {
        this.logger.log(
          `No changes detected for anime: ${existingAnime.title}`,
        );
        return {
          anime: existingAnime,
          isNew: false,
          hasChanges: false,
        };
      }

      this.logger.log(`Updating anime: ${existingAnime.title}`);

      const updateData = {
        title: scrapedData.title,
        alternative_title: scrapedData.alternative_title,
        synopsis: scrapedData.synopsis,
        poster_url: scrapedData.poster_url,
        banner_url: scrapedData.banner_url,
        type: scrapedData.type,
        status: scrapedData.status,
        total_episodes: scrapedData.total_episodes,
        release_year: scrapedData.release_year,
        season: scrapedData.season,
        rating: scrapedData.rating,
        source_url: scrapedData.source_url,
        last_updated_at: new Date(),
      };

      const updateResult = await this.animeRepository.update(
        existingAnime.id,
        updateData,
      );

      if (!updateResult.affected || updateResult.affected === 0) {
        throw new Error(`Failed to update anime with ID: ${existingAnime.id}`);
      }

      // Fetch the updated anime
      const updatedAnime = await this.animeRepository.findOne({
        where: { id: existingAnime.id },
        relations: ['genres', 'source'],
      });

      if (!updatedAnime) {
        throw new Error(`Failed to fetch updated anime with ID: ${existingAnime.id}`);
      }

      this.logger.log(`Successfully updated anime: ${updatedAnime.title}`);

      return {
        anime: updatedAnime,
        isNew: false,
        hasChanges: true,
      };
    } catch (error) {
      this.logger.error(`Error updating anime ${existingAnime.title}:`, error);
      throw error;
    }
  }

  private detectChanges(
    existingAnime: Anime,
    scrapedData: ScrapedAnimeData,
  ): boolean {
    const significantFields = [
      'title',
      'alternative_title',
      'synopsis',
      'poster_url',
      'banner_url',
      'type',
      'status',
      'total_episodes',
      'release_year',
      'season',
      'rating',
      'source_url',
    ];

    return significantFields.some(field => {
      const existingValue = existingAnime[field];
      const scrapedValue = scrapedData[field];

      // Handle null/undefined comparisons
      if (existingValue === null || existingValue === undefined) {
        return scrapedValue !== null && scrapedValue !== undefined;
      }

      if (scrapedValue === null || scrapedValue === undefined) {
        return false; // Don't overwrite existing data with null/undefined
      }

      return existingValue !== scrapedValue;
    });
  }

  async bulkProcessScrapedAnime(
    source: Source,
    scrapedDataList: ScrapedAnimeData[],
  ): Promise<BulkProcessResult> {
    const result: BulkProcessResult = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    this.logger.log(
      `Starting bulk processing of ${scrapedDataList.length} anime from source: ${source.name}`,
    );

    for (const scrapedData of scrapedDataList) {
      try {
        result.processed++;

        const processResult = await this.processScrapedAnime(
          source,
          scrapedData,
        );

        if (!processResult) {
          result.skipped++;
          continue;
        }

        if (processResult.isNew) {
          result.created++;
        } else if (processResult.hasChanges) {
          result.updated++;
        } else {
          result.skipped++;
        }

        // Add small delay to prevent overwhelming the database
        if (result.processed % 10 === 0) {
          await this.delay(100);
        }
      } catch (error) {
        result.errors.push({
          sourceAnimeId: scrapedData.source_anime_id,
          title: scrapedData.title,
          error: error.message,
        });
        this.logger.error(
          `Error processing anime ${scrapedData.title}:`,
          error.message,
        );
      }
    }

    this.logger.log(
      `Bulk processing complete. Processed: ${result.processed}, Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`,
    );

    return result;
  }

  async processAnimeWithRetry(
    source: Source,
    scrapedData: ScrapedAnimeData,
    maxRetries: number = 3,
  ): Promise<ProcessedAnimeResult | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.processScrapedAnime(source, scrapedData);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt}/${maxRetries} failed for anime ${scrapedData.title}: ${error.message}`,
        );

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.delay(delay);
        }
      }
    }

    this.logger.error(
      `All ${maxRetries} attempts failed for anime ${scrapedData.title}`,
      lastError,
    );

    return null;
  }

  async getAnimeNeedingUpdates(
    sourceId?: number,
    olderThanHours: number = 24,
    limit: number = 100,
  ): Promise<Anime[]> {
    try {
      this.logger.log(
        `Finding anime needing updates (older than ${olderThanHours} hours)`,
      );

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      // This would need to be implemented in the AnimeRepository
      // For now, we'll use a simpler approach
      const searchOptions = sourceId ? { sourceId } : {};
      const result = await this.animeRepository.paginate(
        { limit },
        searchOptions,
      );

      // Filter by update date (this should be moved to repository level for better performance)
      const needingUpdates = result.data.filter(
        anime => !anime.last_updated_at || anime.last_updated_at < cutoffDate,
      );

      this.logger.log(`Found ${needingUpdates.length} anime needing updates`);
      return needingUpdates;
    } catch (error) {
      this.logger.error('Error finding anime needing updates:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async updateAnimeMetadata(
    animeId: number,
    metadata: Partial<Anime>,
  ): Promise<Anime | null> {
    try {
      this.logger.log(`Updating metadata for anime ID: ${animeId}`);

      const updateResult = await this.animeRepository.update(animeId, {
        ...metadata,
        last_updated_at: new Date(),
      });

      if (!updateResult.affected || updateResult.affected === 0) {
        this.logger.warn(`No anime found with ID: ${animeId}`);
        return null;
      }

      // Fetch the updated anime
      const updatedAnime = await this.animeRepository.findOne({
        where: { id: animeId },
        relations: ['genres', 'source'],
      });

      if (updatedAnime) {
        this.logger.log(
          `Successfully updated metadata for anime: ${updatedAnime.title}`,
        );
      }

      return updatedAnime;
    } catch (error) {
      this.logger.error(
        `Error updating anime metadata for ID ${animeId}:`,
        error,
      );
      throw error;
    }
  }

  async incrementViewCount(animeId: number): Promise<void> {
    try {
      await this.animeRepository.updateViewCount(animeId);
    } catch (error) {
      this.logger.error(
        `Error incrementing view count for anime ${animeId}:`,
        error,
      );
      // Don't throw here as this is a non-critical operation
    }
  }

  async incrementDownloadCount(animeId: number): Promise<void> {
    try {
      await this.animeRepository.updateDownloadCount(animeId);
    } catch (error) {
      this.logger.error(
        `Error incrementing download count for anime ${animeId}:`,
        error,
      );
      // Don't throw here as this is a non-critical operation
    }
  }
}
