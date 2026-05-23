export function parseQualityRank(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /(\d{3,4})\s*p?/i.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function pickMaxMin<T>(rows: readonly T[], rank: (t: T) => number | null): T[] {
  const ranked = rows
    .map((row) => ({ row, rank: rank(row) }))
    .filter((x): x is { row: T; rank: number } => x.rank !== null);
  if (ranked.length === 0) return [];
  let hi = ranked[0];
  let lo = ranked[0];
  for (const r of ranked) {
    if (r.rank > hi.rank) hi = r;
    if (r.rank < lo.rank) lo = r;
  }
  return hi.row === lo.row ? [hi.row] : [hi.row, lo.row];
}
