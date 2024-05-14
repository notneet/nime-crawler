import { NodeItem, ResultType } from '@libs/commons/helper/constant';
import { PipesDto } from 'apps/api/src/pipes/dto/pipes.dto';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreatePostPatternDto {
  @IsNumber()
  @IsNotEmpty()
  media_id: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty()
  @Type(() => PatternDto)
  @ValidateNested({ each: true })
  pattern: string; // save data as string

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  @Type(() => PatternDto)
  @ValidateNested({ each: true })
  pagination_pattern: string; // save data as string
}

export class PatternDto {
  @IsEnum(NodeItem)
  @IsNotEmpty()
  key: NodeItem;

  @IsString()
  @IsNotEmpty()
  pattern: string;

  @IsEnum(ResultType)
  @IsNotEmpty()
  result_type: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  @Type(() => PipesDto)
  @ValidateNested({ each: true })
  pipes: PipesDto[];
}
