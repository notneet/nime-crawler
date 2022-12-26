import {
  IsDate,
  IsDecimal,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class Watch {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  title_jp?: string;

  @IsString()
  @IsOptional()
  title_en?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsDecimal()
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsNumber()
  @IsOptional()
  total_episode?: number;

  @IsDate()
  @IsOptional()
  published?: Date;

  @IsDate()
  @IsOptional()
  published_ts?: Date;

  @IsString()
  @IsOptional()
  season?: string;

  @IsString()
  @IsOptional()
  genres?: string;

  @IsString()
  @IsOptional()
  producers?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  created_at?: Date;

  @IsDate()
  @IsOptional()
  updated_at?: Date;

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsNumber()
  media_id: number;
}
