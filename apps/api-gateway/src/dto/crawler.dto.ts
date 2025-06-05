import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CrawlJobType, CrawlJobStatus } from '@app/common';

export class ScheduleCrawlJobDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  sourceId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  maxPages?: number = 5;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  priority?: number = 1;
}

export class CrawlJobQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sourceId?: number;

  @IsOptional()
  @IsEnum(CrawlJobType)
  jobType?: CrawlJobType;

  @IsOptional()
  @IsEnum(CrawlJobStatus)
  status?: CrawlJobStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CrawlJobStatusDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsNumber()
  sourceId: number;

  @IsEnum(CrawlJobType)
  jobType: CrawlJobType;

  @IsEnum(CrawlJobStatus)
  status: CrawlJobStatus;

  @IsNumber()
  priority: number;

  @IsOptional()
  scheduledAt?: Date;

  @IsOptional()
  startedAt?: Date;

  @IsOptional()
  completedAt?: Date;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  resultSummary?: any;

  @IsNumber()
  retryCount: number;

  @IsNumber()
  maxRetries: number;

  createdAt: Date;
  updatedAt: Date;
}

export class SourceHealthDto {
  @IsNumber()
  sourceId: number;

  @IsString()
  sourceName: string;

  @IsString()
  sourceUrl: string;

  isAccessible: boolean;

  @IsOptional()
  @IsNumber()
  responseTimeMs?: number;

  @IsOptional()
  @IsNumber()
  httpStatusCode?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsNumber()
  successRate24h?: number;

  lastCheckedAt: Date;
}
