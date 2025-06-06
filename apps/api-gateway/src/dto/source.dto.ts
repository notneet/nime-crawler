import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SourceQueryDto {
  @ApiPropertyOptional({ description: 'Search term for source name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

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

  @ApiPropertyOptional({ default: 'name', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC', description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class SourceDto {
  @ApiProperty({ description: 'Source ID' })
  id: string;

  @ApiProperty({ description: 'Source name' })
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  slug: string;

  @ApiProperty({ description: 'Base URL of the source' })
  baseUrl: string;

  @ApiProperty({ description: 'CSS selectors configuration' })
  selectors: any;

  @ApiProperty({ description: 'HTTP headers configuration' })
  headers: any;

  @ApiProperty({ description: 'Source priority' })
  priority: number;

  @ApiProperty({ description: 'Whether source is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Delay between requests in milliseconds' })
  delayMs: number;

  @ApiPropertyOptional({ description: 'Last crawl timestamp' })
  lastCrawledAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;
}

export class SourceStatsDto {
  sourceId: string;
  sourceName: string;
  totalAnime: number;
  totalEpisodes: number;
  lastCrawledAt?: Date;
  crawlJobsToday: number;
  successfulCrawlsToday: number;
  failedCrawlsToday: number;
  averageResponseTime: number;
  healthStatus: {
    isAccessible: boolean;
    lastChecked: Date;
    successRate24h: number;
  };
}
