import { Source } from '@app/common/entities/core/source.entity';
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

export interface SourceSearchOptions {
  isActive?: boolean;
  priority?: number;
  query?: string;
}

@Injectable()
export class SourceRepository extends Repository<Source> {
  constructor(
    dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {
    super(Source, dataSource.createEntityManager());
  }

  // ============= BASIC CRUD OPERATIONS =============

  async findAll(options?: FindManyOptions<Source>): Promise<Source[]> {
    const cacheKey = `source:all:${JSON.stringify(options)}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find(options);
      },
      { ttl: 600, namespace: 'source' }, // 10 minutes cache
    );
  }

  async findOne(options: FindOneOptions<Source>): Promise<Source | null> {
    return super.findOne(options);
  }

  async findById(id: bigint, relations?: string[]): Promise<Source | null> {
    const cacheKey = `source:id:${id}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { id },
          relations,
        });
      },
      { ttl: 1800, namespace: 'source' }, // 30 minutes cache
    );
  }

  async findBySlug(slug: string): Promise<Source | null> {
    const cacheKey = `source:slug:${slug}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { slug },
          relations: ['animes', 'crawl_jobs'],
        });
      },
      { ttl: 1800, namespace: 'source' },
    );
  }

  create(): Source;
  create(entityLikeArray: DeepPartial<Source>[]): Source[];
  create(entityLike: DeepPartial<Source>): Source;
  create(
    entityLike?: DeepPartial<Source> | DeepPartial<Source>[],
  ): Source | Source[] {
    return super.create(entityLike as any);
  }

  async save<T extends DeepPartial<Source>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Source> {
    const savedSource = await super.save(entity, options);
    await this.invalidateListCaches();
    return savedSource;
  }

  async update(
    criteria: number | FindOptionsWhere<Source>,
    partialEntity: Partial<Source>,
  ): Promise<UpdateResult> {
    const result = await super.update(criteria, partialEntity);

    // Invalidate caches
    if (typeof criteria === 'bigint') {
      await this.invalidateSourceCache(criteria);
    }

    return result;
  }

  async delete(
    criteria: number | FindOptionsWhere<Source>,
  ): Promise<DeleteResult> {
    const result = await super.delete(criteria);

    if (typeof criteria === 'bigint') {
      await this.invalidateSourceCache(criteria);
    }
    await this.invalidateListCaches();

    return result;
  }

  async softDelete(
    criteria: number | FindOptionsWhere<Source>,
  ): Promise<UpdateResult> {
    const result = await super.softDelete(criteria);

    if (typeof criteria === 'bigint') {
      await this.invalidateSourceCache(criteria);
    }
    await this.invalidateListCaches();

    return result;
  }

  // ============= ADVANCED QUERIES =============

  async findActiveSources(): Promise<Source[]> {
    const cacheKey = 'source:active';

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          where: { is_active: true },
          order: { priority: 'ASC', name: 'ASC' },
        });
      },
      { ttl: 3600, namespace: 'source' }, // 1 hour cache
    );
  }

  async findByPriority(priority: number): Promise<Source[]> {
    const cacheKey = `source:priority:${priority}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          where: { priority, is_active: true },
          order: { name: 'ASC' },
        });
      },
      { ttl: 1800, namespace: 'source' },
    );
  }

  async findRecentlyCrawled(limit: number = 10): Promise<Source[]> {
    const cacheKey = `source:recent:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          where: { is_active: true },
          order: { last_crawled_at: 'DESC' },
          take: limit,
        });
      },
      { ttl: 300, namespace: 'source' }, // 5 minutes cache
    );
  }

  async searchByName(query: string, limit: number = 20): Promise<Source[]> {
    const cacheKey = `source:search:${query}:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.createQueryBuilder('source')
          .where('source.name LIKE :query OR source.slug LIKE :query', {
            query: `%${query}%`,
          })
          .orderBy('source.priority', 'ASC')
          .addOrderBy('source.name', 'ASC')
          .take(limit)
          .getMany();
      },
      { ttl: 600, namespace: 'source' },
    );
  }

  // ============= PAGINATION =============

  async paginate(
    options: PaginationOptions = {},
    searchOptions: SourceSearchOptions = {},
    findOptions: FindManyOptions<Source> = {},
  ): Promise<PaginationResult<Source>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    let queryBuilder = this.createQueryBuilder('source');

    // Apply search filters
    if (searchOptions.isActive !== undefined) {
      queryBuilder = queryBuilder.andWhere('source.is_active = :isActive', {
        isActive: searchOptions.isActive,
      });
    }

    if (searchOptions.priority) {
      queryBuilder = queryBuilder.andWhere('source.priority = :priority', {
        priority: searchOptions.priority,
      });
    }

    if (searchOptions.query) {
      queryBuilder = queryBuilder.andWhere(
        '(source.name LIKE :query OR source.slug LIKE :query)',
        { query: `%${searchOptions.query}%` },
      );
    }

    // Apply relations if specified
    if (findOptions.relations) {
      if (Array.isArray(findOptions.relations)) {
        findOptions.relations.forEach(relation => {
          queryBuilder = queryBuilder.leftJoinAndSelect(
            `source.${relation}`,
            relation,
          );
        });
      } else {
        Object.keys(findOptions.relations).forEach(relation => {
          queryBuilder = queryBuilder.leftJoinAndSelect(
            `source.${relation}`,
            relation,
          );
        });
      }
    }

    // Get total count and data
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('source.priority', 'ASC')
      .addOrderBy('source.name', 'ASC')
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
    active: number;
    inactive: number;
    byPriority: Record<number, number>;
    totalAnimes: number;
    totalCrawlJobs: number;
  }> {
    const cacheKey = 'source:stats';

    return this.redisService.wrap(
      cacheKey,
      async () => {
        const [
          total,
          active,
          inactive,
          priorities,
          totalAnimes,
          totalCrawlJobs,
        ] = await Promise.all([
          this.count(),
          this.count({ where: { is_active: true } }),
          this.count({ where: { is_active: false } }),
          this.createQueryBuilder('source')
            .select('source.priority', 'priority')
            .addSelect('COUNT(*)', 'count')
            .groupBy('source.priority')
            .getRawMany(),
          this.createQueryBuilder('source')
            .leftJoin('source.animes', 'anime')
            .select('COUNT(anime.id)', 'total')
            .getRawOne()
            .then(result => parseInt(result.total) || 0),
          this.createQueryBuilder('source')
            .leftJoin('source.crawl_jobs', 'job')
            .select('COUNT(job.id)', 'total')
            .getRawOne()
            .then(result => parseInt(result.total) || 0),
        ]);

        const byPriority = priorities.reduce((acc, { priority, count }) => {
          acc[priority] = parseInt(count);
          return acc;
        }, {});

        return {
          total,
          active,
          inactive,
          byPriority,
          totalAnimes,
          totalCrawlJobs,
        };
      },
      { ttl: 3600, namespace: 'source' }, // 1 hour cache for stats
    );
  }

  // ============= UTILITY METHODS =============

  async updateLastCrawledAt(id: bigint): Promise<void> {
    await this.update({ id }, { last_crawled_at: new Date() });

    // Invalidate related cache
    await this.invalidateSourceCache(id);
  }

  async toggleActiveStatus(id: bigint): Promise<UpdateResult> {
    const source = await this.findOne({ where: { id } });
    if (!source) {
      throw new Error(`Source with id ${id} not found`);
    }

    const result = await this.update({ id }, { is_active: !source.is_active });
    await this.invalidateSourceCache(id);
    await this.invalidateListCaches();

    return result;
  }

  // ============= CACHE MANAGEMENT =============

  private async invalidateSourceCache(sourceId: bigint): Promise<void> {
    try {
      // Get source to get slug
      const source = await this.findOne({
        where: { id: sourceId },
      });
      if (source) {
        // Delete specific cache entries
        await this.redisService.del(`source:id:${sourceId}`, {
          namespace: 'source',
        });
        await this.redisService.del(`source:slug:${source.slug}`, {
          namespace: 'source',
        });
      }

      // Invalidate list caches
      await this.invalidateListCaches();
    } catch (error) {
      console.error('Error invalidating source cache:', error);
    }
  }

  private async invalidateListCaches(): Promise<void> {
    try {
      // Delete pattern-based cache entries
      await this.redisService.delPattern('source:all:*', {
        namespace: 'source',
      });
      await this.redisService.delPattern('source:active', {
        namespace: 'source',
      });
      await this.redisService.delPattern('source:priority:*', {
        namespace: 'source',
      });
      await this.redisService.delPattern('source:recent:*', {
        namespace: 'source',
      });
      await this.redisService.delPattern('source:search:*', {
        namespace: 'source',
      });
      await this.redisService.delPattern('source:stats', {
        namespace: 'source',
      });
    } catch (error) {
      console.error('Error invalidating list caches:', error);
    }
  }
}
