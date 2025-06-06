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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrawlJobType, CrawlJobStatus } from '@app/common';

export class ScheduleCrawlJobDto {
  @ApiProperty({ description: 'Source ID to crawl' })
  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 5, description: 'Maximum pages to crawl' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  maxPages?: number = 5;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, default: 1, description: 'Job priority (1-10)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  priority?: number = 1;
}

export class CrawlJobQueryDto {
  @ApiPropertyOptional({ description: 'Filter by source ID' })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ enum: CrawlJobType, description: 'Filter by job type' })
  @IsOptional()
  @IsEnum(CrawlJobType)
  jobType?: CrawlJobType;

  @ApiPropertyOptional({ enum: CrawlJobStatus, description: 'Filter by job status' })
  @IsOptional()
  @IsEnum(CrawlJobStatus)
  status?: CrawlJobStatus;

  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'createdAt', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC', description: 'Sort order' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Filter jobs created after this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter jobs created before this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CrawlJobStatusDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  sourceId: string;

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
  @IsString()
  sourceId: string;

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
