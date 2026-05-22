import { CrawlJobDto } from '../messaging/crawl-job.dto';
import { ParsedResultDto } from '../messaging/parsed-result.dto';
import type { Stage } from '../messaging/exchanges';
import { SiteAdapter } from '../adapters/site-adapter.types';

export function buildNextJobs(
  adapter: SiteAdapter,
  stage: Stage,
  parsed: Record<string, unknown>,
): CrawlJobDto[] {
  const rules = adapter.stages[stage]?.discover ?? [];
  const seen = new Set<string>();
  const jobs: CrawlJobDto[] = [];

  for (const rule of rules) {
    const raw = parsed[rule.fromKey];
    if (!Array.isArray(raw)) continue;
    for (const item of raw) {
      if (typeof item !== 'string' || !item.trim()) continue;
      const url = new URL(item.trim(), adapter.baseUrl).toString();
      const dedupeKey = `${rule.stage}|${url}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      jobs.push({ source: adapter.source, stage: rule.stage, url });
    }
  }
  return jobs;
}

export function buildParsedResult(
  source: string,
  stage: Stage,
  url: string,
  data: Record<string, unknown>,
): ParsedResultDto {
  return { source, stage, url, data };
}
