import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnimeType, AnimeStatus, AnimeSeason } from '@app/common';

export class AnimeQueryDto {
  @ApiPropertyOptional({ description: 'Search term for anime title or alternative title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AnimeType, description: 'Anime type filter' })
  @IsOptional()
  @IsEnum(AnimeType)
  type?: AnimeType;

  @ApiPropertyOptional({ enum: AnimeStatus, description: 'Anime status filter' })
  @IsOptional()
  @IsEnum(AnimeStatus)
  status?: AnimeStatus;

  @ApiPropertyOptional({ enum: AnimeSeason, description: 'Anime season filter' })
  @IsOptional()
  @IsEnum(AnimeSeason)
  season?: AnimeSeason;

  @ApiPropertyOptional({ minimum: 1900, maximum: 2030, description: 'Release year filter' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1900)
  @Max(2030)
  releaseYear?: number;

  @ApiPropertyOptional({ type: [String], description: 'Genre filters (comma-separated)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map(s => s.trim()) : value,
  )
  genres?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 10, description: 'Minimum rating filter' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Source ID filter' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sourceId?: number;

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

  @ApiPropertyOptional({ default: 'created_at', description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC', description: 'Sort order' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class AnimeDto {
  @ApiProperty({ description: 'Anime ID' })
  id: string;

  @ApiProperty({ description: 'Anime title' })
  title: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Alternative title' })
  alternativeTitle?: string;

  @ApiPropertyOptional({ description: 'Anime synopsis' })
  synopsis?: string;

  @ApiPropertyOptional({ description: 'Poster image URL' })
  posterUrl?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  bannerUrl?: string;

  @ApiProperty({ enum: AnimeType, description: 'Anime type' })
  type: AnimeType;

  @ApiProperty({ enum: AnimeStatus, description: 'Anime status' })
  status: AnimeStatus;

  @ApiPropertyOptional({ description: 'Total number of episodes' })
  totalEpisodes?: number;

  @ApiPropertyOptional({ description: 'Release year' })
  releaseYear?: number;

  @ApiPropertyOptional({ enum: AnimeSeason, description: 'Release season' })
  season?: AnimeSeason;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, description: 'Rating out of 10' })
  rating?: number;

  @ApiProperty({ description: 'View count' })
  viewCount: number;

  @ApiProperty({ description: 'Download count' })
  downloadCount: number;

  @ApiProperty({ description: 'Source ID' })
  sourceId: string;

  @ApiPropertyOptional({ description: 'Source-specific anime ID' })
  sourceAnimeId?: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  lastUpdatedAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [String], description: 'Anime genres' })
  genres?: string[];

  @ApiPropertyOptional({ description: 'Anime episodes' })
  episodes?: EpisodeDto[];
}

export class EpisodeDto {
  id: string;
  animeId: string;
  episodeNumber: number;
  title?: string;
  sourceEpisodeId?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  durationSeconds?: number;
  airDate?: Date;
  viewCount: number;
  downloadCount: number;
  isAvailable: boolean;
  lastCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  downloadLinks?: DownloadLinkDto[];
}

export class DownloadLinkDto {
  id: string;
  episodeId: string;
  provider: string;
  url: string;
  quality: string;
  format: string;
  fileSizeBytes?: number;
  isActive: boolean;
  lastCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AnimeStatsDto {
  @ApiProperty({ description: 'Total number of anime' })
  totalAnime: number;

  @ApiProperty({ description: 'Total number of episodes' })
  totalEpisodes: number;

  @ApiProperty({ description: 'Total number of download links' })
  totalDownloadLinks: number;

  @ApiProperty({ description: 'Number of active anime' })
  activeAnime: number;

  @ApiProperty({ description: 'Number of completed anime' })
  completedAnime: number;

  @ApiProperty({ description: 'Number of ongoing anime' })
  ongoingAnime: number;

  @ApiProperty({ description: 'Total number of sources' })
  totalSources: number;

  @ApiProperty({ description: 'Number of active sources' })
  activeSources: number;

  @ApiProperty({ description: 'Average anime rating' })
  averageRating: number;

  @ApiProperty({ description: 'Top genres with counts' })
  topGenres: Array<{
    genre: string;
    count: number;
  }>;

  @ApiProperty({ type: [AnimeDto], description: 'Recently added anime' })
  recentlyAdded: AnimeDto[];

  @ApiProperty({ type: [AnimeDto], description: 'Most popular anime' })
  mostPopular: AnimeDto[];
}
