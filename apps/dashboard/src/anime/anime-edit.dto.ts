import { IsOptional, IsString } from 'class-validator';

export class AnimeEditDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleJP?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  score?: string;

  @IsOptional()
  @IsString()
  studio?: string;

  @IsOptional()
  @IsString()
  totalEpisodes?: string;

  @IsOptional()
  @IsString()
  synopsis?: string;
}
