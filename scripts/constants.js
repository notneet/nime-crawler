/**
 * Constants for test scripts
 * Keep in sync with libs/common/src/constants/message-patterns.constants.ts
 */

const MESSAGE_PATTERNS = {
  CRAWL_JOB: 'crawl-job',
  READ_THREAD: 'read-thread',
  HEALTH_CHECK: 'health-check',
  BATCH_PROCESS: 'batch-process',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics',
  LINK_CHECK: 'link-check',
  WILDCARD: '*',
};

const CRAWL_JOB_TYPES = {
  FULL_CRAWL: 'full_crawl',
  UPDATE_CRAWL: 'update_crawl',
  HEALTH_CHECK: 'health_check',
  SINGLE_ANIME: 'single_anime',
};

const MESSAGE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const SERVICE_NAMES = {
  CRAWLER: 'crawler-microservice',
  API_GATEWAY: 'api-gateway',
  SCHEDULER: 'scheduler-service',
  ANALYTICS: 'analytics-service',
  NOTIFICATION: 'notification-service',
  LINK_CHECKER: 'link-checker-service',
  MAILER: 'mailer-service',
};

module.exports = {
  MESSAGE_PATTERNS,
  CRAWL_JOB_TYPES,
  MESSAGE_STATUS,
  SERVICE_NAMES,
};