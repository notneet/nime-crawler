import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between } from 'typeorm';
import { Source } from '@app/common/entities/core/source.entity';
import { Anime } from '@app/common/entities/core/anime.entity';
import { CrawlJob } from '@app/common/entities/crawler/crawl-job.entity';
import { SourceHealth } from '@app/common/entities/monitoring/source-health.entity';
import { SourceQueryDto, SourceDto, SourceStatsDto } from '../dto/source.dto';
import { AnimeDto } from '../dto/anime.dto';

@Injectable()
export class SourceGatewayService {
  private readonly logger = new Logger(SourceGatewayService.name);

  constructor(
    @InjectRepository(Source)
    private readonly sourceRepository: Repository<Source>,
    @InjectRepository(Anime)
    private readonly animeRepository: Repository<Anime>,
    @InjectRepository(CrawlJob)
    private readonly crawlJobRepository: Repository<CrawlJob>,
    @InjectRepository(SourceHealth)
    private readonly sourceHealthRepository: Repository<SourceHealth>,
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
      id: source.id,
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

  async getSourceById(id: number): Promise<SourceDto | null> {
    const source = await this.sourceRepository.findOne({
      where: { id },
    });

    if (!source) {
      return null;
    }

    return {
      id: source.id,
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
    sourceId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    anime: AnimeDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [anime, total] = await this.animeRepository.findAndCount({
      where: { source_id: sourceId },
      relations: ['genres'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const animeDto: AnimeDto[] = anime.map(item => ({
      id: item.id,
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
      sourceId: item.source_id,
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

  async getSourceStats(sourceId: number): Promise<SourceStatsDto> {
    const source = await this.sourceRepository.findOne({
      where: { id: sourceId },
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
      this.animeRepository.count({ where: { source_id: sourceId } }),
      this.animeRepository
        .createQueryBuilder('anime')
        .leftJoin('anime.episodes', 'episode')
        .where('anime.source_id = :sourceId', { sourceId })
        .select('COUNT(episode.id)', 'count')
        .getRawOne()
        .then(result => parseInt(result?.count || '0')),
      this.crawlJobRepository.count({
        where: {
          source_id: sourceId,
          created_at: Between(today, tomorrow),
        },
      }),
      this.crawlJobRepository.count({
        where: {
          source_id: sourceId,
          status: 'completed',
          created_at: Between(today, tomorrow),
        },
      }),
      this.crawlJobRepository.count({
        where: {
          source_id: sourceId,
          status: 'failed',
          created_at: Between(today, tomorrow),
        },
      }),
      this.sourceHealthRepository.findOne({
        where: { source_id: sourceId },
        order: { checked_at: 'DESC' },
      }),
    ]);

    // Calculate average response time from recent health checks
    const recentHealthChecks = await this.sourceHealthRepository.find({
      where: { source_id: sourceId },
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
      sourceId: source.id,
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
        successRate24h: latestHealth?.success_rate_24h ?? 0,
      },
    };
  }
}
