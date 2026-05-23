import { IsOptional, IsString, IsUrl } from 'class-validator';

export class AdapterFormDto {
  @IsString()
  source!: string;

  @IsUrl({ require_protocol: true })
  baseUrl!: string;

  @IsOptional()
  @IsString()
  enabled?: string;

  @IsString()
  stages!: string;
}
