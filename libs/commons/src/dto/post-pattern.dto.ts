import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class PostPattern {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsNotEmpty()
  media_id: number;

  @IsArray()
  @IsOptional()
  pattern?: string;

  @IsArray()
  @IsOptional()
  pagination_pattern?: string;

  @IsNumber()
  @IsNotEmpty()
  n_status: number;

  @IsDate()
  @IsOptional()
  created_at?: Date;

  @IsDate()
  @IsOptional()
  updated_at?: Date;
}
