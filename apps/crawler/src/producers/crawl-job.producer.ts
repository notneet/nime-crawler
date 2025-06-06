import { QUEUE_NAMES } from '@app/common/constants/queue.constants';
import { QueueProducerService } from '@app/queue';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CrawlJobData,
  CrawlJobMessage,
  CrawlJobType,
} from '../interfaces/crawl-job.interface';

@Injectable()
export class CrawlJobProducer {
  private readonly logger = new Logger(CrawlJobProducer.name);

  constructor(private readonly queueProducer: QueueProducerService) {}

  async scheduleFullCrawl(
    sourceId: bigint,
    maxPages: number = 5,
    priority: number = 1,
  ): Promise<string> {
    const jobId = uuidv4();
    const jobData: CrawlJobData = {
      sourceId,
      jobType: CrawlJobType.FULL_CRAWL,
      priority,
      parameters: { maxPages },
      scheduledAt: new Date(),
      maxRetries: 3,
    };

    const message: CrawlJobMessage = {
      jobId,
      data: jobData,
      attemptCount: 0,
      maxAttempts: jobData.maxRetries || 3,
      createdAt: new Date(),
    };

    try {
      await this.queueProducer.publishMessage(QUEUE_NAMES.CRAWL, message);

      this.logger.log(
        `Scheduled full crawl job ${jobId} for source ${sourceId}`,
      );
      return jobId;
    } catch (error) {
      this.logger.error(
        `Failed to schedule full crawl job for source ${sourceId}:`,
        error,
      );
      throw error;
    }
  }

  async scheduleUpdateCrawl(
    sourceId: bigint,
    olderThanHours: number = 24,
    priority: number = 2,
  ): Promise<string> {
    const jobId = uuidv4();
    const jobData: CrawlJobData = {
      sourceId,
      jobType: CrawlJobType.UPDATE_CRAWL,
      priority,
      parameters: {
        maxPages: 3,
        forceUpdate: false,
      },
      scheduledAt: new Date(),
      maxRetries: 2,
    };

    const message: CrawlJobMessage = {
      jobId,
      data: jobData,
      attemptCount: 0,
      maxAttempts: jobData.maxRetries || 2,
      createdAt: new Date(),
      headers: {
        olderThanHours: olderThanHours.toString(),
      },
    };

    try {
      await this.queueProducer.publishMessage(QUEUE_NAMES.CRAWL, message);

      this.logger.log(
        `Scheduled update crawl job ${jobId} for source ${sourceId}`,
      );
      return jobId;
    } catch (error) {
      this.logger.error(
        `Failed to schedule update crawl job for source ${sourceId}:`,
        error,
      );
      throw error;
    }
  }

  async scheduleAllActiveSources(maxPages: number = 3): Promise<string[]> {
    const batchJobId = uuidv4();
    const jobIds: string[] = [];

    try {
      const jobId = uuidv4();
      const jobData: CrawlJobData = {
        sourceId: BigInt(0), // Special case for all sources
        jobType: CrawlJobType.FULL_CRAWL,
        priority: 1,
        parameters: {
          maxPages,
          forceUpdate: false,
        },
        scheduledAt: new Date(),
        maxRetries: 1,
      };

      const message: CrawlJobMessage = {
        jobId,
        data: jobData,
        attemptCount: 0,
        maxAttempts: 1,
        createdAt: new Date(),
      };

      await this.queueProducer.publishMessage(QUEUE_NAMES.CRAWL, message);

      jobIds.push(jobId);
      this.logger.log(
        `Scheduled batch crawl job ${batchJobId} for all active sources`,
      );
      return jobIds;
    } catch (error) {
      this.logger.error(
        'Failed to schedule batch crawl job for all sources:',
        error,
      );
      throw error;
    }
  }

  async scheduleSingleAnimeCrawl(
    sourceId: bigint,
    animeId: bigint,
    priority: number = 3,
  ): Promise<string> {
    const jobId = uuidv4();
    const jobData: CrawlJobData = {
      sourceId,
      jobType: CrawlJobType.SINGLE_ANIME,
      priority,
      parameters: {
        animeId,
        forceUpdate: true,
      },
      scheduledAt: new Date(),
      maxRetries: 2,
    };

    const message: CrawlJobMessage = {
      jobId,
      data: jobData,
      attemptCount: 0,
      maxAttempts: 2,
      createdAt: new Date(),
    };

    try {
      await this.queueProducer.publishMessage(QUEUE_NAMES.CRAWL, message);

      this.logger.log(
        `Scheduled single anime crawl job ${jobId} for anime ${animeId} from source ${sourceId}`,
      );
      return jobId;
    } catch (error) {
      this.logger.error(
        `Failed to schedule single anime crawl job for anime ${animeId}:`,
        error,
      );
      throw error;
    }
  }

  async scheduleHealthCheck(sourceId: bigint): Promise<string> {
    const jobId = uuidv4();
    const jobData: CrawlJobData = {
      sourceId,
      jobType: CrawlJobType.HEALTH_CHECK,
      priority: 5, // Low priority
      parameters: {},
      scheduledAt: new Date(),
      maxRetries: 1,
    };

    const message: CrawlJobMessage = {
      jobId,
      data: jobData,
      attemptCount: 0,
      maxAttempts: 1,
      createdAt: new Date(),
    };

    try {
      await this.queueProducer.publishMessage(QUEUE_NAMES.CRAWL, message);

      this.logger.log(
        `Scheduled health check job ${jobId} for source ${sourceId}`,
      );
      return jobId;
    } catch (error) {
      this.logger.error(
        `Failed to schedule health check job for source ${sourceId}:`,
        error,
      );
      throw error;
    }
  }

  async scheduleDelayedJob(
    jobData: CrawlJobData,
    delayMs: number,
  ): Promise<string> {
    const jobId = uuidv4();
    const scheduledFor = new Date(Date.now() + delayMs);

    const message: CrawlJobMessage = {
      jobId,
      data: jobData,
      attemptCount: 0,
      maxAttempts: jobData.maxRetries || 3,
      createdAt: new Date(),
      scheduledFor,
    };

    try {
      await this.queueProducer.publishMessage(QUEUE_NAMES.CRAWL, message);

      this.logger.log(`Scheduled delayed job ${jobId} for ${delayMs}ms delay`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to schedule delayed job:`, error);
      throw error;
    }
  }

  async retryFailedJob(
    originalMessage: CrawlJobMessage,
    retryDelayMs: number = 5000,
  ): Promise<string> {
    const retryJobId = uuidv4();
    const retryMessage: CrawlJobMessage = {
      ...originalMessage,
      jobId: retryJobId,
      attemptCount: originalMessage.attemptCount + 1,
      createdAt: new Date(),
      scheduledFor: new Date(Date.now() + retryDelayMs),
    };

    try {
      await this.queueProducer.publishMessage(QUEUE_NAMES.CRAWL, retryMessage);

      this.logger.log(
        `Scheduled retry job ${retryJobId} (attempt ${retryMessage.attemptCount}/${retryMessage.maxAttempts})`,
      );
      return retryJobId;
    } catch (error) {
      this.logger.error(
        `Failed to schedule retry job for ${originalMessage.jobId}:`,
        error,
      );
      throw error;
    }
  }
}
