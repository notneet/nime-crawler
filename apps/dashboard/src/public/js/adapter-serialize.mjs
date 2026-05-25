export const STAGE_KEYS = ['index', 'detail', 'episode', 'batch'];
export const ACTION_TYPES = ['navigate', 'wait', 'waitFor', 'click', 'type', 'select', 'scroll', 'extract',
  'screenshot', 'evaluate', 'cleanse', 'saveCookies', 'loadCookies', 'clearCookies', 'listCookies',
  'hover', 'keyPress', 'clear', 'waitForNetwork', 'reload'];
export const CUSTOM_TYPES = ['regex', 'num-normalize', 'parse-as-url', 'extract-email', 'date-format', 'url-resolve'];

const clone = (o) => JSON.parse(JSON.stringify(o));
const stripUi = (o) => {
  const c = { ...o };
  for (const k of Object.keys(c)) if (k.startsWith('__')) delete c[k];
  return c;
};
const str = (v) => (v == null ? '' : String(v));

function numOrDel(o, k) {
  const v = o[k];
  if (v === '' || v == null) { delete o[k]; return; }
  const n = typeof v === 'number' ? v : Number(str(v).trim());
  if (Number.isNaN(n) || str(v).trim() === '') delete o[k];
  else o[k] = n;
}

export function cleanAction(a0) {
  const a = stripUi(clone(a0));
  const id = str(a.id).trim();
  if (id) a.id = id; else delete a.id;

  const t = a.target || {};
  const tType = t.type || 'css';
  const tValue = str(t.value).trim();
  if (tValue) a.target = { ...t, type: tType, value: tValue };
  else if (t.shadowHost) { a.target = { ...t, type: tType }; delete a.target.value; }
  else delete a.target;

  if (a.value === '') delete a.value;
  else if (typeof a.value === 'string' && /^\d+$/.test(a.value)) a.value = Number(a.value);

  if (a.onError) a.onError = a.onError; else delete a.onError;

  const opts = { ...(a.options || {}) };
  if (!str(opts.as)) delete opts.as;
  if (str(opts.attribute).trim()) opts.attribute = str(opts.attribute).trim(); else delete opts.attribute;
  if (opts.multiple === true) opts.multiple = true; else delete opts.multiple;
  numOrDel(opts, 'timeout');
  numOrDel(opts, 'delay');
  if (Object.keys(opts).length) a.options = opts; else delete a.options;

  return a;
}

function cleanWorkflow(wf0) {
  const wf = stripUi(clone(wf0));
  wf.version = str(wf.version).trim() || '1.0';
  if (wf.interceptResource === true) wf.interceptResource = true; else delete wf.interceptResource;
  wf.actions = (wf0.actions || []).map(cleanAction);
  return wf;
}

export function cleanMeta(m0) {
  const m = m0 || {};
  const out = {};
  for (const k of ['multiple', 'isContainer', 'multiline', 'isPage']) if (m[k] === true) out[k] = true;
  const alt = (m.alterPattern || []).filter(Boolean);
  if (alt.length) out.alterPattern = alt;
  return out;
}

export function cleanCustom(c0) {
  const c = c0 || {};
  if (!CUSTOM_TYPES.includes(c.type)) {
    try { return JSON.parse(c.__cjson); } catch { return { type: c.type }; }
  }
  const out = { type: c.type };
  if (c.type === 'regex') {
    out.rules = (c.rules || []).map((r) => {
      const o = { pattern: str(r.pattern), replacement: str(r.replacement) };
      if (r.flags) o.flags = r.flags;
      return o;
    }).filter((o) => o.pattern !== '');
  } else if (c.type === 'date-format') {
    if (c.format) out.format = c.format;
  } else if (c.type === 'url-resolve') {
    if (c.baseUrl) out.baseUrl = c.baseUrl;
  }
  return out;
}

export function cleanPipes(p0) {
  const p = p0 || {};
  const out = {};
  for (const k of ['trim', 'decode', 'toLowerCase', 'toUpperCase']) if (p[k] === true) out[k] = true;
  const m = p.merge;
  if (m === true || m === 'true') out.merge = true; else if (m) out.merge = m;
  const rep = (p.replace || []).map((r) => ({ from: str(r.from), to: str(r.to) })).filter((x) => x.from !== '' || x.to !== '');
  if (rep.length) out.replace = rep;
  const custom = (p.custom || []).map(cleanCustom);
  if (custom.length) out.custom = custom;
  return out;
}

export function cleanPattern(p0) {
  const src = p0 || {};
  const p = { key: str(src.key), patternType: 'xpath', returnType: src.returnType || 'text' };
  p.patterns = (src.patterns || []).filter(Boolean);
  const meta = cleanMeta(src.meta);
  if (Object.keys(meta).length) p.meta = meta;
  const pipes = cleanPipes(src.pipes);
  if (Object.keys(pipes).length) p.pipes = pipes;
  return p;
}

export function cleanStage(stage0) {
  const stage = stage0 || {};
  const engine = stage.engine || 'xpath';
  const cfg = { engine };
  const disc = (Array.isArray(stage.discover) ? stage.discover : [])
    .filter((d) => d && str(d.fromKey).trim())
    .map((d) => ({ stage: d.stage, fromKey: d.fromKey }));
  if (disc.length) cfg.discover = disc;
  if (engine === 'browser') {
    cfg.workflow = cleanWorkflow(stage.workflow || {});
  } else {
    const patterns = (stage.patterns || []).map(cleanPattern);
    const collect = str(stage.collect).trim();
    if (patterns.length) cfg.patterns = patterns;
    if (collect) cfg.collect = collect;
  }
  return cfg;
}

export function serializeStages(stages, order) {
  const out = {};
  for (const k of order) if (stages[k]) out[k] = cleanStage(stages[k]);
  return out;
}
