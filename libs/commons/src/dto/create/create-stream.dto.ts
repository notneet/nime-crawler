import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateStreamDto {
  @IsString()
  @IsNotEmpty()
  watch_id: string;

  @IsString()
  @MaxLength(128)
  author: string;

  @IsDateString()
  published: Date;

  @IsDateString()
  published_ts: Date;

  @IsNumber()
  num_episode: number;

  @IsString()
  object_id: string;

  @IsString()
  @IsEnum(['video', 'batch'])
  type: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(512)
  url: string;

  @IsString()
  @MaxLength(100)
  quality: string;

  @IsString()
  @MaxLength(100)
  file_size: string;

  @IsNumber()
  @IsNotEmpty()
  media_id: number;
}
