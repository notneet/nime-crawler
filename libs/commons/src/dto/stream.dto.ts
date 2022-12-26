import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class Stream {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  watch_id: number;

  @IsString()
  @IsOptional()
  author?: string;

  @IsDate()
  @IsOptional()
  published?: Date;

  @IsDate()
  @IsOptional()
  published_ts?: Date;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  quality?: string;

  @IsString()
  @IsOptional()
  file_size?: string;

  @IsNumber()
  media_id: number;

  @IsDate()
  @IsOptional()
  created_at?: Date;

  @IsDate()
  @IsOptional()
  updated_at?: Date;
}
