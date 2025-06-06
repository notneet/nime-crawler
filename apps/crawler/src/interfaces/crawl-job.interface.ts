export interface CrawlJobData {
  sourceId: bigint;
  jobType: CrawlJobType;
  priority: number;
  parameters?: CrawlJobParameters;
  scheduledAt?: Date;
  maxRetries?: number;
}

export enum CrawlJobType {
  FULL_CRAWL = 'full_crawl',
  UPDATE_CRAWL = 'update_crawl',
  SINGLE_ANIME = 'single_anime',
  EPISODE_CRAWL = 'episode_crawl',
  HEALTH_CHECK = 'health_check',
}

export interface CrawlJobParameters {
  maxPages?: number;
  sourceUrl?: string;
  animeId?: bigint;
  episodeId?: bigint;
  forceUpdate?: boolean;
  delayMs?: number;
}

export interface CrawlJobResult {
  jobId: string;
  sourceId: bigint;
  jobType: CrawlJobType;
  status: CrawlJobStatus;
  startedAt: Date;
  completedAt?: Date;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: CrawlJobError[];
  resultSummary?: any;
}

export enum CrawlJobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export interface CrawlJobError {
  sourceAnimeId?: string;
  title?: string;
  url?: string;
  error: string;
  timestamp: Date;
}

export interface CrawlJobMessage {
  jobId: string;
  data: CrawlJobData;
  attemptCount: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor?: Date;
  headers?: {
    olderThanHours?: string;
    [key: string]: any;
  };
}
