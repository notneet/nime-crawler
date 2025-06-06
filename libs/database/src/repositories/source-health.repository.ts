import { SourceHealth } from '@app/common/entities/monitoring/source-health.entity';
import { Injectable } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { RedisService } from '../redis.service';

export interface SourceHealthSearchOptions {
  sourceId?: bigint;
  isAccessible?: boolean;
  minResponseTime?: number;
  maxResponseTime?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface HealthStats {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  successRate: number;
  lastCheckAt?: Date;
}

@Injectable()
export class SourceHealthRepository extends Repository<SourceHealth> {
  constructor(
    dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {
    super(SourceHealth, dataSource.createEntityManager());
  }

  // ============= BASIC CRUD OPERATIONS =============

  async findAll(
    options?: FindManyOptions<SourceHealth>,
  ): Promise<SourceHealth[]> {
    const cacheKey = `source-health:all:${JSON.stringify(options)}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find(options);
      },
      { ttl: 300, namespace: 'source-health' }, // 5 minutes cache
    );
  }

  async findOne(
    options: FindOneOptions<SourceHealth>,
  ): Promise<SourceHealth | null> {
    return super.findOne(options);
  }

  async findById(id: bigint): Promise<SourceHealth | null> {
    const cacheKey = `source-health:id:${id}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { id },
          relations: ['source'],
        });
      },
      { ttl: 600, namespace: 'source-health' }, // 10 minutes cache
    );
  }

  async save<T extends DeepPartial<SourceHealth>>(
    entity: T,
  ): Promise<T & SourceHealth> {
    const savedHealth = await super.save(entity);
    await this.invalidateSourceHealthCache(savedHealth.source_id);
    return savedHealth;
  }

  // ============= SOURCE HEALTH QUERIES =============

  async findLatestBySourceId(sourceId: bigint): Promise<SourceHealth | null> {
    const cacheKey = `source-health:latest:${sourceId}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.findOne({
          where: { source_id: sourceId },
          order: { checked_at: 'DESC' },
          relations: ['source'],
        });
      },
      { ttl: 180, namespace: 'source-health' }, // 3 minutes cache
    );
  }

  async findRecentBySourceId(
    sourceId: bigint,
    limit: number = 10,
  ): Promise<SourceHealth[]> {
    const cacheKey = `source-health:recent:${sourceId}:${limit}`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        return this.find({
          where: { source_id: sourceId },
          order: { checked_at: 'DESC' },
          take: limit,
          relations: ['source'],
        });
      },
      { ttl: 300, namespace: 'source-health' },
    );
  }

  async findHealthySourceIds(): Promise<bigint[]> {
    const cacheKey = 'source-health:healthy-sources';

    return this.redisService.wrap(
      cacheKey,
      async () => {
        // Find sources that were accessible in their last check
        const healthyChecks = await this.createQueryBuilder('sh')
          .select('sh.source_id')
          .distinctOn(['sh.source_id'])
          .where('sh.is_accessible = :isAccessible', { isAccessible: true })
          .orderBy('sh.source_id')
          .addOrderBy('sh.checked_at', 'DESC')
          .getRawMany();

        return healthyChecks.map(check => check.source_id);
      },
      { ttl: 600, namespace: 'source-health' },
    );
  }

  async findUnhealthySourceIds(): Promise<bigint[]> {
    const cacheKey = 'source-health:unhealthy-sources';

    return this.redisService.wrap(
      cacheKey,
      async () => {
        // Find sources that were not accessible in their last check
        const unhealthyChecks = await this.createQueryBuilder('sh')
          .select('sh.source_id')
          .distinctOn(['sh.source_id'])
          .where('sh.is_accessible = :isAccessible', { isAccessible: false })
          .orderBy('sh.source_id')
          .addOrderBy('sh.checked_at', 'DESC')
          .getRawMany();

        return unhealthyChecks.map(check => check.source_id);
      },
      { ttl: 300, namespace: 'source-health' },
    );
  }

  // ============= STATISTICS =============

  async getHealthStatsForSource(
    sourceId: bigint,
    hours: number = 24,
  ): Promise<HealthStats> {
    const cacheKey = `source-health:stats:${sourceId}:${hours}h`;

    return this.redisService.wrap(
      cacheKey,
      async () => {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [stats, lastCheck] = await Promise.all([
          this.createQueryBuilder('sh')
            .select([
              'COUNT(*) as total_checks',
              'COUNT(CASE WHEN sh.is_accessible = true THEN 1 END) as successful_checks',
              'COUNT(CASE WHEN sh.is_accessible = false THEN 1 END) as failed_checks',
              'AVG(sh.response_time_ms) as average_response_time',
            ])
            .where('sh.source_id = :sourceId', { sourceId })
            .andWhere('sh.checked_at >= :since', { since })
            .getRawOne(),

          this.findOne({
            where: { source_id: sourceId },
            order: { checked_at: 'DESC' },
          }),
        ]);

        const totalChecks = parseInt(stats.total_checks) || 0;
        const successfulChecks = parseInt(stats.successful_checks) || 0;
        const successRate =
          totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

        return {
          totalChecks,
          successfulChecks,
          failedChecks: parseInt(stats.failed_checks) || 0,
          averageResponseTime: parseFloat(stats.average_response_time) || 0,
          successRate: Math.round(successRate * 100) / 100,
          lastCheckAt: lastCheck?.checked_at,
        };
      },
      { ttl: 900, namespace: 'source-health' }, // 15 minutes cache
    );
  }

  async getOverallHealthStats(): Promise<{
    totalSources: number;
    healthySources: number;
    unhealthySources: number;
    averageResponseTime: number;
    overallSuccessRate: number;
  }> {
    const cacheKey = 'source-health:overall-stats';

    return this.redisService.wrap(
      cacheKey,
      async () => {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const stats = await this.createQueryBuilder('sh')
          .select([
            'COUNT(DISTINCT sh.source_id) as total_sources',
            'COUNT(CASE WHEN sh.is_accessible = true THEN 1 END) as successful_checks',
            'COUNT(*) as total_checks',
            'AVG(sh.response_time_ms) as average_response_time',
          ])
          .where('sh.checked_at >= :since', { since: since24h })
          .getRawOne();

        const healthySourceIds = await this.findHealthySourceIds();
        const unhealthySourceIds = await this.findUnhealthySourceIds();

        const totalChecks = parseInt(stats.total_checks) || 0;
        const successfulChecks = parseInt(stats.successful_checks) || 0;
        const overallSuccessRate =
          totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

        return {
          totalSources: parseInt(stats.total_sources) || 0,
          healthySources: healthySourceIds.length,
          unhealthySources: unhealthySourceIds.length,
          averageResponseTime: parseFloat(stats.average_response_time) || 0,
          overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
        };
      },
      { ttl: 1800, namespace: 'source-health' }, // 30 minutes cache
    );
  }

  // ============= CLEANUP =============

  async cleanupOldRecords(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.createQueryBuilder()
      .delete()
      .where('checked_at < :cutoffDate', { cutoffDate })
      .execute();

    await this.invalidateAllCaches();

    return result.affected || 0;
  }

  // ============= CACHE MANAGEMENT =============

  private async invalidateSourceHealthCache(sourceId: bigint): Promise<void> {
    try {
      await Promise.all([
        this.redisService.delPattern(`source-health:latest:${sourceId}`, {
          namespace: 'source-health',
        }),
        this.redisService.delPattern(`source-health:recent:${sourceId}:*`, {
          namespace: 'source-health',
        }),
        this.redisService.delPattern(`source-health:stats:${sourceId}:*`, {
          namespace: 'source-health',
        }),
        this.invalidateListCaches(),
      ]);
    } catch (error) {
      console.error('Error invalidating source health cache:', error);
    }
  }

  private async invalidateListCaches(): Promise<void> {
    try {
      await Promise.all([
        this.redisService.delPattern('source-health:all:*', {
          namespace: 'source-health',
        }),
        this.redisService.delPattern('source-health:healthy-sources', {
          namespace: 'source-health',
        }),
        this.redisService.delPattern('source-health:unhealthy-sources', {
          namespace: 'source-health',
        }),
        this.redisService.delPattern('source-health:overall-stats', {
          namespace: 'source-health',
        }),
      ]);
    } catch (error) {
      console.error('Error invalidating list caches:', error);
    }
  }

  private async invalidateAllCaches(): Promise<void> {
    try {
      await this.redisService.delPattern('source-health:*', {
        namespace: 'source-health',
      });
    } catch (error) {
      console.error('Error invalidating all caches:', error);
    }
  }
}
