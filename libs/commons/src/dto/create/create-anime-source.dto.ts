import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAnimeSourceDto {
  @IsNumber()
  media_id: number;

  @IsString()
  @MaxLength(100)
  url: string;

  @IsNumber()
  interval: number;

  @IsNumber()
  @IsOptional()
  n_status: number;

  @IsNumber()
  timeout: number;

  @IsNumber()
  max_itterate_post: number;

  @IsNumber()
  max_itterate_detail: number;

  @IsString()
  @MaxLength(5)
  lang_code: string;

  @IsString()
  @MaxLength(5)
  country_code: string;

  @IsDateString()
  @IsOptional()
  @IsNotEmpty()
  last_modified: Date;

  @IsOptional()
  @IsDateString()
  last_crawled: Date;
}
