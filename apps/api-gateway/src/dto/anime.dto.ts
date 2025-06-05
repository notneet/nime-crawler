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
import { AnimeType, AnimeStatus, AnimeSeason } from '@app/common';

export class AnimeQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AnimeType)
  type?: AnimeType;

  @IsOptional()
  @IsEnum(AnimeStatus)
  status?: AnimeStatus;

  @IsOptional()
  @IsEnum(AnimeSeason)
  season?: AnimeSeason;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1900)
  @Max(2030)
  releaseYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map(s => s.trim()) : value,
  )
  genres?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sourceId?: number;

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
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class AnimeDto {
  id: number;
  title: string;
  slug: string;
  alternativeTitle?: string;
  synopsis?: string;
  posterUrl?: string;
  bannerUrl?: string;
  type: AnimeType;
  status: AnimeStatus;
  totalEpisodes?: number;
  releaseYear?: number;
  season?: AnimeSeason;
  rating?: number;
  viewCount: number;
  downloadCount: number;
  sourceId: number;
  sourceAnimeId?: string;
  sourceUrl?: string;
  lastUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  genres?: string[];
  episodes?: EpisodeDto[];
}

export class EpisodeDto {
  id: number;
  animeId: number;
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
  id: number;
  episodeId: number;
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
  totalAnime: number;
  totalEpisodes: number;
  totalDownloadLinks: number;
  activeAnime: number;
  completedAnime: number;
  ongoingAnime: number;
  totalSources: number;
  activeSources: number;
  averageRating: number;
  topGenres: Array<{
    genre: string;
    count: number;
  }>;
  recentlyAdded: AnimeDto[];
  mostPopular: AnimeDto[];
}
