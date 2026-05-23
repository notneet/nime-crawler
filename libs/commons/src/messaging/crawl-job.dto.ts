import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { STAGES } from './exchanges';
import type { Stage } from './exchanges';
import type { SiteAdapter, StageConfig } from '../adapters/site-adapter.types';

// The full adapter snapshot carried in every crawl job. Top-level fields are
// validated; the deeply-nested stages content is trusted (the dashboard
// validates structure on write) and only shape-checked as an object.
export class AdapterSnapshotDto implements SiteAdapter {
  @IsString()
  source!: string;

  @IsUrl({ require_protocol: true })
  baseUrl!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsObject()
  stages!: Partial<Record<Stage, StageConfig>>;
}

export class CrawlJobDto {
  @IsString()
  source!: string;

  @IsIn(STAGES as unknown as string[])
  stage!: Stage;

  @IsUrl({ require_protocol: true })
  url!: string;

  // Full adapter snapshot — the worker reads this instead of a registry.
  @IsObject()
  @ValidateNested()
  @Type(() => AdapterSnapshotDto)
  adapter!: AdapterSnapshotDto;

  // Bypass the worker's freshness skip-check and force a re-fetch (manual re-crawl).
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  // Publish this stage only: the worker parses and stores it but skips the
  // discover cascade (no next-stage jobs are published).
  @IsOptional()
  @IsBoolean()
  noDiscover?: boolean;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
