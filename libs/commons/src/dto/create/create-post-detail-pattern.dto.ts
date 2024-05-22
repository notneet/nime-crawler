import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { PatternDto } from './patern.dto';

export class CreatePostDetailPatternDto {
  @IsNumber()
  @IsNotEmpty()
  media_id: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  @Type(() => PatternDto)
  @ValidateNested({ each: true })
  pattern: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  @Type(() => PatternDto)
  @ValidateNested({ each: true })
  pagination_pattern: string;
}
