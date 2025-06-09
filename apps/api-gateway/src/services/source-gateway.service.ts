import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between } from 'typeorm';
import { Source } from '@app/common/entities/core/source.entity';
import { SourceRepository } from '@app/database/repositories/source.repository';
import { AnimeRepository } from '@app/database/repositories/anime.repository';
import { SourceHealthRepository } from '@app/database/repositories/source-health.repository';
import { CrawlJob } from '@app/common/entities/crawler/crawl-job.entity';
import { CrawlJobStatus } from '@app/common';
import { SourceQueryDto, SourceDto, SourceStatsDto } from '../dto/source.dto';
import { AnimeDto } from '../dto/anime.dto';

@Injectable()
export class SourceGatewayService {
  private readonly logger = new Logger(SourceGatewayService.name);

  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly animeRepository: AnimeRepository,
    @InjectRepository(CrawlJob)
    private readonly crawlJobRepository: Repository<CrawlJob>,
    private readonly sourceHealthRepository: SourceHealthRepository,
  ) {}

  async getSources(query: SourceQueryDto): Promise<{
    sources: SourceDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = query;

    const findOptions: FindManyOptions<Source> = {
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
    };

    const where: any = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    findOptions.where = where;

    const [sources, total] =
      await this.sourceRepository.findAndCount(findOptions);

    const sourcesDto: SourceDto[] = sources.map(source => ({
      id: source.id.toString(),
      name: source.name,
      slug: source.slug,
      baseUrl: source.base_url,
      selectors: source.selectors,
      headers: source.headers,
      priority: source.priority,
      isActive: source.is_active,
      delayMs: source.delay_ms,
      lastCrawledAt: source.last_crawled_at,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    }));

    return {
      sources: sourcesDto,
      total,
      page,
      limit,
    };
  }

  async getSourceById(id: string): Promise<SourceDto | null> {
    const source = await this.sourceRepository.findOne({
      where: { id: BigInt(id) },
    });

    if (!source) {
      return null;
    }

    return {
      id: source.id.toString(),
      name: source.name,
      slug: source.slug,
      baseUrl: source.base_url,
      selectors: source.selectors,
      headers: source.headers,
      priority: source.priority,
      isActive: source.is_active,
      delayMs: source.delay_ms,
      lastCrawledAt: source.last_crawled_at,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    };
  }

  async getSourceAnime(
    sourceId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    anime: AnimeDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [anime, total] = await this.animeRepository.findAndCount({
      where: { source_id: BigInt(sourceId) },
      relations: ['genres'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const animeDto: AnimeDto[] = anime.map(item => ({
      id: item.id.toString(),
      title: item.title,
      slug: item.slug,
      alternativeTitle: item.alternative_title,
      synopsis: item.synopsis,
      posterUrl: item.poster_url,
      bannerUrl: item.banner_url,
      type: item.type,
      status: item.status,
      totalEpisodes: item.total_episodes,
      releaseYear: item.release_year,
      season: item.season,
      rating: item.rating,
      viewCount: item.view_count,
      downloadCount: item.download_count,
      sourceId: item.source_id.toString(),
      sourceAnimeId: item.source_anime_id,
      sourceUrl: item.source_url,
      lastUpdatedAt: item.last_updated_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      genres: item.genres?.map(genre => genre.name) || [],
    }));

    return {
      anime: animeDto,
      total,
      page,
      limit,
    };
  }

  async getSourceStats(sourceId: string): Promise<SourceStatsDto> {
    const source = await this.sourceRepository.findOne({
      where: { id: BigInt(sourceId) },
    });

    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalAnime,
      totalEpisodes,
      crawlJobsToday,
      successfulCrawlsToday,
      failedCrawlsToday,
      latestHealth,
    ] = await Promise.all([
      this.animeRepository.count({ where: { source_id: BigInt(sourceId) } }),
      this.animeRepository
        .createQueryBuilder('anime')
        .leftJoin('anime.episodes', 'episode')
        .where('anime.source_id = :sourceId', { sourceId: BigInt(sourceId) })
        .select('COUNT(episode.id)', 'count')
        .getRawOne()
        .then(result => parseInt(result?.count || '0')),
      this.crawlJobRepository.count({
        where: {
          source_id: BigInt(sourceId),
          created_at: Between(today, tomorrow),
        },
      }),
      this.crawlJobRepository.count({
        where: {
          source_id: BigInt(sourceId),
          status: CrawlJobStatus.COMPLETED,
          created_at: Between(today, tomorrow),
        },
      }),
      this.crawlJobRepository.count({
        where: {
          source_id: BigInt(sourceId),
          status: CrawlJobStatus.FAILED,
          created_at: Between(today, tomorrow),
        },
      }),
      this.sourceHealthRepository.findOne({
        where: { source_id: BigInt(sourceId) },
        order: { checked_at: 'DESC' },
      }),
    ]);

    // Calculate average response time from recent health checks
    const recentHealthChecks = await this.sourceHealthRepository.find({
      where: { source_id: BigInt(sourceId) },
      order: { checked_at: 'DESC' },
      take: 10,
    });

    const averageResponseTime =
      recentHealthChecks.length > 0
        ? recentHealthChecks.reduce(
            (sum, health) => sum + (health.response_time_ms || 0),
            0,
          ) / recentHealthChecks.length
        : 0;

    return {
      sourceId: source.id.toString(),
      sourceName: source.name,
      totalAnime,
      totalEpisodes,
      lastCrawledAt: source.last_crawled_at,
      crawlJobsToday,
      successfulCrawlsToday,
      failedCrawlsToday,
      averageResponseTime: Math.round(averageResponseTime),
      healthStatus: {
        isAccessible: latestHealth?.is_accessible ?? false,
        lastChecked: latestHealth?.checked_at ?? new Date(0),
        successRate24h: 0, // Calculate from health checks if needed
      },
    };
  }
}
