import {
  IsDateString,
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  url: string;

  @IsString()
  @MaxLength(128)
  title: string;

  @IsString()
  @MaxLength(128)
  title_jp: string;

  @IsString()
  @MaxLength(128)
  title_en: string;

  @IsString()
  @MaxLength(10)
  type: string;

  @IsDecimal()
  score: number;

  @IsString()
  @MaxLength(10)
  status: string;

  @IsNumber()
  @IsPositive()
  duration: number;

  @IsNumber()
  @IsPositive()
  total_episode: number;

  @IsDateString()
  published: Date;

  @IsDateString()
  published_ts: Date;

  @IsString()
  @MaxLength(100)
  season: string;

  @IsString()
  @MaxLength(128)
  genres: string;

  @IsString()
  @MaxLength(128)
  producers: string;

  @IsString()
  description: string;

  @IsString()
  cover_url: string;

  @IsNumber()
  media_id: number;
}
