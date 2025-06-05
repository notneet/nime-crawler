import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  IQueueJob,
  IDeadLetterQueueHandler,
  QUEUE_NAMES,
  EXCHANGE_NAMES,
} from '@app/common';

@Injectable()
export class DeadLetterQueueService implements IDeadLetterQueueHandler {
  private readonly logger = new Logger(DeadLetterQueueService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Handle dead letter message
   */
  async handleDeadLetter(job: IQueueJob, error: Error): Promise<void> {
    try {
      this.logger.error(
        `Sending job ${job.id} to dead letter queue: ${error.message}`,
      );

      // Create dead letter entry with error information
      const deadLetterEntry = {
        ...job,
        deadLetterInfo: {
          originalQueue: this.getQueueName(job.type),
          failureReason: error.message,
          failureStack: error.stack,
          failedAt: new Date(),
          retryCount: job.retryCount || 0,
          maxRetries: job.maxRetries || 3,
        },
        metadata: {
          ...job.metadata,
          deadLettered: true,
          deadLetteredAt: new Date(),
        },
      };

      // Publish to dead letter exchange
      await this.amqpConnection.publish(
        EXCHANGE_NAMES.DEAD_LETTER,
        `${QUEUE_NAMES.DEAD_LETTER}.${job.type}`,
        deadLetterEntry,
        {
          persistent: true,
          messageId: `dlq-${job.id}`,
          timestamp: Date.now(),
          headers: {
            originalJobType: job.type,
            originalJobId: job.id,
            failureReason: error.message,
            deadLetteredAt: new Date().toISOString(),
          },
        },
      );

      this.logger.warn(`Job ${job.id} sent to dead letter queue`);
    } catch (dlqError) {
      this.logger.error(
        `Failed to send job ${job.id} to dead letter queue: ${dlqError.message}`,
        dlqError.stack,
      );

      // Fallback: Log the dead letter information
      this.logDeadLetterFallback(job, error, dlqError);
    }
  }

  /**
   * Requeue dead letter message
   */
  async requeueDeadLetter(jobId: string): Promise<boolean> {
    try {
      this.logger.log(`Attempting to requeue dead letter job: ${jobId}`);

      // Note: This would require retrieving the message from the DLQ
      // and republishing it to the original queue
      // Implementation depends on your specific requirements

      this.logger.warn(
        `Dead letter requeue not fully implemented for job: ${jobId}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to requeue dead letter job ${jobId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Get dead letter messages
   */
  async getDeadLetters(limit: number = 100): Promise<IQueueJob[]> {
    try {
      this.logger.log(`Retrieving dead letter messages (limit: ${limit})`);

      // Note: This would require implementing message retrieval from DLQ
      // Implementation depends on your specific requirements

      this.logger.warn('Dead letter retrieval not fully implemented');
      return [];
    } catch (error) {
      this.logger.error(
        `Failed to get dead letter messages: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Clear dead letter queue
   */
  async clearDeadLetters(): Promise<number> {
    try {
      this.logger.log('Clearing dead letter queue');

      // Note: This would require implementing queue purging
      // Implementation depends on your specific requirements

      this.logger.warn('Dead letter queue clearing not fully implemented');
      return 0;
    } catch (error) {
      this.logger.error(
        `Failed to clear dead letter queue: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Process dead letter queue messages for analysis
   */
  async processDeadLetterAnalysis(): Promise<void> {
    try {
      const deadLetters = await this.getDeadLetters(1000);

      if (deadLetters.length === 0) {
        this.logger.log('No dead letter messages to analyze');
        return;
      }

      // Analyze failure patterns
      const failurePatterns = this.analyzeFailurePatterns(deadLetters);

      this.logger.log(
        `Dead letter analysis completed for ${deadLetters.length} messages`,
      );
      this.logger.log(
        'Failure patterns:',
        JSON.stringify(failurePatterns, null, 2),
      );
    } catch (error) {
      this.logger.error(
        `Failed to process dead letter analysis: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get dead letter queue statistics
   */
  async getDeadLetterStats(): Promise<any> {
    try {
      const deadLetters = await this.getDeadLetters();

      return {
        totalMessages: deadLetters.length,
        messagesByType: this.groupByType(deadLetters),
        messagesByDate: this.groupByDate(deadLetters),
        commonFailures: this.getCommonFailures(deadLetters),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dead letter stats: ${error.message}`,
        error.stack,
      );
      return {
        totalMessages: 0,
        messagesByType: {},
        messagesByDate: {},
        commonFailures: [],
      };
    }
  }

  /**
   * Log dead letter information as fallback
   */
  private logDeadLetterFallback(
    job: IQueueJob,
    originalError: Error,
    dlqError: Error,
  ): void {
    const fallbackLog = {
      jobId: job.id,
      jobType: job.type,
      originalError: originalError.message,
      dlqError: dlqError.message,
      retryCount: job.retryCount || 0,
      maxRetries: job.maxRetries || 3,
      jobData: job.data,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      'DEAD LETTER FALLBACK LOG:',
      JSON.stringify(fallbackLog, null, 2),
    );
  }

  /**
   * Analyze failure patterns in dead letter messages
   */
  private analyzeFailurePatterns(deadLetters: IQueueJob[]): any {
    const patterns = {
      errorTypes: {},
      jobTypes: {},
      timeDistribution: {},
    };

    deadLetters.forEach(job => {
      // Count error types
      const errorType = this.extractErrorType(job);
      patterns.errorTypes[errorType] =
        (patterns.errorTypes[errorType] || 0) + 1;

      // Count job types
      patterns.jobTypes[job.type] = (patterns.jobTypes[job.type] || 0) + 1;

      // Time distribution
      const hour = new Date(
        job.metadata?.deadLetteredAt || new Date(),
      ).getHours();
      patterns.timeDistribution[hour] =
        (patterns.timeDistribution[hour] || 0) + 1;
    });

    return patterns;
  }

  /**
   * Extract error type from dead letter job
   */
  private extractErrorType(job: IQueueJob): string {
    const deadLetterInfo = (job as any).deadLetterInfo;
    if (deadLetterInfo?.failureReason) {
      // Extract error class name or first part of error message
      const errorMatch = deadLetterInfo.failureReason.match(/^(\w+Error)/);
      return errorMatch ? errorMatch[1] : 'UnknownError';
    }
    return 'UnknownError';
  }

  /**
   * Group dead letters by job type
   */
  private groupByType(deadLetters: IQueueJob[]): Record<string, number> {
    return deadLetters.reduce(
      (acc, job) => {
        acc[job.type] = (acc[job.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Group dead letters by date
   */
  private groupByDate(deadLetters: IQueueJob[]): Record<string, number> {
    return deadLetters.reduce(
      (acc, job) => {
        const date = new Date(
          job.metadata?.deadLetteredAt || new Date(),
        ).toDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Get common failure reasons
   */
  private getCommonFailures(
    deadLetters: IQueueJob[],
  ): Array<{ reason: string; count: number }> {
    const failures = deadLetters.reduce(
      (acc, job) => {
        const reason = this.extractErrorType(job);
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(failures)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get queue name based on job type
   */
  private getQueueName(jobType: string): string {
    if (jobType.startsWith('crawl-')) {
      return QUEUE_NAMES.CRAWL;
    } else if (jobType.startsWith('check-') || jobType.includes('health')) {
      return QUEUE_NAMES.LINK_CHECK;
    } else if (jobType.startsWith('track-') || jobType.includes('analytics')) {
      return QUEUE_NAMES.ANALYTICS;
    } else if (['discord', 'telegram', 'email', 'webhook'].includes(jobType)) {
      return QUEUE_NAMES.NOTIFICATION;
    } else if (
      jobType.includes('daily') ||
      jobType.includes('hourly') ||
      jobType.includes('schedule')
    ) {
      return QUEUE_NAMES.SCHEDULER;
    }

    return 'default.queue';
  }
}
