import { NodeItem, ResultType } from '@libs/commons/helper/constant';
import { PipesDto } from 'apps/api/src/pipes/dto/pipes.dto';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PatternOptionsDto {
  @IsOptional()
  @IsString()
  alt_pattern: string;

  @IsOptional()
  @IsBoolean()
  batch_in_detail: boolean;
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

  @IsObject()
  @IsOptional()
  @IsNotEmpty()
  @Type(() => PatternOptionsDto)
  @ValidateNested()
  options: PatternOptionsDto;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  @Type(() => PipesDto)
  @ValidateNested({ each: true })
  pipes: PipesDto[];
}
