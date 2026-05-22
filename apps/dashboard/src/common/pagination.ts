export const ALLOWED_LIMITS = [10, 20, 50, 100];
export const DEFAULT_LIMIT = 10;

export interface PagerLimitOption {
  value: number;
  selected: boolean;
}

export interface PagerHidden {
  name: string;
  value: string;
}

export interface Pager {
  baseUrl: string;
  pageParam: string;
  limitParam: string;
  page: number;
  limit: number;
  total: number;
  lastPage: number;
  from: number;
  to: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevHref: string;
  nextHref: string;
  limits: PagerLimitOption[];
  hidden: PagerHidden[];
}

export interface BuildPagerInput {
  baseUrl: string;
  page: number;
  limit: number;
  total: number;
  pageParam?: string;
  limitParam?: string;
  preserved?: Record<string, string | number | undefined>;
}

export function parseLimit(raw?: string): number {
  const n = Number(raw);
  return ALLOWED_LIMITS.includes(n) ? n : DEFAULT_LIMIT;
}

export function parsePage(raw?: string): number {
  return Math.max(1, Number(raw) || 1);
}

function queryString(parts: Array<[string, string | number]>): string {
  const s = parts
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `?${s}` : '';
}

export function buildPager(input: BuildPagerInput): Pager {
  const pageParam = input.pageParam ?? 'page';
  const limitParam = input.limitParam ?? 'limit';
  const { limit, total } = input;
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(1, input.page), lastPage);

  const preserved = Object.entries(input.preserved ?? {}).filter(
    ([, v]) => v !== undefined && v !== '' && v !== null,
  ) as Array<[string, string | number]>;

  const href = (p: number): string =>
    input.baseUrl + queryString([...preserved, [limitParam, limit], [pageParam, p]]);

  return {
    baseUrl: input.baseUrl,
    pageParam,
    limitParam,
    page,
    limit,
    total,
    lastPage,
    from: total === 0 ? 0 : (page - 1) * limit + 1,
    to: Math.min(total, page * limit),
    hasPrev: page > 1,
    hasNext: page < lastPage,
    prevHref: href(page - 1),
    nextHref: href(page + 1),
    limits: ALLOWED_LIMITS.map((value) => ({ value, selected: value === limit })),
    hidden: [
      ...preserved.map(([name, value]) => ({ name, value: String(value) })),
      { name: pageParam, value: '1' },
    ],
  };
}
