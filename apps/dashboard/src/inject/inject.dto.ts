import { IsNotEmpty, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import type { StageConfig } from '@libs/commons/adapters/site-adapter.types';

export class InjectDto {
  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsString()
  @IsNotEmpty()
  stage!: string;

  @IsUrl({ require_protocol: true })
  url!: string;
}

export class TestConfigDto {
  @IsObject()
  config!: StageConfig;

  @IsUrl({ require_protocol: true })
  url!: string;

  @IsUrl({ require_protocol: true })
  baseUrl!: string;

  @IsOptional()
  @IsString()
  stage?: string;
}
