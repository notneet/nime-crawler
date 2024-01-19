import { IsOptional, IsString } from 'class-validator';

export class SearchWatchDto {
  @IsOptional()
  @IsString()
  title?: string = '';
}
