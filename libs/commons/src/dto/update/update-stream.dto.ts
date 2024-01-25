import {
  IsDateString,
  IsOptional,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateStreamDto {
  @IsString()
  @IsOptional()
  watch_id: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  author: string;

  @IsDateString()
  @IsOptional()
  published: Date;

  @IsDateString()
  @IsOptional()
  published_ts: Date;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  url: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  quality: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  file_size: string;

  @IsNumber()
  @IsOptional()
  media_id: number;
}
