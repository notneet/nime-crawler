import { CrawlJobStatus, CrawlJobType } from '@app/common';
import { Source } from '@app/common/entities/core/source.entity';
import { CrawlJob } from '@app/common/entities/crawler/crawl-job.entity';
import { SourceHealth } from '@app/common/entities/monitoring/source-health.entity';
import { QueueProducerService } from '@app/queue';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, Repository } from 'typeorm';
import {
  CrawlJobQueryDto,
  CrawlJobStatusDto,
  SourceHealthDto,
} from '../dto/crawler.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CrawlerGatewayService {
  private readonly logger = new Logger(CrawlerGatewayService.name);

  constructor(
    @InjectRepository(CrawlJob)
    private readonly crawlJobRepository: Repository<CrawlJob>,
    @InjectRepository(Source)
    private readonly sourceRepository: Repository<Source>,
    @InjectRepository(SourceHealth)
    private readonly sourceHealthRepository: Repository<SourceHealth>,
    private readonly queueProducerService: QueueProducerService,
  ) {}

  async scheduleFullCrawl(
    sourceId: number,
    maxPages: number = 5,
    priority: number = 1,
  ): Promise<string> {
    const jobId = uuidv4();

    const source = await this.sourceRepository.findOne({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found`);
    }

    if (!source.is_active) {
      throw new Error(`Source ${source.name} is not active`);
    }

    const crawlJobData = {
      sourceId,
      jobType: CrawlJobType.FULL_CRAWL,
      priority,
      parameters: { maxPages },
      scheduledAt: new Date(),
      maxRetries: 3,
    };

    const message = {
      jobId,
      data: crawlJobData,
    };

    await this.queueProducerService.publishMessage('crawl.queue', message);

    const crawlJob = this.crawlJobRepository.create({
      job_id: jobId,
      source_id: sourceId,
      job_type: CrawlJobType.FULL_CRAWL,
      status: CrawlJobStatus.PENDING,
      priority,
      parameters: { maxPages },
      scheduled_at: new Date(),
      max_retries: 3,
      retry_count: 0,
    });

    await this.crawlJobRepository.save(crawlJob);

    this.logger.log(
      `Scheduled full crawl job ${jobId} for source ${sourceId} with ${maxPages} pages`,
    );

    return jobId;
  }

  async scheduleUpdateCrawl(
    sourceId: number,
    maxPages: number = 2,
    priority: number = 1,
  ): Promise<string> {
    const jobId = uuidv4();

    const source = await this.sourceRepository.findOne({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found`);
    }

    if (!source.is_active) {
      throw new Error(`Source ${source.name} is not active`);
    }

    const crawlJobData = {
      sourceId,
      jobType: CrawlJobType.UPDATE_CRAWL,
      priority,
      parameters: { maxPages },
      scheduledAt: new Date(),
      maxRetries: 3,
    };

    const message = {
      jobId,
      data: crawlJobData,
    };

    await this.queueProducerService.publishMessage('crawl.queue', message);

    const crawlJob = this.crawlJobRepository.create({
      job_id: jobId,
      source_id: sourceId,
      job_type: CrawlJobType.UPDATE_CRAWL,
      status: CrawlJobStatus.PENDING,
      priority,
      parameters: { maxPages },
      scheduled_at: new Date(),
      max_retries: 3,
      retry_count: 0,
    });

    await this.crawlJobRepository.save(crawlJob);

    this.logger.log(
      `Scheduled update crawl job ${jobId} for source ${sourceId} with ${maxPages} pages`,
    );

    return jobId;
  }

  async scheduleSingleAnimeCrawl(
    sourceId: number,
    animeId: number,
    priority: number = 1,
  ): Promise<string> {
    const jobId = uuidv4();

    const source = await this.sourceRepository.findOne({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found`);
    }

    if (!source.is_active) {
      throw new Error(`Source ${source.name} is not active`);
    }

    const crawlJobData = {
      sourceId,
      jobType: CrawlJobType.SINGLE_ANIME,
      priority,
      parameters: { animeId },
      scheduledAt: new Date(),
      maxRetries: 3,
    };

    const message = {
      jobId,
      data: crawlJobData,
    };

    await this.queueProducerService.publishMessage('crawl.queue', message);

    const crawlJob = this.crawlJobRepository.create({
      job_id: jobId,
      source_id: sourceId,
      job_type: CrawlJobType.SINGLE_ANIME,
      status: CrawlJobStatus.PENDING,
      priority,
      parameters: { animeId },
      scheduled_at: new Date(),
      max_retries: 3,
      retry_count: 0,
    });

    await this.crawlJobRepository.save(crawlJob);

    this.logger.log(
      `Scheduled single anime crawl job ${jobId} for anime ${animeId}, source ${sourceId}`,
    );

    return jobId;
  }

  async scheduleHealthCheck(
    sourceId: number,
    priority: number = 1,
  ): Promise<string> {
    const jobId = uuidv4();

    const source = await this.sourceRepository.findOne({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found`);
    }

    const crawlJobData = {
      sourceId,
      jobType: CrawlJobType.HEALTH_CHECK,
      priority,
      parameters: {},
      scheduledAt: new Date(),
      maxRetries: 2,
    };

    const message = {
      jobId,
      data: crawlJobData,
    };

    await this.queueProducerService.publishMessage('crawl.queue', message);

    const crawlJob = this.crawlJobRepository.create({
      job_id: jobId,
      source_id: sourceId,
      job_type: CrawlJobType.HEALTH_CHECK,
      status: CrawlJobStatus.PENDING,
      priority,
      parameters: {},
      scheduled_at: new Date(),
      max_retries: 2,
      retry_count: 0,
    });

    await this.crawlJobRepository.save(crawlJob);

    this.logger.log(
      `Scheduled health check job ${jobId} for source ${sourceId}`,
    );

    return jobId;
  }

  async getCrawlJobs(query: CrawlJobQueryDto): Promise<{
    jobs: CrawlJobStatusDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      sourceId,
      jobType,
      status,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      startDate,
      endDate,
    } = query;

    const findOptions: FindManyOptions<CrawlJob> = {
      relations: ['source'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
    };

    const where: any = {};

    if (sourceId) {
      where.source_id = sourceId;
    }

    if (jobType) {
      where.job_type = jobType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.created_at = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.created_at = Between(new Date(startDate), new Date());
    }

    findOptions.where = where;

    const [jobs, total] =
      await this.crawlJobRepository.findAndCount(findOptions);

    const jobsDto: CrawlJobStatusDto[] = jobs.map(job => ({
      jobId: job.job_id,
      sourceId: job.source_id,
      jobType: job.job_type as CrawlJobType,
      status: job.status as CrawlJobStatus,
      priority: job.priority,
      scheduledAt: job.scheduled_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message,
      resultSummary: job.result_summary,
      retryCount: job.retry_count,
      maxRetries: job.max_retries,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    }));

    return {
      jobs: jobsDto,
      total,
      page,
      limit,
    };
  }

  async getCrawlJobStatus(jobId: string): Promise<CrawlJobStatusDto | null> {
    const job = await this.crawlJobRepository.findOne({
      where: { job_id: jobId },
      relations: ['source'],
    });

    if (!job) {
      return null;
    }

    return {
      jobId: job.job_id,
      sourceId: job.source_id,
      jobType: job.job_type as CrawlJobType,
      status: job.status as CrawlJobStatus,
      priority: job.priority,
      scheduledAt: job.scheduled_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message,
      resultSummary: job.result_summary,
      retryCount: job.retry_count,
      maxRetries: job.max_retries,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }

  async getSourceHealth(sourceId: number): Promise<SourceHealthDto> {
    const source = await this.sourceRepository.findOne({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found`);
    }

    const latestHealth = await this.sourceHealthRepository.findOne({
      where: { source_id: sourceId },
      order: { checked_at: 'DESC' },
    });

    const healthDto: SourceHealthDto = {
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.base_url,
      isAccessible: latestHealth?.is_accessible ?? false,
      responseTimeMs: latestHealth?.response_time_ms,
      httpStatusCode: latestHealth?.http_status_code,
      errorMessage: latestHealth?.error_message,
      successRate24h: latestHealth?.success_rate_24h,
      lastCheckedAt: latestHealth?.checked_at ?? new Date(0),
    };

    return healthDto;
  }
}
