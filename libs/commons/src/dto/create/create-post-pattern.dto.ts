import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreatePostPatternDto {
  @IsNumber()
  @IsNotEmpty()
  media_id: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  pattern: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  pagination_pattern: string;
}
