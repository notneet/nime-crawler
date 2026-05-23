export const ROW_CAP = 50;

export function isUrl(s) { return typeof s === 'string' && /^https?:\/\//i.test(s); }

export function isImageUrl(k, v) {
  if (!isUrl(v)) return false;
  return /(thumb|image|cover|photo|poster|img)/i.test(k) || /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(v);
}

export function isObjRows(v) {
  return Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === 'object' && !Array.isArray(x));
}

export function isDownloadRows(rows) {
  return Array.isArray(rows) && rows.length > 0 && rows.every((r) => r && Array.isArray(r.links) && Array.isArray(r.hosts));
}

export function explodeDownloads(rows) {
  const out = [];
  for (const r of rows) {
    const n = Math.max(r.links.length, r.hosts.length);
    for (let i = 0; i < n; i++) out.push({ quality: r.quality, host: r.hosts[i], size: r.size, url: r.links[i] });
  }
  return out;
}

function arrayCase(result) {
  const keys = Object.keys(result);
  if (keys.length === 1) {
    const v = result[keys[0]];
    if (isObjRows(v)) return { key: keys[0], rows: v };
  }
  return null;
}

function linkArrayCase(result) {
  const keys = Object.keys(result);
  if (keys.length === 1) {
    const v = result[keys[0]];
    if (Array.isArray(v) && v.length && v.every((x) => x == null || typeof x !== 'object')) return { key: keys[0], arr: v };
  }
  return null;
}

function rowsVm(wrapKey, rows) {
  const shown = rows.slice(0, ROW_CAP);
  const cols = [];
  const seen = {};
  for (const r of shown) for (const k of Object.keys(r)) if (!seen[k]) { seen[k] = 1; cols.push(k); }
  return { kind: 'rows', wrapKey, cols, rows: shown, total: rows.length };
}

export function classify(result) {
  const r = result || {};
  const ac = arrayCase(r);
  if (ac && isDownloadRows(ac.rows)) {
    const ex = explodeDownloads(ac.rows);
    return { kind: 'downloads', wrapKey: ac.key, rows: ex.slice(0, ROW_CAP), total: ex.length };
  }
  if (ac) return rowsVm(ac.key, ac.rows);
  const lc = linkArrayCase(r);
  if (lc) return { kind: 'links', wrapKey: lc.key, items: lc.arr.slice(0, ROW_CAP), all: lc.arr, total: lc.arr.length };
  return { kind: 'fields', fields: Object.keys(r).map((k) => ({ key: k, value: r[k] })) };
}
