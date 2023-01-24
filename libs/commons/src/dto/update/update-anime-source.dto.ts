import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAnimeSourceDto {
  @IsNumber()
  @IsOptional()
  media_id: number;

  @IsString()
  @IsOptional()
  url: string;

  @IsNumber()
  @IsOptional()
  interval: number;

  @IsNumber()
  @IsOptional()
  n_status: number;

  @IsNumber()
  @IsOptional()
  timeout: number;

  @IsNumber()
  @IsOptional()
  max_itterate_post: number;

  @IsNumber()
  @IsOptional()
  max_itterate_detail: number;

  @IsString()
  @IsOptional()
  lang_code: string;

  @IsString()
  @IsOptional()
  country_code: string;

  @IsDate()
  @IsOptional()
  last_modified: Date;

  @IsDate()
  @IsOptional()
  last_crawled: Date;
}
