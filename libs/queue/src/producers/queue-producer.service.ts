import { Injectable, Logger, Inject } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { v4 as uuidv4 } from 'uuid';
import {
  IQueueJob,
  IQueueProducer,
  QueueJobStatus,
  QueueJobPriority,
  QUEUE_NAMES,
  EXCHANGE_NAMES,
  ROUTING_KEYS,
} from '@app/common';
import { QueueMetricsService } from '../services/queue-metrics.service';

@Injectable()
export class QueueProducerService implements IQueueProducer {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly metricsService: QueueMetricsService,
    @Inject('QUEUE_OPTIONS') private readonly queueOptions: any,
  ) {}

  /**
   * Add a job to the queue
   */
  async addJob(job: IQueueJob): Promise<string> {
    try {
      // Generate unique job ID if not provided
      if (!job.id) {
        job.id = uuidv4();
      }

      // Set default values
      const jobWithDefaults = {
        ...job,
        priority: job.priority || QueueJobPriority.NORMAL,
        maxRetries: job.maxRetries || 3,
        retryCount: job.retryCount || 0,
        scheduledAt: job.scheduledAt || new Date(),
        metadata: {
          ...job.metadata,
          createdAt: new Date(),
          producedBy: 'queue-producer-service',
        },
      };

      // Determine routing key based on job type
      const routingKey = this.getRoutingKey(job.type);
      const exchange = this.getExchange(job.type);

      // Publish message to RabbitMQ
      await this.amqpConnection.publish(exchange, routingKey, jobWithDefaults, {
        persistent: true,
        priority: job.priority,
        messageId: job.id,
        timestamp: Date.now(),
        headers: {
          jobType: job.type,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
        },
      });

      // Update metrics
      await this.metricsService.incrementJobCount(
        this.getQueueName(job.type),
        'produced',
      );

      this.logger.log(`Job ${job.id} added to queue with type: ${job.type}`);
      return job.id;
    } catch (error) {
      this.logger.error(
        `Failed to add job to queue: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Add multiple jobs to the queue
   */
  async addJobs(jobs: IQueueJob[]): Promise<string[]> {
    const jobIds: string[] = [];

    try {
      for (const job of jobs) {
        const jobId = await this.addJob(job);
        jobIds.push(jobId);
      }

      this.logger.log(`Successfully added ${jobIds.length} jobs to queue`);
      return jobIds;
    } catch (error) {
      this.logger.error(
        `Failed to add multiple jobs to queue: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Schedule a job for later execution
   */
  async scheduleJob(job: IQueueJob, delay: number): Promise<string> {
    try {
      // Generate unique job ID if not provided
      if (!job.id) {
        job.id = uuidv4();
      }

      // Set scheduled execution time
      const scheduledAt = new Date(Date.now() + delay);
      const jobWithSchedule = {
        ...job,
        scheduledAt,
        delay,
        metadata: {
          ...job.metadata,
          createdAt: new Date(),
          scheduledAt,
          delayMs: delay,
          producedBy: 'queue-producer-service',
        },
      };

      // Determine routing key and exchange
      const routingKey = this.getRoutingKey(job.type);
      const exchange = this.getExchange(job.type);

      // Publish with delay
      await this.amqpConnection.publish(exchange, routingKey, jobWithSchedule, {
        persistent: true,
        priority: job.priority || QueueJobPriority.NORMAL,
        messageId: job.id,
        timestamp: Date.now(),
        headers: {
          jobType: job.type,
          scheduledAt: scheduledAt.toISOString(),
          delay,
        },
        // Use RabbitMQ delayed message plugin if available
        'x-delay': delay,
      });

      // Update metrics
      await this.metricsService.incrementJobCount(
        this.getQueueName(job.type),
        'scheduled',
      );

      this.logger.log(
        `Job ${job.id} scheduled for execution at ${scheduledAt.toISOString()}`,
      );
      return job.id;
    } catch (error) {
      this.logger.error(
        `Failed to schedule job: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Cancel a scheduled job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // Note: Canceling jobs in RabbitMQ requires additional implementation
      // This would typically involve tracking job IDs and using message TTL
      this.logger.warn(
        `Job cancellation not fully implemented for job: ${jobId}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to cancel job ${jobId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<QueueJobStatus | null> {
    try {
      // Note: Getting job status requires additional tracking implementation
      // This would typically involve Redis or database storage
      this.logger.warn(
        `Job status tracking not fully implemented for job: ${jobId}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get job status for ${jobId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Publish a high-priority job
   */
  async addHighPriorityJob(job: IQueueJob): Promise<string> {
    return this.addJob({
      ...job,
      priority: QueueJobPriority.HIGH,
    });
  }

  /**
   * Publish a critical priority job
   */
  async addCriticalJob(job: IQueueJob): Promise<string> {
    return this.addJob({
      ...job,
      priority: QueueJobPriority.CRITICAL,
    });
  }

  /**
   * Publish a message directly to a queue (simplified method for API Gateway)
   */
  async publishMessage(queueName: string, message: any): Promise<void> {
    try {
      const exchange = this.getExchangeByQueueName(queueName);
      const routingKey = this.getRoutingKeyByQueueName(queueName);

      await this.amqpConnection.publish(exchange, routingKey, message, {
        persistent: true,
        messageId: message.jobId || uuidv4(),
        timestamp: Date.now(),
        headers: {
          queueName,
          messageType: 'direct',
        },
      });

      this.logger.log(`Message published to queue: ${queueName}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish message to queue ${queueName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get routing key based on job type
   */
  private getRoutingKey(jobType: string): string {
    switch (jobType) {
      case 'crawl-anime':
      case 'crawl-episode':
      case 'crawl-source':
        return ROUTING_KEYS.CRAWL.ANIME;
      case 'check-link':
      case 'health-check':
        return ROUTING_KEYS.LINK_CHECK.VALIDATE;
      case 'track-view':
      case 'track-download':
        return ROUTING_KEYS.ANALYTICS.VIEW;
      case 'discord':
      case 'telegram':
      case 'email':
        return ROUTING_KEYS.NOTIFICATION.DISCORD;
      case 'daily-crawl':
      case 'hourly-check':
        return ROUTING_KEYS.SCHEDULER.DAILY;
      default:
        return `${jobType}.default`;
    }
  }

  /**
   * Get exchange based on job type
   */
  private getExchange(jobType: string): string {
    if (jobType.startsWith('crawl-')) {
      return EXCHANGE_NAMES.CRAWL;
    } else if (jobType.startsWith('check-') || jobType.includes('health')) {
      return EXCHANGE_NAMES.LINK_CHECK;
    } else if (jobType.startsWith('track-') || jobType.includes('analytics')) {
      return EXCHANGE_NAMES.ANALYTICS;
    } else if (['discord', 'telegram', 'email', 'webhook'].includes(jobType)) {
      return EXCHANGE_NAMES.NOTIFICATION;
    } else if (
      jobType.includes('daily') ||
      jobType.includes('hourly') ||
      jobType.includes('schedule')
    ) {
      return EXCHANGE_NAMES.SCHEDULER;
    }

    return this.queueOptions.defaultExchange || 'nime.exchange';
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

  /**
   * Get exchange by queue name
   */
  private getExchangeByQueueName(queueName: string): string {
    switch (queueName) {
      case 'crawl.queue':
        return EXCHANGE_NAMES.CRAWL;
      case 'link-check.queue':
        return EXCHANGE_NAMES.LINK_CHECK;
      case 'analytics.queue':
        return EXCHANGE_NAMES.ANALYTICS;
      case 'notification.queue':
        return EXCHANGE_NAMES.NOTIFICATION;
      case 'scheduler.queue':
        return EXCHANGE_NAMES.SCHEDULER;
      default:
        return this.queueOptions.defaultExchange || 'nime.exchange';
    }
  }

  /**
   * Get routing key by queue name
   */
  private getRoutingKeyByQueueName(queueName: string): string {
    switch (queueName) {
      case 'crawl.queue':
        return ROUTING_KEYS.CRAWL.ANIME;
      case 'link-check.queue':
        return ROUTING_KEYS.LINK_CHECK.VALIDATE;
      case 'analytics.queue':
        return ROUTING_KEYS.ANALYTICS.VIEW;
      case 'notification.queue':
        return ROUTING_KEYS.NOTIFICATION.DISCORD;
      case 'scheduler.queue':
        return ROUTING_KEYS.SCHEDULER.DAILY;
      default:
        return 'default';
    }
  }
}
