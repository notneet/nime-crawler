import { Logger } from '@nestjs/common';
import { RabbitSubscribe, Nack, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  IQueueJob,
  IQueueConsumer,
  IQueueJobResult,
  QueueJobStatus,
  QUEUE_NAMES,
  EXCHANGE_NAMES,
} from '@app/common';
import { QueueMetricsService } from '../services/queue-metrics.service';
import { DeadLetterQueueService } from '../services/dead-letter-queue.service';

export abstract class BaseQueueConsumer implements IQueueConsumer {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly metricsService: QueueMetricsService,
    protected readonly deadLetterService: DeadLetterQueueService,
  ) {}

  /**
   * Abstract method to be implemented by concrete consumers
   */
  abstract processJob(job: IQueueJob): Promise<IQueueJobResult>;

  /**
   * Handle job processing with error handling and retry logic
   */
  protected async handleJobExecution(job: IQueueJob): Promise<IQueueJobResult> {
    const startTime = Date.now();
    let result: IQueueJobResult;

    try {
      this.logger.log(`Processing job ${job.id} of type: ${job.type}`);

      // Update metrics
      await this.metricsService.incrementJobCount(
        this.getQueueName(job.type),
        'processing',
      );

      // Process the job
      result = await this.processJob(job);

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      result.processingTimeMs = processingTime;
      result.completedAt = new Date();

      // Handle successful completion
      if (result.status === QueueJobStatus.COMPLETED) {
        await this.handleJobCompletion(job, result.result);
        await this.metricsService.incrementJobCount(
          this.getQueueName(job.type),
          'completed',
        );
        await this.metricsService.updateProcessingTime(
          this.getQueueName(job.type),
          processingTime,
        );
      }

      this.logger.log(
        `Job ${job.id} completed in ${processingTime}ms with status: ${result.status}`,
      );
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `Job ${job.id} failed after ${processingTime}ms: ${error.message}`,
        error.stack,
      );

      result = {
        jobId: job.id,
        status: QueueJobStatus.FAILED,
        error: error.message,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        processingTimeMs: processingTime,
      };

      // Handle job failure
      await this.handleJobFailure(job, error);
      await this.metricsService.incrementJobCount(
        this.getQueueName(job.type),
        'failed',
      );

      // Check if job should be retried
      if (this.shouldRetryJob(job, error)) {
        await this.handleJobRetry(job);
        result.status = QueueJobStatus.RETRYING;
      } else {
        // Send to dead letter queue if max retries exceeded
        await this.deadLetterService.handleDeadLetter(job, error);
      }

      return result;
    }
  }

  /**
   * Handle job failure
   */
  async handleJobFailure(job: IQueueJob, error: Error): Promise<void> {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);

    // Log failure details
    const failureInfo = {
      jobId: job.id,
      jobType: job.type,
      retryCount: job.retryCount || 0,
      maxRetries: job.maxRetries || 3,
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
    };

    // Store failure information (implement based on your needs)
    this.logger.error(
      'Job failure details:',
      JSON.stringify(failureInfo, null, 2),
    );
  }

  /**
   * Handle job retry
   */
  async handleJobRetry(job: IQueueJob): Promise<void> {
    const retryCount = (job.retryCount || 0) + 1;
    const retryDelay = this.calculateRetryDelay(retryCount);

    this.logger.warn(
      `Retrying job ${job.id} (attempt ${retryCount}/${job.maxRetries}) with delay: ${retryDelay}ms`,
    );

    // Update job for retry
    const retryJob = {
      ...job,
      retryCount,
      metadata: {
        ...job.metadata,
        retryAttempt: retryCount,
        lastFailedAt: new Date(),
        retryDelay,
      },
    };

    // Re-queue the job with delay (implementation depends on your queue setup)
    // This would typically involve re-publishing the message
    await this.metricsService.incrementJobCount(
      this.getQueueName(job.type),
      'retried',
    );
  }

  /**
   * Handle job completion
   */
  async handleJobCompletion(job: IQueueJob, result: any): Promise<void> {
    this.logger.log(`Job ${job.id} completed successfully`);

    // Log completion details
    const completionInfo = {
      jobId: job.id,
      jobType: job.type,
      retryCount: job.retryCount || 0,
      timestamp: new Date(),
      resultSize: JSON.stringify(result || {}).length,
    };

    this.logger.debug(
      'Job completion details:',
      JSON.stringify(completionInfo, null, 2),
    );
  }

  /**
   * Determine if job should be retried
   */
  protected shouldRetryJob(job: IQueueJob, error: Error): boolean {
    const retryCount = job.retryCount || 0;
    const maxRetries = job.maxRetries || 3;

    // Don't retry if max retries exceeded
    if (retryCount >= maxRetries) {
      return false;
    }

    // Don't retry for certain error types
    const nonRetriableErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError',
    ];

    if (
      nonRetriableErrors.some(errorType => error.message.includes(errorType))
    ) {
      return false;
    }

    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  protected calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 1 minute
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);

    return Math.min(exponentialDelay, maxDelay);
  }

  /**
   * Get queue name based on job type
   */
  protected getQueueName(jobType: string): string {
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

  /**
   * Validate job data
   */
  protected validateJob(job: IQueueJob): void {
    if (!job.id) {
      throw new Error('Job ID is required');
    }

    if (!job.type) {
      throw new Error('Job type is required');
    }

    if (!job.data) {
      throw new Error('Job data is required');
    }
  }

  /**
   * Create NACK response for message rejection
   */
  protected createNack(requeue: boolean = false): Nack {
    return new Nack(requeue);
  }
}
