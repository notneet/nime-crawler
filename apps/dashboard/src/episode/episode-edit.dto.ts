import { IsOptional, IsString } from 'class-validator';

export class EpisodeEditDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  streamUrl?: string;

  @IsOptional()
  @IsString()
  postedBy?: string;

  @IsOptional()
  @IsString()
  releaseInfo?: string;
}
