/**
 * Message patterns for RabbitMQ microservice communication
 */
export const MESSAGE_PATTERNS = {
  CRAWL_JOB: 'crawl-job',
  READ_THREAD: 'read-thread',
  HEALTH_CHECK: 'health-check',
  BATCH_PROCESS: 'batch-process',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics',
  LINK_CHECK: 'link-check',
  // Catch-all pattern
  WILDCARD: '*',
} as const;

/**
 * Job types for crawl jobs
 */
export const CRAWL_JOB_TYPES = {
  FULL_CRAWL: 'full_crawl',
  UPDATE_CRAWL: 'update_crawl',
  HEALTH_CHECK: 'health_check',
  SINGLE_ANIME: 'single_anime',
} as const;

/**
 * Message status types
 */
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Service names for identification
 */
export const SERVICE_NAMES = {
  CRAWLER: 'crawler-microservice',
  API_GATEWAY: 'api-gateway',
  SCHEDULER: 'scheduler-service',
  ANALYTICS: 'analytics-service',
  NOTIFICATION: 'notification-service',
  LINK_CHECKER: 'link-checker-service',
  MAILER: 'mailer-service',
} as const;
