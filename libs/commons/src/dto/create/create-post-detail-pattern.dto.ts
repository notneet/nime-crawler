import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreatePostDetailPatternDto {
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
  episode_pattern: string;
}
