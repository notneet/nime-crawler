/**
 * Queue names for RabbitMQ
 */
export const QUEUE_NAMES = {
  CRAWL: 'crawl.queue',
  SCHEDULER: 'scheduler.queue',
  LINK_CHECK: 'link-check.queue',
  ANALYTICS: 'analytics.queue',
  NOTIFICATION: 'notification.queue',
  DEAD_LETTER: 'dead-letter.queue',
} as const;

/**
 * Exchange names for RabbitMQ
 */
export const EXCHANGE_NAMES = {
  CRAWL: 'crawl.exchange',
  SCHEDULER: 'scheduler.exchange',
  LINK_CHECK: 'link-check.exchange',
  ANALYTICS: 'analytics.exchange',
  NOTIFICATION: 'notification.exchange',
  DEAD_LETTER: 'dead-letter.exchange',
} as const;

/**
 * Routing keys for RabbitMQ
 */
export const ROUTING_KEYS = {
  CRAWL: {
    ANIME: 'crawl.anime',
    EPISODE: 'crawl.episode',
    SOURCE: 'crawl.source',
    RETRY: 'crawl.retry',
  },
  SCHEDULER: {
    DAILY: 'scheduler.daily',
    HOURLY: 'scheduler.hourly',
    WEEKLY: 'scheduler.weekly',
    CUSTOM: 'scheduler.custom',
  },
  LINK_CHECK: {
    VALIDATE: 'link-check.validate',
    HEALTH: 'link-check.health',
    BATCH: 'link-check.batch',
  },
  ANALYTICS: {
    VIEW: 'analytics.view',
    DOWNLOAD: 'analytics.download',
    SEARCH: 'analytics.search',
    AGGREGATE: 'analytics.aggregate',
  },
  NOTIFICATION: {
    DISCORD: 'notification.discord',
    TELEGRAM: 'notification.telegram',
    EMAIL: 'notification.email',
    WEBHOOK: 'notification.webhook',
  },
} as const;

/**
 * Queue configuration options
 */
export const QUEUE_OPTIONS = {
  DURABLE: true,
  AUTO_DELETE: false,
  EXCLUSIVE: false,
  ARGUMENTS: {
    'x-message-ttl': 1800000, // 30 minutes
    'x-max-retries': 3,
    'x-retry-delay': 5000, // 5 seconds
  },
} as const;

/**
 * Dead letter queue configuration
 */
export const DLQ_OPTIONS = {
  DURABLE: true,
  AUTO_DELETE: false,
  EXCLUSIVE: false,
  ARGUMENTS: {
    'x-message-ttl': 86400000, // 24 hours
    'x-max-length': 1000,
    'x-overflow': 'reject-publish',
  },
} as const;