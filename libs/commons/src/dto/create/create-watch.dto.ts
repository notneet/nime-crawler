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
  title: string | null | undefined;

  @IsString()
  @MaxLength(128)
  title_jp: string | null | undefined;

  @IsString()
  @MaxLength(128)
  title_en: string | null | undefined;

  @IsString()
  @MaxLength(10)
  type: string | null | undefined;

  @IsDecimal()
  score: number | null | undefined;

  @IsString()
  @MaxLength(10)
  status: string | null | undefined;

  @IsNumber()
  @IsPositive()
  duration: number | null | undefined;

  @IsNumber()
  @IsPositive()
  total_episode: number | null | undefined;

  @IsDateString()
  published: Date | null | undefined;

  @IsDateString()
  published_ts: Date | null | undefined;

  @IsString()
  @MaxLength(100)
  season: string | null | undefined;

  @IsString()
  @MaxLength(128)
  genres: string | null | undefined;

  @IsString()
  @MaxLength(128)
  producers: string | null | undefined;

  @IsString()
  description: string | null | undefined;

  @IsString()
  cover_url: string | null | undefined;

  @IsNumber()
  media_id: number;

  @IsString()
  object_id: string | null | undefined;

  @IsNumber()
  n_status: number | null | undefined;
}
