import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QueueConnectionConfig {
  url: string;
  heartbeat: number;
  prefetch: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export interface QueueRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
}

export interface QueueMetricsConfig {
  enabled: boolean;
  collectInterval: number;
  retentionPeriod: number;
}

export interface QueueConfiguration {
  connection: QueueConnectionConfig;
  retry: QueueRetryConfig;
  metrics: QueueMetricsConfig;
  deadLetter: {
    enabled: boolean;
    ttl: number;
    maxLength: number;
  };
  exchanges: {
    default: string;
    deadLetter: string;
  };
  queues: {
    [key: string]: {
      durable: boolean;
      exclusive: boolean;
      autoDelete: boolean;
      messageTtl?: number;
      maxLength?: number;
    };
  };
}

@Injectable()
export class QueueConfigService {
  private readonly logger = new Logger(QueueConfigService.name);
  private readonly config: QueueConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  /**
   * Get complete queue configuration
   */
  getConfiguration(): QueueConfiguration {
    return this.config;
  }

  /**
   * Get connection configuration
   */
  getConnectionConfig(): QueueConnectionConfig {
    return this.config.connection;
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): QueueRetryConfig {
    return this.config.retry;
  }

  /**
   * Get metrics configuration
   */
  getMetricsConfig(): QueueMetricsConfig {
    return this.config.metrics;
  }

  /**
   * Get dead letter configuration
   */
  getDeadLetterConfig() {
    return this.config.deadLetter;
  }

  /**
   * Get exchange names
   */
  getExchanges() {
    return this.config.exchanges;
  }

  /**
   * Get queue configuration for specific queue
   */
  getQueueConfig(queueName: string) {
    return this.config.queues[queueName] || this.getDefaultQueueConfig();
  }

  /**
   * Get all queue configurations
   */
  getAllQueueConfigs() {
    return this.config.queues;
  }

  /**
   * Check if metrics are enabled
   */
  isMetricsEnabled(): boolean {
    return this.config.metrics.enabled;
  }

  /**
   * Check if dead letter queue is enabled
   */
  isDeadLetterEnabled(): boolean {
    return this.config.deadLetter.enabled;
  }

  /**
   * Get RabbitMQ connection URL
   */
  getRabbitMQUrl(): string {
    return this.config.connection.url;
  }

  /**
   * Get prefetch count for consumers
   */
  getPrefetchCount(): number {
    return this.config.connection.prefetch;
  }

  /**
   * Get heartbeat interval
   */
  getHeartbeat(): number {
    return this.config.connection.heartbeat;
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfiguration(): QueueConfiguration {
    return {
      connection: {
        url: this.configService.get<string>(
          'RABBITMQ_URL',
          'amqp://localhost:5672',
        ),
        heartbeat: this.configService.get<number>('QUEUE_HEARTBEAT', 60),
        prefetch: this.configService.get<number>('QUEUE_PREFETCH', 10),
        reconnectAttempts: this.configService.get<number>(
          'QUEUE_RECONNECT_ATTEMPTS',
          5,
        ),
        reconnectDelay: this.configService.get<number>(
          'QUEUE_RECONNECT_DELAY',
          5000,
        ),
      },
      retry: {
        maxRetries: this.configService.get<number>('QUEUE_MAX_RETRIES', 3),
        baseDelay: this.configService.get<number>(
          'QUEUE_RETRY_BASE_DELAY',
          1000,
        ),
        maxDelay: this.configService.get<number>(
          'QUEUE_RETRY_MAX_DELAY',
          60000,
        ),
        exponentialBase: this.configService.get<number>(
          'QUEUE_RETRY_EXPONENTIAL_BASE',
          2,
        ),
      },
      metrics: {
        enabled: this.configService.get<boolean>('QUEUE_METRICS_ENABLED', true),
        collectInterval: this.configService.get<number>(
          'QUEUE_METRICS_INTERVAL',
          30000,
        ),
        retentionPeriod: this.configService.get<number>(
          'QUEUE_METRICS_RETENTION',
          86400000,
        ), // 24 hours
      },
      deadLetter: {
        enabled: this.configService.get<boolean>('QUEUE_DLQ_ENABLED', true),
        ttl: this.configService.get<number>('QUEUE_DLQ_TTL', 604800000), // 7 days
        maxLength: this.configService.get<number>(
          'QUEUE_DLQ_MAX_LENGTH',
          10000,
        ),
      },
      exchanges: {
        default: this.configService.get<string>(
          'QUEUE_DEFAULT_EXCHANGE',
          'nime.exchange',
        ),
        deadLetter: this.configService.get<string>(
          'QUEUE_DLQ_EXCHANGE',
          'nime.dlx',
        ),
      },
      queues: {
        'crawl.queue': {
          durable: true,
          exclusive: false,
          autoDelete: false,
          messageTtl: 3600000, // 1 hour
          maxLength: 1000,
        },
        'link-check.queue': {
          durable: true,
          exclusive: false,
          autoDelete: false,
          messageTtl: 1800000, // 30 minutes
          maxLength: 500,
        },
        'analytics.queue': {
          durable: true,
          exclusive: false,
          autoDelete: false,
          messageTtl: 7200000, // 2 hours
          maxLength: 2000,
        },
        'notification.queue': {
          durable: true,
          exclusive: false,
          autoDelete: false,
          messageTtl: 1800000, // 30 minutes
          maxLength: 500,
        },
        'scheduler.queue': {
          durable: true,
          exclusive: false,
          autoDelete: false,
          messageTtl: 86400000, // 24 hours
          maxLength: 100,
        },
        'dead-letter.queue': {
          durable: true,
          exclusive: false,
          autoDelete: false,
          messageTtl: this.configService.get<number>(
            'QUEUE_DLQ_TTL',
            604800000,
          ),
          maxLength: this.configService.get<number>(
            'QUEUE_DLQ_MAX_LENGTH',
            10000,
          ),
        },
      },
    };
  }

  /**
   * Get default queue configuration
   */
  private getDefaultQueueConfig() {
    return {
      durable: true,
      exclusive: false,
      autoDelete: false,
      messageTtl: 3600000, // 1 hour
      maxLength: 1000,
    };
  }

  /**
   * Validate configuration values
   */
  private validateConfiguration(): void {
    const { connection, retry, metrics, deadLetter } = this.config;

    // Validate connection config
    if (!connection.url) {
      throw new Error('RabbitMQ URL is required');
    }

    if (connection.heartbeat < 0) {
      throw new Error('Heartbeat must be a positive number');
    }

    if (connection.prefetch < 1) {
      throw new Error('Prefetch count must be at least 1');
    }

    if (connection.reconnectAttempts < 0) {
      throw new Error('Reconnect attempts must be a positive number');
    }

    if (connection.reconnectDelay < 0) {
      throw new Error('Reconnect delay must be a positive number');
    }

    // Validate retry config
    if (retry.maxRetries < 0) {
      throw new Error('Max retries must be a positive number');
    }

    if (retry.baseDelay < 0) {
      throw new Error('Base delay must be a positive number');
    }

    if (retry.maxDelay < retry.baseDelay) {
      throw new Error('Max delay must be greater than or equal to base delay');
    }

    if (retry.exponentialBase < 1) {
      throw new Error('Exponential base must be at least 1');
    }

    // Validate metrics config
    if (metrics.collectInterval < 1000) {
      throw new Error('Metrics collect interval must be at least 1000ms');
    }

    if (metrics.retentionPeriod < 60000) {
      throw new Error('Metrics retention period must be at least 60000ms');
    }

    // Validate dead letter config
    if (deadLetter.ttl < 0) {
      throw new Error('Dead letter TTL must be a positive number');
    }

    if (deadLetter.maxLength < 1) {
      throw new Error('Dead letter max length must be at least 1');
    }

    this.logger.log('Queue configuration validated successfully');
  }

  /**
   * Log current configuration (without sensitive data)
   */
  logConfiguration(): void {
    const sanitizedConfig = {
      ...this.config,
      connection: {
        ...this.config.connection,
        url: this.config.connection.url.replace(/\/\/.*@/, '//***:***@'),
      },
    };

    this.logger.log('Queue Configuration:');
    this.logger.log(JSON.stringify(sanitizedConfig, null, 2));
  }

  /**
   * Update configuration at runtime (for specific values)
   */
  updateConfig(updates: Partial<QueueConfiguration>): void {
    Object.assign(this.config, updates);
    this.validateConfiguration();
    this.logger.log('Queue configuration updated');
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): any {
    const env = this.configService.get<string>('NODE_ENV', 'development');

    const environmentConfigs = {
      development: {
        connection: { prefetch: 1 },
        metrics: { collectInterval: 10000 },
        deadLetter: { maxLength: 100 },
      },
      test: {
        connection: { prefetch: 1 },
        metrics: { enabled: false },
        deadLetter: { enabled: false },
      },
      production: {
        connection: { prefetch: 50 },
        metrics: { collectInterval: 60000 },
        deadLetter: { maxLength: 50000 },
      },
    };

    return environmentConfigs[env] || environmentConfigs.development;
  }
}
