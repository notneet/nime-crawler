import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SourceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

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
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class SourceDto {
  id: number;
  name: string;
  slug: string;
  baseUrl: string;
  selectors: any;
  headers: any;
  priority: number;
  isActive: boolean;
  delayMs: number;
  lastCrawledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class SourceStatsDto {
  sourceId: number;
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
