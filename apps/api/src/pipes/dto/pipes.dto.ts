import { CleanerType } from '@libs/commons/schemas/cleaner-type';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PipesDto {
  @IsEnum(CleanerType)
  @IsNotEmpty()
  type: CleanerType;

  @IsString()
  @IsNotEmpty()
  regex: string;

  @IsString()
  @IsOptional()
  to: string;

  @IsEnum(['g', 'm', 'gm', 'mg'])
  scope: string;
}
