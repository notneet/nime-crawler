import { CRAWL_JOB_TYPES, MESSAGE_STATUS } from '@app/common/constants';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class BaseMessageDto {
  @IsUUID()
  jobID: string;
}

export class ReadThreadDto extends BaseMessageDto {
  @IsString()
  endPoint: string;

  @IsOptional()
  @IsObject()
  parameters?: any;
}

export class CrawlJobDto extends BaseMessageDto {
  @IsString()
  @IsIn(Object.values(CRAWL_JOB_TYPES))
  jobType: (typeof CRAWL_JOB_TYPES)[keyof typeof CRAWL_JOB_TYPES];

  @IsString()
  sourceId: string;

  @IsOptional()
  @IsObject()
  parameters?: {
    maxPages?: number;
    olderThanHours?: number;
    animeId?: string;
  };
}

export class CrawlJobDataDto {
  @IsString()
  sourceId: string;

  @IsString()
  @IsIn(Object.values(CRAWL_JOB_TYPES))
  jobType: string;

  @IsNumber()
  priority: number;

  @IsOptional()
  @IsObject()
  parameters?: {
    maxPages?: number;
    olderThanHours?: number;
    animeId?: string;
  };

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export class CrawlJobMessageDto {
  @IsString()
  jobId: string;

  @IsObject()
  data: CrawlJobDataDto;

  @IsOptional()
  @IsNumber()
  attemptCount?: number;

  @IsOptional()
  @IsNumber()
  maxAttempts?: number;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  scheduledFor?: string;

  @IsOptional()
  @IsObject()
  headers?: {
    olderThanHours?: string;
    [key: string]: any;
  };
}

export class HealthCheckDto {
  @IsOptional()
  @IsString()
  service?: string;
}

export class MessageResponseDto {
  @IsUUID()
  jobID: string;

  @IsString()
  @IsIn(Object.values(MESSAGE_STATUS))
  status: (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

  @IsString()
  timestamp: string;

  @IsOptional()
  @IsObject()
  result?: any;

  @IsOptional()
  @IsString()
  error?: string;
}
