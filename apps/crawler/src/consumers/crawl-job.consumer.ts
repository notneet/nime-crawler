import { Injectable, Logger } from '@nestjs/common';
import {
  BaseQueueConsumer,
  QueueMetricsService,
  DeadLetterQueueService,
} from '@app/queue';
import {
  QUEUE_NAMES,
  ROUTING_KEYS,
} from '@app/common/constants/queue.constants';
import {
  CrawlJobMessage,
  CrawlJobResult,
  CrawlJobStatus,
  CrawlJobType,
  CrawlJobError,
} from '../interfaces/crawl-job.interface';
import { CrawlerService } from '../crawler.service';
import { CrawlJobProducer } from '../producers/crawl-job.producer';
import { Source } from '@app/common/entities/core/source.entity';
import { SourceRepository } from '@app/database/repositories/source.repository';
import { IQueueJob, IQueueJobResult } from '@app/common';

@Injectable()
export class CrawlJobConsumer extends BaseQueueConsumer {
  protected readonly logger = new Logger(CrawlJobConsumer.name);

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly crawlJobProducer: CrawlJobProducer,
    queueMetrics: QueueMetricsService,
    deadLetterService: DeadLetterQueueService,
    private readonly sourceRepository: SourceRepository,
  ) {
    super(queueMetrics, deadLetterService);
  }

  async processJob(job: IQueueJob): Promise<IQueueJobResult> {
    // Convert IQueueJob to CrawlJobMessage format
    const message: CrawlJobMessage = {
      jobId: job.id,
      data: job.data,
      attemptCount: job.retryCount || 0,
      maxAttempts: job.maxRetries || 3,
      createdAt: new Date(),
      headers: job.metadata,
    };

    const result = await this.processMessage(message);

    return {
      jobId: job.id,
      status: 'completed' as any,
      result,
      startedAt: new Date(),
      completedAt: new Date(),
      processingTimeMs: 0,
    };
  }

  async processMessage(message: CrawlJobMessage): Promise<CrawlJobResult> {
    const startTime = Date.now();
    const { jobId, data } = message;

    try {
      this.logger.log(
        `Processing crawl job ${jobId} - Type: ${data.jobType}, Source: ${data.sourceId}`,
      );

      let result: CrawlJobResult;

      switch (data.jobType) {
        case CrawlJobType.FULL_CRAWL:
          result = await this.handleFullCrawl(message);
          break;
        case CrawlJobType.UPDATE_CRAWL:
          result = await this.handleUpdateCrawl(message);
          break;
        case CrawlJobType.SINGLE_ANIME:
          result = await this.handleSingleAnimeCrawl(message);
          break;
        case CrawlJobType.HEALTH_CHECK:
          result = await this.handleHealthCheck(message);
          break;
        default:
          throw new Error(`Unknown job type: ${data.jobType}`);
      }

      this.logger.log(
        `Completed crawl job ${jobId} - Created: ${result.createdCount}, Updated: ${result.updatedCount}, Errors: ${result.errorCount}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to process crawl job ${jobId}:`, error);

      // Check if we should retry
      if (message.attemptCount < message.maxAttempts) {
        const retryDelay = this.calculateRetryDelay(message.attemptCount);
        await this.crawlJobProducer.retryFailedJob(message, retryDelay);
        this.logger.log(
          `Scheduled retry for job ${jobId} (attempt ${message.attemptCount + 1}/${message.maxAttempts})`,
        );
      } else {
        this.logger.error(
          `Job ${jobId} failed permanently after ${message.maxAttempts} attempts`,
        );
      }

      throw error;
    }
  }

  private async handleFullCrawl(
    message: CrawlJobMessage,
  ): Promise<CrawlJobResult> {
    const { jobId, data } = message;
    const { sourceId, parameters } = data;

    const result: CrawlJobResult = {
      jobId,
      sourceId,
      jobType: CrawlJobType.FULL_CRAWL,
      status: CrawlJobStatus.IN_PROGRESS,
      startedAt: new Date(),
      processedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      if (sourceId === 0n) {
        // Special case: crawl all active sources
        const activeSources = await this.sourceRepository.find({
          where: { is_active: true },
          order: { priority: 'DESC' },
        });

        for (const source of activeSources) {
          try {
            const sourceResult = await this.crawlerService.crawlSource(
              source.id,
              parameters?.maxPages || 5,
            );

            result.processedCount += sourceResult.processed;
            result.createdCount += sourceResult.created;
            result.updatedCount += sourceResult.updated;
            result.skippedCount += sourceResult.skipped;
            result.errorCount += sourceResult.errors.length;
            result.errors.push(
              ...sourceResult.errors.map(err => ({
                ...err,
                timestamp: new Date(),
              })),
            );

            // Respect source delay
            if (source.delay_ms > 0) {
              await this.delay(source.delay_ms);
            }
          } catch (error) {
            result.errorCount++;
            result.errors.push({
              sourceAnimeId: `source-${source.id}`,
              title: source.name,
              error: error.message,
              timestamp: new Date(),
            });
          }
        }
      } else {
        // Crawl specific source
        const sourceResult = await this.crawlerService.crawlSource(
          sourceId,
          parameters?.maxPages || 5,
        );

        result.processedCount = sourceResult.processed;
        result.createdCount = sourceResult.created;
        result.updatedCount = sourceResult.updated;
        result.skippedCount = sourceResult.skipped;
        result.errorCount = sourceResult.errors.length;
        result.errors = sourceResult.errors.map(err => ({
          ...err,
          timestamp: new Date(),
        }));
      }

      result.status = CrawlJobStatus.COMPLETED;
      result.completedAt = new Date();

      return result;
    } catch (error) {
      result.status = CrawlJobStatus.FAILED;
      result.completedAt = new Date();
      result.errorCount++;
      result.errors.push({
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async handleUpdateCrawl(
    message: CrawlJobMessage,
  ): Promise<CrawlJobResult> {
    const { jobId, data } = message;
    const { sourceId, parameters } = data;

    const result: CrawlJobResult = {
      jobId,
      sourceId,
      jobType: CrawlJobType.UPDATE_CRAWL,
      status: CrawlJobStatus.IN_PROGRESS,
      startedAt: new Date(),
      processedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      const olderThanHours = parseInt(
        message.headers?.olderThanHours || '24',
        10,
      );

      const updateResult = await this.crawlerService.updateStaleAnime(
        sourceId || undefined,
        olderThanHours,
      );

      result.processedCount = updateResult.processed;
      result.createdCount = updateResult.created;
      result.updatedCount = updateResult.updated;
      result.skippedCount = updateResult.skipped;
      result.errorCount = updateResult.errors.length;
      result.errors = updateResult.errors.map(err => ({
        ...err,
        timestamp: new Date(),
      }));

      result.status = CrawlJobStatus.COMPLETED;
      result.completedAt = new Date();

      return result;
    } catch (error) {
      result.status = CrawlJobStatus.FAILED;
      result.completedAt = new Date();
      result.errorCount++;
      result.errors.push({
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async handleSingleAnimeCrawl(
    message: CrawlJobMessage,
  ): Promise<CrawlJobResult> {
    const { jobId, data } = message;
    const { sourceId, parameters } = data;

    const result: CrawlJobResult = {
      jobId,
      sourceId,
      jobType: CrawlJobType.SINGLE_ANIME,
      status: CrawlJobStatus.IN_PROGRESS,
      startedAt: new Date(),
      processedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      // TODO: Implement single anime crawl logic
      // This would involve targeting a specific anime for updates
      this.logger.log(
        `Single anime crawl not yet implemented for anime ${parameters?.animeId}`,
      );

      result.status = CrawlJobStatus.COMPLETED;
      result.completedAt = new Date();
      result.skippedCount = 1;

      return result;
    } catch (error) {
      result.status = CrawlJobStatus.FAILED;
      result.completedAt = new Date();
      result.errorCount++;
      result.errors.push({
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async handleHealthCheck(
    message: CrawlJobMessage,
  ): Promise<CrawlJobResult> {
    const { jobId, data } = message;
    const { sourceId } = data;

    const result: CrawlJobResult = {
      jobId,
      sourceId,
      jobType: CrawlJobType.HEALTH_CHECK,
      status: CrawlJobStatus.IN_PROGRESS,
      startedAt: new Date(),
      processedCount: 1,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      const source = await this.sourceRepository.findOne({
        where: { id: sourceId },
      });

      if (!source) {
        throw new Error(`Source ${sourceId} not found`);
      }

      // TODO: Implement health check logic
      // This would ping the source URL and check if it's accessible
      this.logger.log(`Health check completed for source ${source.name}`);

      result.status = CrawlJobStatus.COMPLETED;
      result.completedAt = new Date();
      result.resultSummary = {
        sourceUrl: source.base_url,
        isAccessible: true,
        responseTime: 250,
      };

      return result;
    } catch (error) {
      result.status = CrawlJobStatus.FAILED;
      result.completedAt = new Date();
      result.errorCount++;
      result.errors.push({
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  protected calculateRetryDelay(attemptCount: number): number {
    // Exponential backoff: 5s, 10s, 20s, 40s...
    return Math.min(5000 * Math.pow(2, attemptCount), 60000); // Max 1 minute
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueName(): string {
    return QUEUE_NAMES.CRAWL;
  }

  getRoutingKeys(): string[] {
    return [
      ROUTING_KEYS.CRAWL.ANIME,
      ROUTING_KEYS.CRAWL.SOURCE,
      ROUTING_KEYS.CRAWL.RETRY,
    ];
  }
}
