import {
  AnimeSeason,
  AnimeStatus,
  AnimeType,
} from '@app/common/entities/core/anime.entity';
import {
  AnimeRepository,
  AnimeSearchOptions,
  PaginationOptions,
} from '@app/database/repositories/anime.repository';
import { Injectable, Logger } from '@nestjs/common';

export interface CreateAnimeDto {
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
  source_id: number;
  source_anime_id: string;
  source_url: string;
}

export interface UpdateAnimeDto {
  title?: string;
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
  last_updated_at?: Date;
}

export interface CrawlResult {
  sourceAnimeId: string;
  data: CreateAnimeDto;
}

export interface BulkProcessResult {
  created: number;
  updated: number;
  errors: Array<{ sourceAnimeId: string; error: string }>;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(private readonly animeRepository: AnimeRepository) {}

  async basic() {
    return this.animeRepository.findAll();
  }

  // // ============= BASIC CRUD OPERATIONS =============

  // /**
  //  * Get all anime with optional filtering and pagination
  //  */
  async getAllAnime(
    pagination: PaginationOptions = {},
    searchOptions: AnimeSearchOptions = {},
  ) {
    try {
      this.logger.log('Fetching all anime with pagination and filters');

      const result = await this.animeRepository.paginate(
        pagination,
        searchOptions,
        { relations: ['source', 'genres'] },
      );

      this.logger.log(
        `Found ${result.total} anime, returning page ${result.page}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Error fetching anime:', error);
      throw error;
    }
  }

  // /**
  //  * Get anime by ID with full details
  //  */
  // async getAnimeById(id: number): Promise<Anime | null> {
  //   try {
  //     this.logger.log(`Fetching anime with ID: ${id}`);

  //     const anime = await this.animeRepository.findById(id, [
  //       'source',
  //       'genres',
  //       'episodes',
  //       'episodes.download_links',
  //     ]);

  //     if (anime) {
  //       // Increment view count asynchronously
  //       this.animeRepository.updateViewCount(id).catch((error) => {
  //         this.logger.error(
  //           `Failed to update view count for anime ${id}:`,
  //           error,
  //         );
  //       });

  //       this.logger.log(`Found anime: ${anime.title}`);
  //     } else {
  //       this.logger.warn(`Anime with ID ${id} not found`);
  //     }

  //     return anime;
  //   } catch (error) {
  //     this.logger.error(`Error fetching anime by ID ${id}:`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Get anime by slug with full details
  //  */
  // async getAnimeBySlug(slug: string): Promise<Anime | null> {
  //   try {
  //     this.logger.log(`Fetching anime with slug: ${slug}`);

  //     const anime = await this.animeRepository.findBySlug(slug);

  //     if (anime) {
  //       // Increment view count asynchronously
  //       this.animeRepository.updateViewCount(anime.id).catch((error) => {
  //         this.logger.error(
  //           `Failed to update view count for anime ${anime.id}:`,
  //           error,
  //         );
  //       });

  //       this.logger.log(`Found anime: ${anime.title}`);
  //     } else {
  //       this.logger.warn(`Anime with slug ${slug} not found`);
  //     }

  //     return anime;
  //   } catch (error) {
  //     this.logger.error(`Error fetching anime by slug ${slug}:`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Create new anime with validation
  //  */
  // async createAnime(animeData: CreateAnimeDto): Promise<Anime> {
  //   try {
  //     this.logger.log(`Creating new anime: ${animeData.title}`);

  //     // Validate the data
  //     this.validateAnimeData(animeData);

  //     // Check if anime already exists for this source
  //     const existingAnime = await this.animeRepository.findBySource(
  //       animeData.source_id,
  //       animeData.source_anime_id,
  //     );

  //     if (existingAnime) {
  //       this.logger.warn(
  //         `Anime already exists for source ${animeData.source_id}, ID: ${animeData.source_anime_id}`,
  //       );
  //       throw new Error('Anime already exists for this source');
  //     }

  //     // Generate slug if not provided
  //     if (!animeData.slug) {
  //       animeData.slug = this.generateSlug(animeData.title);
  //     }

  //     const anime = await this.animeRepository.create({
  //       ...animeData,
  //       last_updated_at: new Date(),
  //     });

  //     this.logger.log(
  //       `Successfully created anime: ${anime.title} (ID: ${anime.id})`,
  //     );
  //     return anime;
  //   } catch (error) {
  //     this.logger.error(`Error creating anime: ${animeData.title}`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Update existing anime with validation
  //  */
  // async updateAnime(
  //   id: number,
  //   animeData: UpdateAnimeDto,
  // ): Promise<Anime | null> {
  //   try {
  //     this.logger.log(`Updating anime with ID: ${id}`);

  //     // Validate the data
  //     this.validateAnimeData(animeData);

  //     const existingAnime = await this.animeRepository.findById(id);
  //     if (!existingAnime) {
  //       this.logger.warn(`Anime with ID ${id} not found for update`);
  //       return null;
  //     }

  //     const updatedAnime = await this.animeRepository.update(id, {
  //       ...animeData,
  //       last_updated_at: new Date(),
  //     });

  //     if (updatedAnime) {
  //       this.logger.log(`Successfully updated anime: ${updatedAnime.title}`);
  //     }

  //     return updatedAnime;
  //   } catch (error) {
  //     this.logger.error(`Error updating anime with ID ${id}:`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Delete anime by ID
  //  */
  // async deleteAnime(id: number): Promise<boolean> {
  //   try {
  //     this.logger.log(`Deleting anime with ID: ${id}`);

  //     const existingAnime = await this.animeRepository.findById(id);
  //     if (!existingAnime) {
  //       this.logger.warn(`Anime with ID ${id} not found for deletion`);
  //       return false;
  //     }

  //     await this.animeRepository.delete(id);
  //     this.logger.log(`Successfully deleted anime: ${existingAnime.title}`);
  //     return true;
  //   } catch (error) {
  //     this.logger.error(`Error deleting anime with ID ${id}:`, error);
  //     throw error;
  //   }
  // }

  // // ============= SPECIALIZED QUERIES =============

  // /**
  //  * Get popular anime based on view count
  //  */
  // async getPopularAnime(limit: number = 20): Promise<Anime[]> {
  //   try {
  //     this.logger.log(`Fetching ${limit} popular anime`);

  //     const anime = await this.animeRepository.findPopular(limit);
  //     this.logger.log(`Found ${anime.length} popular anime`);

  //     return anime;
  //   } catch (error) {
  //     this.logger.error('Error fetching popular anime:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Get recently updated anime
  //  */
  // async getRecentlyUpdatedAnime(limit: number = 20): Promise<Anime[]> {
  //   try {
  //     this.logger.log(`Fetching ${limit} recently updated anime`);

  //     const anime = await this.animeRepository.findRecentlyUpdated(limit);
  //     this.logger.log(`Found ${anime.length} recently updated anime`);

  //     return anime;
  //   } catch (error) {
  //     this.logger.error('Error fetching recently updated anime:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Get anime by status (Ongoing, Completed, etc.)
  //  */
  // async getAnimeByStatus(
  //   status: AnimeStatus,
  //   limit: number = 20,
  // ): Promise<Anime[]> {
  //   try {
  //     this.logger.log(`Fetching ${limit} anime with status: ${status}`);

  //     const anime = await this.animeRepository.findByStatus(status, limit);
  //     this.logger.log(`Found ${anime.length} anime with status: ${status}`);

  //     return anime;
  //   } catch (error) {
  //     this.logger.error(`Error fetching anime by status ${status}:`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Get anime by type (TV, Movie, OVA, etc.)
  //  */
  // async getAnimeByType(type: AnimeType, limit: number = 20): Promise<Anime[]> {
  //   try {
  //     this.logger.log(`Fetching ${limit} anime with type: ${type}`);

  //     const anime = await this.animeRepository.findByType(type, limit);
  //     this.logger.log(`Found ${anime.length} anime with type: ${type}`);

  //     return anime;
  //   } catch (error) {
  //     this.logger.error(`Error fetching anime by type ${type}:`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Search anime by title or alternative title
  //  */
  // async searchAnime(query: string, limit: number = 20): Promise<Anime[]> {
  //   try {
  //     this.logger.log(`Searching anime with query: "${query}"`);

  //     if (!query || query.trim().length < 2) {
  //       throw new Error('Search query must be at least 2 characters long');
  //     }

  //     const anime = await this.animeRepository.searchByTitle(
  //       query.trim(),
  //       limit,
  //     );
  //     this.logger.log(`Found ${anime.length} anime matching query: "${query}"`);

  //     return anime;
  //   } catch (error) {
  //     this.logger.error(`Error searching anime with query "${query}":`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Get comprehensive anime statistics
  //  */
  // async getAnimeStatistics() {
  //   try {
  //     this.logger.log('Fetching anime statistics');

  //     const stats = await this.animeRepository.getStats();
  //     this.logger.log(`Statistics: ${stats.total} total anime`);

  //     return stats;
  //   } catch (error) {
  //     this.logger.error('Error fetching anime statistics:', error);
  //     throw error;
  //   }
  // }

  // // ============= CRAWLER-SPECIFIC METHODS =============

  // /**
  //  * Find existing anime or create new one from crawled data
  //  */
  // async findOrCreateAnime(
  //   sourceId: number,
  //   sourceAnimeId: string,
  //   animeData: CreateAnimeDto,
  // ): Promise<{ anime: Anime; isNew: boolean }> {
  //   try {
  //     this.logger.log(
  //       `Finding or creating anime from source ${sourceId}, ID: ${sourceAnimeId}`,
  //     );

  //     // Try to find existing anime
  //     let anime = await this.animeRepository.findBySource(
  //       sourceId,
  //       sourceAnimeId,
  //     );
  //     let isNew = false;

  //     if (!anime) {
  //       // Validate and create new anime
  //       this.validateAnimeData(animeData);

  //       // Generate slug if not provided
  //       if (!animeData.slug) {
  //         animeData.slug = this.generateSlug(animeData.title);
  //       }

  //       anime = await this.animeRepository.create({
  //         ...animeData,
  //         last_updated_at: new Date(),
  //       });
  //       isNew = true;
  //       this.logger.log(`Created new anime: ${anime.title} (ID: ${anime.id})`);
  //     } else {
  //       this.logger.log(
  //         `Found existing anime: ${anime.title} (ID: ${anime.id})`,
  //       );
  //     }

  //     return { anime, isNew };
  //   } catch (error) {
  //     this.logger.error(
  //       `Error finding or creating anime from source ${sourceId}, ID: ${sourceAnimeId}:`,
  //       error,
  //     );
  //     throw error;
  //   }
  // }

  // /**
  //  * Update anime from crawled data
  //  */
  // async updateAnimeFromCrawl(
  //   sourceId: number,
  //   sourceAnimeId: string,
  //   updateData: UpdateAnimeDto,
  // ): Promise<Anime | null> {
  //   try {
  //     this.logger.log(
  //       `Updating anime from crawl - source ${sourceId}, ID: ${sourceAnimeId}`,
  //     );

  //     const anime = await this.animeRepository.findBySource(
  //       sourceId,
  //       sourceAnimeId,
  //     );
  //     if (!anime) {
  //       this.logger.warn(
  //         `Anime not found for source ${sourceId}, ID: ${sourceAnimeId}`,
  //       );
  //       return null;
  //     }

  //     // Validate the update data
  //     this.validateAnimeData(updateData);

  //     const updatedAnime = await this.animeRepository.update(anime.id, {
  //       ...updateData,
  //       last_updated_at: new Date(),
  //     });

  //     if (updatedAnime) {
  //       this.logger.log(`Updated anime from crawl: ${updatedAnime.title}`);
  //     }

  //     return updatedAnime;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error updating anime from crawl - source ${sourceId}, ID: ${sourceAnimeId}:`,
  //       error,
  //     );
  //     throw error;
  //   }
  // }

  // /**
  //  * Bulk process crawl results with detailed tracking
  //  */
  // async bulkProcessCrawlResults(
  //   sourceId: number,
  //   crawlResults: CrawlResult[],
  // ): Promise<BulkProcessResult> {
  //   const results: BulkProcessResult = {
  //     created: 0,
  //     updated: 0,
  //     errors: [],
  //   };

  //   this.logger.log(
  //     `Processing ${crawlResults.length} crawl results for source ${sourceId}`,
  //   );

  //   for (const result of crawlResults) {
  //     try {
  //       // Validate each result
  //       if (!result.sourceAnimeId || !result.data) {
  //         throw new Error('Invalid crawl result structure');
  //       }

  //       const { anime, isNew } = await this.findOrCreateAnime(
  //         sourceId,
  //         result.sourceAnimeId,
  //         result.data,
  //       );

  //       if (isNew) {
  //         results.created++;
  //       } else {
  //         // Update existing anime with new data
  //         const updateData: UpdateAnimeDto = {
  //           title: result.data.title,
  //           alternative_title: result.data.alternative_title,
  //           synopsis: result.data.synopsis,
  //           poster_url: result.data.poster_url,
  //           banner_url: result.data.banner_url,
  //           type: result.data.type,
  //           status: result.data.status,
  //           total_episodes: result.data.total_episodes,
  //           release_year: result.data.release_year,
  //           season: result.data.season,
  //           rating: result.data.rating,
  //         };

  //         await this.updateAnimeFromCrawl(
  //           sourceId,
  //           result.sourceAnimeId,
  //           updateData,
  //         );
  //         results.updated++;
  //       }
  //     } catch (error) {
  //       this.logger.error(
  //         `Error processing crawl result for ${result.sourceAnimeId}:`,
  //         error,
  //       );
  //       results.errors.push({
  //         sourceAnimeId: result.sourceAnimeId,
  //         error: error.message,
  //       });
  //     }
  //   }

  //   this.logger.log(
  //     `Bulk processing complete: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
  //   );

  //   return results;
  // }

  // /**
  //  * Get anime that need updates based on last_updated_at timestamp
  //  */
  // async getAnimeNeedingUpdates(
  //   sourceId?: number,
  //   olderThanHours: number = 24,
  //   limit: number = 100,
  // ): Promise<Anime[]> {
  //   try {
  //     this.logger.log(
  //       `Fetching anime needing updates (older than ${olderThanHours} hours)`,
  //     );

  //     const cutoffDate = new Date();
  //     cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

  //     // Access the repository's underlying TypeORM repository
  //     let queryBuilder =
  //       this.animeRepository['animeRepository'].createQueryBuilder('anime');

  //     queryBuilder = queryBuilder
  //       .where(
  //         'anime.last_updated_at < :cutoffDate OR anime.last_updated_at IS NULL',
  //         {
  //           cutoffDate,
  //         },
  //       )
  //       .orderBy('anime.last_updated_at', 'ASC', 'NULLS FIRST')
  //       .take(limit);

  //     if (sourceId) {
  //       queryBuilder = queryBuilder.andWhere('anime.source_id = :sourceId', {
  //         sourceId,
  //       });
  //     }

  //     const anime = await queryBuilder.getMany();
  //     this.logger.log(`Found ${anime.length} anime needing updates`);

  //     return anime;
  //   } catch (error) {
  //     this.logger.error('Error fetching anime needing updates:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Get anime by source and source anime ID
  //  */
  // async getAnimeBySource(
  //   sourceId: number,
  //   sourceAnimeId: string,
  // ): Promise<Anime | null> {
  //   try {
  //     this.logger.log(
  //       `Fetching anime from source ${sourceId}, ID: ${sourceAnimeId}`,
  //     );

  //     const anime = await this.animeRepository.findBySource(
  //       sourceId,
  //       sourceAnimeId,
  //     );

  //     if (anime) {
  //       this.logger.log(`Found anime: ${anime.title}`);
  //     } else {
  //       this.logger.log(
  //         `No anime found for source ${sourceId}, ID: ${sourceAnimeId}`,
  //       );
  //     }

  //     return anime;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error fetching anime by source ${sourceId}, ID: ${sourceAnimeId}:`,
  //       error,
  //     );
  //     throw error;
  //   }
  // }

  // // ============= UTILITY METHODS =============

  // /**
  //  * Generate SEO-friendly slug from title
  //  */
  // generateSlug(title: string): string {
  //   if (!title || typeof title !== 'string') {
  //     throw new Error('Title must be a non-empty string');
  //   }

  //   return title
  //     .toLowerCase()
  //     .trim()
  //     .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
  //     .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
  //     .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  // }

  // /**
  //  * Validate anime data before creation/update
  //  */
  // validateAnimeData(data: CreateAnimeDto | UpdateAnimeDto): boolean {
  //   // Validate required fields for creation
  //   if ('title' in data) {
  //     if (
  //       !data.title ||
  //       typeof data.title !== 'string' ||
  //       data.title.trim().length === 0
  //     ) {
  //       throw new Error('Title is required and cannot be empty');
  //     }
  //     if (data.title.length > 255) {
  //       throw new Error('Title cannot exceed 255 characters');
  //     }
  //   }

  //   if ('slug' in data && data.slug !== undefined) {
  //     if (
  //       !data.slug ||
  //       typeof data.slug !== 'string' ||
  //       data.slug.trim().length === 0
  //     ) {
  //       throw new Error('Slug cannot be empty if provided');
  //     }
  //     if (data.slug.length > 255) {
  //       throw new Error('Slug cannot exceed 255 characters');
  //     }
  //   }

  //   if ('source_id' in data) {
  //     if (
  //       !data.source_id ||
  //       !Number.isInteger(data.source_id) ||
  //       data.source_id <= 0
  //     ) {
  //       throw new Error('Valid source_id is required');
  //     }
  //   }

  //   if ('source_anime_id' in data) {
  //     if (
  //       !data.source_anime_id ||
  //       typeof data.source_anime_id !== 'string' ||
  //       data.source_anime_id.trim().length === 0
  //     ) {
  //       throw new Error('source_anime_id is required and cannot be empty');
  //     }
  //     if (data.source_anime_id.length > 100) {
  //       throw new Error('source_anime_id cannot exceed 100 characters');
  //     }
  //   }

  //   if ('source_url' in data) {
  //     if (
  //       !data.source_url ||
  //       typeof data.source_url !== 'string' ||
  //       data.source_url.trim().length === 0
  //     ) {
  //       throw new Error('source_url is required and cannot be empty');
  //     }
  //     // Basic URL validation
  //     try {
  //       new URL(data.source_url);
  //     } catch {
  //       throw new Error('source_url must be a valid URL');
  //     }
  //   }

  //   // Validate optional fields
  //   if (
  //     data.alternative_title !== undefined &&
  //     data.alternative_title !== null
  //   ) {
  //     if (
  //       typeof data.alternative_title !== 'string' ||
  //       data.alternative_title.length > 255
  //     ) {
  //       throw new Error(
  //         'alternative_title must be a string with max 255 characters',
  //       );
  //     }
  //   }

  //   if (
  //     data.type !== undefined &&
  //     !Object.values(AnimeType).includes(data.type)
  //   ) {
  //     throw new Error(
  //       `Invalid anime type. Must be one of: ${Object.values(AnimeType).join(', ')}`,
  //     );
  //   }

  //   if (
  //     data.status !== undefined &&
  //     !Object.values(AnimeStatus).includes(data.status)
  //   ) {
  //     throw new Error(
  //       `Invalid anime status. Must be one of: ${Object.values(AnimeStatus).join(', ')}`,
  //     );
  //   }

  //   if (
  //     data.season !== undefined &&
  //     data.season !== null &&
  //     !Object.values(AnimeSeason).includes(data.season)
  //   ) {
  //     throw new Error(
  //       `Invalid anime season. Must be one of: ${Object.values(AnimeSeason).join(', ')}`,
  //     );
  //   }

  //   if (data.total_episodes !== undefined && data.total_episodes !== null) {
  //     if (!Number.isInteger(data.total_episodes) || data.total_episodes < 0) {
  //       throw new Error('total_episodes must be a positive integer');
  //     }
  //   }

  //   if (data.release_year !== undefined && data.release_year !== null) {
  //     const currentYear = new Date().getFullYear();
  //     if (
  //       !Number.isInteger(data.release_year) ||
  //       data.release_year < 1900 ||
  //       data.release_year > currentYear + 5
  //     ) {
  //       throw new Error(
  //         `release_year must be between 1900 and ${currentYear + 5}`,
  //       );
  //     }
  //   }

  //   if (data.rating !== undefined && data.rating !== null) {
  //     if (
  //       typeof data.rating !== 'number' ||
  //       data.rating < 0 ||
  //       data.rating > 10
  //     ) {
  //       throw new Error('rating must be a number between 0 and 10');
  //     }
  //   }

  //   return true;
  // }

  // /**
  //  * Check if anime data has meaningful changes
  //  */
  // hasSignificantChanges(current: Anime, update: UpdateAnimeDto): boolean {
  //   const significantFields = [
  //     'title',
  //     'alternative_title',
  //     'synopsis',
  //     'poster_url',
  //     'banner_url',
  //     'type',
  //     'status',
  //     'total_episodes',
  //     'release_year',
  //     'season',
  //     'rating',
  //   ];

  //   return significantFields.some((field) => {
  //     if (field in update) {
  //       return current[field] !== update[field];
  //     }
  //     return false;
  //   });
  // }

  /**
   * Legacy method for backward compatibility
   */
  getHello(): string {
    return 'Hello World from Crawler Service!';
  }
}
