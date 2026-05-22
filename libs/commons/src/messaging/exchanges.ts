export const EXCHANGES = {
  crawl: 'anime.crawl',
  parsed: 'anime.parsed',
  results: 'anime.results',
  dlx: 'anime.crawl.dlx',
} as const;

export const STAGES = ['index', 'detail', 'episode', 'batch'] as const;
export type Stage = (typeof STAGES)[number];

export type RoutingPrefix = 'crawl' | 'parsed' | 'result';

export function routingKey(prefix: RoutingPrefix, stage: Stage, site: string): string {
  return `${prefix}.${stage}.${site}`;
}

export function parseRoutingKey(key: string): {
  prefix: RoutingPrefix;
  stage: Stage;
  site: string;
} {
  const [prefix, stage, site] = key.split('.');
  return { prefix: prefix as RoutingPrefix, stage: stage as Stage, site };
}
