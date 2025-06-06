import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPositiveInt, IsRetryCount, ParseJson } from '../decorators';

export enum QueueJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

export enum QueueJobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  CRITICAL = 10,
}

export class BaseQueueJobDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsObject()
  @ParseJson()
  data: any;

  @IsOptional()
  @IsEnum(QueueJobPriority)
  priority?: QueueJobPriority = QueueJobPriority.NORMAL;

  @IsOptional()
  @IsRetryCount()
  maxRetries?: number = 3;

  @IsOptional()
  @IsRetryCount()
  retryCount?: number = 0;

  @IsOptional()
  @IsPositiveInt()
  delay?: number = 0;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @IsOptional()
  @IsObject()
  @ParseJson()
  metadata?: any;
}

export class CrawlJobDto extends BaseQueueJobDto {
  declare type: 'crawl-anime' | 'crawl-episode' | 'crawl-source';

  declare data: {
    sourceId: number;
    sourceAnimeId?: string;
    animeId?: number;
    episodeId?: number;
    url?: string;
    parameters?: any;
  };
}

export class LinkCheckJobDto extends BaseQueueJobDto {
  declare type: 'check-link' | 'health-check' | 'batch-check';

  declare data: {
    linkId?: number;
    episodeId?: number;
    urls?: string[];
    provider?: string;
  };
}

export class AnalyticsJobDto extends BaseQueueJobDto {
  declare type:
    | 'track-view'
    | 'track-download'
    | 'track-search'
    | 'aggregate-stats';

  declare data: {
    animeId?: number;
    episodeId?: number;
    userId?: string;
    sessionId?: string;
    query?: string;
    timestamp?: Date;
    metadata?: any;
  };
}

export class NotificationJobDto extends BaseQueueJobDto {
  declare type: 'discord' | 'telegram' | 'email' | 'webhook';

  declare data: {
    recipients?: string[];
    channelId?: string;
    chatId?: string;
    email?: string;
    message: string;
    title?: string;
    embeds?: any[];
    attachments?: any[];
  };
}

export class SchedulerJobDto extends BaseQueueJobDto {
  declare type:
    | 'daily-crawl'
    | 'hourly-check'
    | 'weekly-cleanup'
    | 'custom-task';

  declare data: {
    taskName: string;
    sourceIds?: number[];
    parameters?: any;
    cronExpression?: string;
  };
}

export class QueueJobResultDto {
  @IsString()
  jobId: string;

  @IsEnum(QueueJobStatus)
  status: QueueJobStatus;

  @IsOptional()
  @IsObject()
  result?: any;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date;

  @IsOptional()
  @IsNumber()
  processingTimeMs?: number;
}
