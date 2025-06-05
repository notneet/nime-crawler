import { QueueJobStatus, QueueJobPriority } from '../dto/queue.dto';

/**
 * Base interface for queue jobs
 */
export interface IQueueJob {
  id: string;
  type: string;
  data: any;
  priority?: QueueJobPriority;
  maxRetries?: number;
  retryCount?: number;
  delay?: number;
  scheduledAt?: Date;
  metadata?: any;
}

/**
 * Interface for queue job result
 */
export interface IQueueJobResult {
  jobId: string;
  status: QueueJobStatus;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}

/**
 * Interface for queue producer
 */
export interface IQueueProducer {
  /**
   * Add a job to the queue
   */
  addJob(job: IQueueJob): Promise<string>;

  /**
   * Add multiple jobs to the queue
   */
  addJobs(jobs: IQueueJob[]): Promise<string[]>;

  /**
   * Schedule a job for later execution
   */
  scheduleJob(job: IQueueJob, delay: number): Promise<string>;

  /**
   * Cancel a scheduled job
   */
  cancelJob(jobId: string): Promise<boolean>;

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Promise<QueueJobStatus | null>;
}

/**
 * Interface for queue consumer
 */
export interface IQueueConsumer {
  /**
   * Process a job
   */
  processJob(job: IQueueJob): Promise<IQueueJobResult>;

  /**
   * Handle job failure
   */
  handleJobFailure(job: IQueueJob, error: Error): Promise<void>;

  /**
   * Handle job retry
   */
  handleJobRetry(job: IQueueJob): Promise<void>;

  /**
   * Handle job completion
   */
  handleJobCompletion(job: IQueueJob, result: any): Promise<void>;
}

/**
 * Interface for queue configuration
 */
export interface IQueueConfig {
  name: string;
  exchange?: string;
  routingKey?: string;
  durable?: boolean;
  autoDelete?: boolean;
  exclusive?: boolean;
  arguments?: Record<string, any>;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  messageTtl?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Interface for queue metrics
 */
export interface IQueueMetrics {
  queueName: string;
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
}

/**
 * Interface for dead letter queue handler
 */
export interface IDeadLetterQueueHandler {
  /**
   * Handle dead letter message
   */
  handleDeadLetter(job: IQueueJob, error: Error): Promise<void>;

  /**
   * Requeue dead letter message
   */
  requeueDeadLetter(jobId: string): Promise<boolean>;

  /**
   * Get dead letter messages
   */
  getDeadLetters(limit?: number): Promise<IQueueJob[]>;

  /**
   * Clear dead letter queue
   */
  clearDeadLetters(): Promise<number>;
}