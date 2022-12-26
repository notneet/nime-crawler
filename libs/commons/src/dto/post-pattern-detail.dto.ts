import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PatternPostDetail {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsNotEmpty()
  media_id: number;

  @IsString()
  @IsOptional()
  pattern?: string;

  @IsNumber()
  @IsNotEmpty()
  n_status: number;

  @IsDate()
  @IsOptional()
  created_at?: Date;

  @IsDate()
  @IsOptional()
  updated_at?: Date;

  @IsString()
  @IsOptional()
  episode_pattern?: string;
}
