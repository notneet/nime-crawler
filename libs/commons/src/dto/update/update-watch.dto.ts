import {
  IsDateString,
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateWatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @IsOptional()
  url: string;

  @IsString()
  @MaxLength(128)
  @IsOptional()
  title: string;

  @IsString()
  @MaxLength(128)
  @IsOptional()
  title_jp: string;

  @IsString()
  @MaxLength(128)
  @IsOptional()
  title_en: string;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  type: string;

  @IsDecimal()
  @IsPositive()
  @IsOptional()
  score: number;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  status: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  duration: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  total_episode: number;

  @IsDateString()
  @IsOptional()
  published: Date;

  @IsDateString()
  @IsOptional()
  published_ts: Date;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  season: string;

  @IsString()
  @MaxLength(128)
  @IsOptional()
  genres: string;

  @IsString()
  @MaxLength(128)
  @IsOptional()
  producers: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  cover_url: string;

  @IsNumber()
  @IsOptional()
  media_id: number;
}
