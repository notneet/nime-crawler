import type { Stage } from '../messaging/exchanges';
import type { PatternField } from '@hanivanrizky/nestjs-xpath-parser';
import type { WorkflowDefinition } from '@hanivanrizky/nestjs-browser-action';

export interface DiscoverRule {
  stage: Stage;
  fromKey: string; // key in parsed output holding an array of next-stage URLs
}

export interface StageConfig {
  engine: 'xpath' | 'browser';
  patterns?: PatternField[];
  workflow?: WorkflowDefinition;
  discover?: DiscoverRule[];
}

export interface SiteAdapter {
  source: string;
  baseUrl: string;
  enabled: boolean;
  stages: Partial<Record<Stage, StageConfig>>;
}
