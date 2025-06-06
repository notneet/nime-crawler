import { Source } from '@app/common/entities/core/source.entity';
import { SourceRepository } from '@app/database/repositories/source.repository';
import { QueueMetricsService } from '@app/queue';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CrawlJobConsumer } from './consumers/crawl-job.consumer';
import { CrawlJobProducer } from './producers/crawl-job.producer';

@Injectable()
export class CrawlerMicroservice implements OnModuleInit {
  private readonly logger = new Logger(CrawlerMicroservice.name);

  constructor(
    private readonly crawlJobProducer: CrawlJobProducer,
    private readonly crawlJobConsumer: CrawlJobConsumer,
    private readonly queueMetrics: QueueMetricsService,
    private readonly sourceRepository: SourceRepository,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Crawler Microservice...');

    // Start consuming from the crawl queue
    await this.startQueueConsumers();

    // Schedule initial health checks for all sources
    await this.scheduleInitialHealthChecks();

    this.logger.log('Crawler Microservice ready - listening for crawl jobs');
  }

  private async startQueueConsumers() {
    try {
      // The consumer will automatically start consuming based on the queue configuration
      this.logger.log('Queue consumers initialized');
    } catch (error) {
      this.logger.error('Failed to start queue consumers:', error);
      throw error;
    }
  }

  @Cron('0 */15 * * * *') // Every 15 minutes
  private async scheduleInitialHealthChecks() {
    try {
      const activeSources = await this.sourceRepository.find({
        where: { is_active: true },
      });

      this.logger.log(
        `Scheduling health checks for ${activeSources.length} active sources`,
      );

      for (const source of activeSources) {
        await this.crawlJobProducer.scheduleHealthCheck(source.id);
      }

      this.logger.log('Initial health checks scheduled');
    } catch (error) {
      this.logger.error('Failed to schedule initial health checks:', error);
      // Don't throw here as this is not critical for startup
    }
  }

  // Public API for other microservices to schedule crawl jobs

  async requestFullCrawl(
    sourceId: bigint,
    maxPages: number = 5,
  ): Promise<string> {
    this.logger.log(
      `Received request for full crawl - Source: ${sourceId}, Pages: ${maxPages}`,
    );
    return this.crawlJobProducer.scheduleFullCrawl(sourceId, maxPages, 1);
  }

  async requestUpdateCrawl(
    sourceId: bigint,
    olderThanHours: number = 24,
  ): Promise<string> {
    this.logger.log(
      `Received request for update crawl - Source: ${sourceId}, Older than: ${olderThanHours}h`,
    );
    return this.crawlJobProducer.scheduleUpdateCrawl(
      sourceId,
      olderThanHours,
      2,
    );
  }

  async requestBatchCrawl(maxPages: number = 3): Promise<string[]> {
    this.logger.log(`Received request for batch crawl - Pages: ${maxPages}`);
    return this.crawlJobProducer.scheduleAllActiveSources(maxPages);
  }

  async requestAnimeCrawl(sourceId: bigint, animeId: bigint): Promise<string> {
    this.logger.log(
      `Received request for single anime crawl - Source: ${sourceId}, Anime: ${animeId}`,
    );
    return this.crawlJobProducer.scheduleSingleAnimeCrawl(sourceId, animeId, 3);
  }

  async requestHealthCheck(sourceId: bigint): Promise<string> {
    this.logger.log(`Received request for health check - Source: ${sourceId}`);
    return this.crawlJobProducer.scheduleHealthCheck(sourceId);
  }

  // Utility methods for monitoring

  async getQueueMetrics() {
    try {
      return {
        crawlQueue: {
          // These would need to be implemented in the QueueMetricsService
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
        },
        sources: await this.getSourceStats(),
      };
    } catch (error) {
      this.logger.error('Failed to get queue metrics:', error);
      throw error;
    }
  }

  private async getSourceStats() {
    try {
      const sources = await this.sourceRepository.find({
        select: ['id', 'name', 'is_active', 'last_crawled_at'],
      });

      return sources.map(source => ({
        id: source.id,
        name: source.name,
        isActive: source.is_active,
        lastCrawled: source.last_crawled_at,
        status: this.getSourceStatus(source),
      }));
    } catch (error) {
      this.logger.error('Failed to get source stats:', error);
      return [];
    }
  }

  private getSourceStatus(source: Source): string {
    if (!source.is_active) return 'inactive';
    if (!source.last_crawled_at) return 'never_crawled';

    const hoursSinceLastCrawl =
      (Date.now() - source.last_crawled_at.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastCrawl < 1) return 'recently_crawled';
    if (hoursSinceLastCrawl < 24) return 'crawled_today';
    if (hoursSinceLastCrawl < 168) return 'crawled_this_week';
    return 'needs_crawl';
  }

  // Scheduler integration - these methods will be called by the scheduler service

  async handleScheduledCrawl(sourceId: bigint): Promise<string> {
    this.logger.log(`Handling scheduled crawl for source: ${sourceId}`);
    return this.crawlJobProducer.scheduleFullCrawl(sourceId, 5, 2);
  }

  async handleScheduledHealthCheck(sourceId: bigint): Promise<string> {
    this.logger.log(`Handling scheduled health check for source: ${sourceId}`);
    return this.crawlJobProducer.scheduleHealthCheck(sourceId);
  }

  async handleScheduledUpdate(): Promise<string[]> {
    this.logger.log('Handling scheduled update for all sources');

    // Find sources that haven't been crawled in the last 24 hours
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const staleSources = await this.sourceRepository
      .createQueryBuilder('source')
      .where('source.is_active = :isActive', { isActive: true })
      .andWhere(
        '(source.last_crawled_at IS NULL OR source.last_crawled_at < :threshold)',
        {
          threshold: staleThreshold,
        },
      )
      .getMany();

    const jobIds: string[] = [];
    for (const source of staleSources) {
      const jobId = await this.crawlJobProducer.scheduleUpdateCrawl(
        source.id,
        24,
        3,
      );
      jobIds.push(jobId);
    }

    this.logger.log(`Scheduled ${jobIds.length} update crawl jobs`);
    return jobIds;
  }
}
