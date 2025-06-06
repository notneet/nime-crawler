import {
  Anime,
  AnimeStatus,
  AnimeType,
} from '@app/common/entities/core/anime.entity';
import { Injectable } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { RedisService } from '../redis.service';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AnimeSearchOptions {
  status?: AnimeStatus;
  type?: AnimeType;
  sourceId?: bigint;
  year?: number;
  query?: string;
}

@Injectable()
export class AnimeRepository extends Repository<Anime> {
  constructor(
    dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {
    super(Anime, dataSource.createEntityManager());
  }

  // ============= BASIC CRUD OPERATIONS =============

  async findAll(options?: FindManyOptions<Anime>): Promise<Anime[]> {
    const cacheKey = `anime:all:${JSON.stringify(options)}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find(options);
      },
      { ttl: 300, namespace: 'anime' }, // 5 minutes cache
    );
  }

  async findOne(options: FindOneOptions<Anime>): Promise<Anime | null> {
    return this.findOne(options);
  }

  async findById(id: bigint, relations?: string[]): Promise<Anime | null> {
    const cacheKey = `anime:id:${id}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { id },
          relations,
        });
      },
      { ttl: 600, namespace: 'anime' }, // 10 minutes cache
    );
  }

  async findBySlug(slug: string): Promise<Anime | null> {
    const cacheKey = `anime:slug:${slug}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { slug },
          relations: ['source', 'genres', 'episodes'],
        });
      },
      { ttl: 300, namespace: 'anime' },
    );
  }

  create(): Anime;
  create(entityLikeArray: DeepPartial<Anime>[]): Anime[];
  create(entityLike: DeepPartial<Anime>): Anime;
  create(
    entityLike?: DeepPartial<Anime> | DeepPartial<Anime>[],
  ): Anime | Anime[] {
    return this.create(entityLike as any);
  }

  async save<T extends DeepPartial<Anime>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Anime> {
    const savedAnime = await this.save(entity, options);
    await this.invalidateListCaches();
    return savedAnime;
  }

  async updateAnime(
    criteria: bigint | FindOptionsWhere<Anime>,
    partialEntity: Partial<Anime>,
  ): Promise<UpdateResult> {
    const result = await super.update(
      typeof criteria === 'bigint' ? { id: criteria } : criteria,
      partialEntity
    );

    // Invalidate caches
    if (typeof criteria === 'bigint') {
      await this.invalidateAnimeCache(criteria);
    }

    return result;
  }

  async deleteAnime(
    criteria: bigint | FindOptionsWhere<Anime>,
  ): Promise<DeleteResult> {
    const result = await super.delete(
      typeof criteria === 'bigint' ? { id: criteria } : criteria
    );

    if (typeof criteria === 'bigint') {
      await this.invalidateAnimeCache(criteria);
    }
    await this.invalidateListCaches();

    return result;
  }

  async softDeleteAnime(
    criteria: bigint | FindOptionsWhere<Anime>,
  ): Promise<UpdateResult> {
    const result = await super.softDelete(
      typeof criteria === 'bigint' ? { id: criteria } : criteria
    );

    if (typeof criteria === 'bigint') {
      await this.invalidateAnimeCache(criteria);
    }
    await this.invalidateListCaches();

    return result;
  }

  // ============= ADVANCED QUERIES =============

  async findBySource(
    sourceId: bigint,
    sourceAnimeId: string,
  ): Promise<Anime | null> {
    const cacheKey = `anime:source:${sourceId}:${sourceAnimeId}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { source_id: sourceId, source_anime_id: sourceAnimeId },
        });
      },
      { ttl: 600, namespace: 'anime' },
    );
  }

  async findByStatus(
    status: AnimeStatus,
    limit: number = 20,
  ): Promise<Anime[]> {
    const cacheKey = `anime:status:${status}:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          where: { status },
          order: { updated_at: 'DESC' },
          take: limit,
          relations: ['source'],
        });
      },
      { ttl: 180, namespace: 'anime' },
    );
  }

  async findByType(type: AnimeType, limit: number = 20): Promise<Anime[]> {
    const cacheKey = `anime:type:${type}:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          where: { type },
          order: { rating: 'DESC' },
          take: limit,
        });
      },
      { ttl: 1800, namespace: 'anime' },
    );
  }

  async findPopular(limit: number = 20): Promise<Anime[]> {
    const cacheKey = `anime:popular:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          order: { view_count: 'DESC' },
          take: limit,
          relations: ['source'],
        });
      },
      { ttl: 600, namespace: 'anime' },
    );
  }

  async findRecentlyUpdated(limit: number = 20): Promise<Anime[]> {
    const cacheKey = `anime:recent:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          order: { last_updated_at: 'DESC' },
          take: limit,
          relations: ['source'],
        });
      },
      { ttl: 60, namespace: 'anime' }, // 1 minute cache (frequent updates)
    );
  }

  async searchByTitle(query: string, limit: number = 20): Promise<Anime[]> {
    const cacheKey = `anime:search:${query}:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.createQueryBuilder('anime')
          .where(
            'anime.title LIKE :query OR anime.alternative_title LIKE :query',
            {
              query: `%${query}%`,
            },
          )
          .orderBy('anime.rating', 'DESC')
          .take(limit)
          .getMany();
      },
      { ttl: 300, namespace: 'anime' },
    );
  }

  // ============= PAGINATION =============

  async paginate(
    options: PaginationOptions = {},
    searchOptions: AnimeSearchOptions = {},
    findOptions: FindManyOptions<Anime> = {},
  ): Promise<PaginationResult<Anime>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    let queryBuilder = this.createQueryBuilder('anime');

    // Apply search filters
    if (searchOptions.status) {
      queryBuilder = queryBuilder.andWhere('anime.status = :status', {
        status: searchOptions.status,
      });
    }

    if (searchOptions.type) {
      queryBuilder = queryBuilder.andWhere('anime.type = :type', {
        type: searchOptions.type,
      });
    }

    if (searchOptions.sourceId) {
      queryBuilder = queryBuilder.andWhere('anime.source_id = :sourceId', {
        sourceId: searchOptions.sourceId,
      });
    }

    if (searchOptions.year) {
      queryBuilder = queryBuilder.andWhere('anime.release_year = :year', {
        year: searchOptions.year,
      });
    }

    if (searchOptions.query) {
      queryBuilder = queryBuilder.andWhere(
        '(anime.title LIKE :query OR anime.alternative_title LIKE :query)',
        { query: `%${searchOptions.query}%` },
      );
    }

    // Apply relations if specified
    if (findOptions.relations) {
      if (Array.isArray(findOptions.relations)) {
        findOptions.relations.forEach(relation => {
          queryBuilder = queryBuilder.leftJoinAndSelect(
            `anime.${relation}`,
            relation,
          );
        });
      } else {
        Object.keys(findOptions.relations).forEach(relation => {
          queryBuilder = queryBuilder.leftJoinAndSelect(
            `anime.${relation}`,
            relation,
          );
        });
      }
    }

    // Get total count and data
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('anime.created_at', 'DESC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  // ============= STATISTICS =============

  async getStats(): Promise<{
    total: number;
    byStatus: Record<AnimeStatus, number>;
    byType: Record<AnimeType, number>;
    totalViews: number;
    totalDownloads: number;
  }> {
    const cacheKey = 'anime:stats';

    return this.redisService.wrap(
      cacheKey,
      async () => {
        const [
          total,
          ongoingCount,
          completedCount,
          upcomingCount,
          hiatusCount,
          airingCount,
          cancelledCount,
          tvCount,
          movieCount,
          ovaCount,
          onaCount,
          specialCount,
          musicCount,
          totalViews,
          totalDownloads,
        ] = await Promise.all([
          this.count(),
          this.count({
            where: { status: AnimeStatus.ONGOING },
          }),
          this.count({
            where: { status: AnimeStatus.COMPLETED },
          }),
          this.count({
            where: { status: AnimeStatus.UPCOMING },
          }),
          this.count({ where: { status: AnimeStatus.HIATUS } }),
          this.count({ where: { status: AnimeStatus.AIRING } }),
          this.count({ where: { status: AnimeStatus.CANCELLED } }),
          this.count({ where: { type: AnimeType.TV } }),
          this.count({ where: { type: AnimeType.MOVIE } }),
          this.count({ where: { type: AnimeType.OVA } }),
          this.count({ where: { type: AnimeType.ONA } }),
          this.count({ where: { type: AnimeType.SPECIAL } }),
          this.count({ where: { type: AnimeType.MUSIC } }),
          this.createQueryBuilder('anime')
            .select('SUM(anime.view_count)', 'total')
            .getRawOne()
            .then(result => parseInt(result.total) || 0),
          this.createQueryBuilder('anime')
            .select('SUM(anime.download_count)', 'total')
            .getRawOne()
            .then(result => parseInt(result.total) || 0),
        ]);

        return {
          total,
          byStatus: {
            [AnimeStatus.ONGOING]: ongoingCount,
            [AnimeStatus.COMPLETED]: completedCount,
            [AnimeStatus.UPCOMING]: upcomingCount,
            [AnimeStatus.HIATUS]: hiatusCount,
            [AnimeStatus.AIRING]: airingCount,
            [AnimeStatus.CANCELLED]: cancelledCount,
          },
          byType: {
            [AnimeType.TV]: tvCount,
            [AnimeType.MOVIE]: movieCount,
            [AnimeType.OVA]: ovaCount,
            [AnimeType.ONA]: onaCount,
            [AnimeType.SPECIAL]: specialCount,
            [AnimeType.MUSIC]: musicCount,
          },
          totalViews,
          totalDownloads,
        };
      },
      { ttl: 3600, namespace: 'anime' }, // 1 hour cache for stats
    );
  }

  // ============= UTILITY METHODS =============

  async updateViewCount(id: bigint): Promise<void> {
    await this.increment({ id }, 'view_count', 1);

    // Update cache counter
    await this.redisService.increment(`views:${id}`, 1, { namespace: 'stats' });

    // Invalidate related cache
    await this.invalidateAnimeCache(id);
  }

  async updateDownloadCount(id: bigint): Promise<void> {
    await this.increment({ id }, 'download_count', 1);

    // Update cache counter
    await this.redisService.increment(`downloads:${id}`, 1, {
      namespace: 'stats',
    });

    // Invalidate related cache
    await this.invalidateAnimeCache(id);
  }

  // ============= CACHE MANAGEMENT =============

  private async invalidateAnimeCache(animeId: bigint): Promise<void> {
    try {
      // Get anime to get slug
      const anime = await this.findOne({
        where: { id: animeId },
      });
      if (anime) {
        // Delete specific cache entries
        await this.redisService.del(`anime:id:${animeId}`, {
          namespace: 'anime',
        });
        await this.redisService.del(`anime:slug:${anime.slug}`, {
          namespace: 'anime',
        });
        await this.redisService.del(
          `anime:source:${anime.source_id}:${anime.source_anime_id}`,
          { namespace: 'anime' },
        );
      }

      // Invalidate list caches
      await this.invalidateListCaches();
    } catch (error) {
      console.error('Error invalidating anime cache:', error);
    }
  }

  private async invalidateListCaches(): Promise<void> {
    try {
      // Delete pattern-based cache entries
      await this.redisService.delPattern('anime:all:*', { namespace: 'anime' });
      await this.redisService.delPattern('anime:popular:*', {
        namespace: 'anime',
      });
      await this.redisService.delPattern('anime:recent:*', {
        namespace: 'anime',
      });
      await this.redisService.delPattern('anime:status:*', {
        namespace: 'anime',
      });
      await this.redisService.delPattern('anime:type:*', {
        namespace: 'anime',
      });
      await this.redisService.delPattern('anime:search:*', {
        namespace: 'anime',
      });
      await this.redisService.delPattern('anime:stats', { namespace: 'anime' });
    } catch (error) {
      console.error('Error invalidating list caches:', error);
    }
  }
}
