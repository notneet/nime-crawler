import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePostPatternDto {
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  media_id: number;

  @IsOptional()
  @IsString()
  @IsOptional()
  pattern: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  pagination_pattern: string;
}
