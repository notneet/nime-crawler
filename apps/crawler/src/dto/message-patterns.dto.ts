import { CRAWL_JOB_TYPES, MESSAGE_STATUS } from '@app/common/constants';
import { Type } from 'class-transformer';
import {
  IsDate,
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

  @IsNumber()
  sourceId: bigint;

  @IsOptional()
  @IsObject()
  parameters?: {
    maxPages?: number;
    olderThanHours?: number;
    animeId?: bigint;
  };
}

export class CrawlJobMessageDto {
  @IsString()
  jobId: string;

  @IsObject()
  data: {
    sourceId: bigint;
    jobType: (typeof CRAWL_JOB_TYPES)[keyof typeof CRAWL_JOB_TYPES];
    priority: number;
    parameters?: {
      maxPages?: number;
      olderThanHours?: number;
      animeId?: bigint;
    };
    scheduledAt?: Date;
    maxRetries?: number;
  };

  @IsNumber()
  attemptCount: number;

  @IsNumber()
  maxAttempts: number;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledFor?: Date;

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
