import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SearchWatchDto {
  @IsOptional()
  @IsString()
  title?: string = '';

  @Transform(({ value }) => String(value) === 'true')
  @IsOptional()
  @IsBoolean()
  random?: boolean = false;
}
