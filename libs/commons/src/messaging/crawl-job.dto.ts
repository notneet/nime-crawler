import { IsIn, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import { STAGES } from './exchanges';
import type { Stage } from './exchanges';

export class CrawlJobDto {
  @IsString()
  source!: string;

  @IsIn(STAGES as unknown as string[])
  stage!: Stage;

  @IsUrl({ require_protocol: true })
  url!: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
