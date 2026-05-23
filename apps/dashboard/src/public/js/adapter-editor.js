(function () {
  const STAGE_KEYS = ['index', 'detail', 'episode', 'batch'];

  const editor = document.getElementById('stage-editor');
  const field = document.getElementById('stages-field');
  const form = field.closest('form');
  const errBox = document.getElementById('editor-error');
  const addSelect = document.getElementById('add-stage-select');
  const addBtn = document.querySelector('[data-act="add-stage"]');

  const h = (tag, attrs = {}, kids = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'checked' || k === 'value' || k === 'type' || k === 'rows') e[k] = v;
      else e.setAttribute(k, v);
    }
    for (const kid of [].concat(kids)) if (kid != null && kid !== false) e.append(kid);
    return e;
  };
  const field2 = (label, control) =>
    h('div', {}, [h('label', { class: 'label', text: label }), control]);
  const textInput = (value, ph) =>
    h('input', { class: 'input', value: value == null ? '' : String(value), placeholder: ph || '' });
  const btn = (label, act, cls) =>
    h('button', { type: 'button', class: 'btn ' + (cls || 'btn-ghost'), 'data-act': act, text: label });
  const select = (opts, value, cls) => {
    const s = h('select', { class: cls || 'input' });
    for (const o of opts) {
      const [val, lbl] = Array.isArray(o) ? o : [o, o === '' ? '(none)' : o];
      const opt = h('option', { value: val, text: lbl });
      if (val === value) opt.selected = true;
      s.append(opt);
    }
    return s;
  };
  const tagCheck = (fname, val) => {
    const input = h('input', { type: 'checkbox', class: 'check', checked: !!val, 'data-f': fname });
    return h('label', { class: 'flex w-fit cursor-pointer select-none items-center gap-2' }, [
      input,
      h('span', { class: 'font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-mute', text: fname }),
    ]);
  };
  const fieldEl = (scope, f) => scope.querySelector('[data-f="' + f + '"]');
  const checkedOf = (scope, f) => { const el = fieldEl(scope, f); return !!(el && el.checked); };
  const rowsOf = (btnEl, name) =>
    btnEl.parentElement.parentElement.querySelector(':scope > [data-rows="' + name + '"]');

  // ---- render: stage shell ----
  function renderStage(stage, cfg) {
    const sec = h('section', { class: 'card p-4 space-y-3', 'data-stage': stage });
    sec.__cfg = cfg || { engine: 'xpath' };
    const eng = select(['xpath', 'browser'], cfg.engine || 'xpath');
    eng.setAttribute('data-f', 'engine');
    eng.addEventListener('change', () => swapBody(sec, eng.value));
    sec.append(
      h('div', { class: 'flex items-center justify-between' }, [
        h('div', { class: 'flex items-center gap-3' }, [
          h('span', { class: 'pill', text: stage }),
          h('label', { class: 'label !mb-0', text: 'engine' }),
          eng,
        ]),
        btn('✕ remove', 'del-stage', 'btn-danger'),
      ]),
    );
    sec.append(renderDiscover(cfg.discover || []));
    const body = h('div', { class: 'stage-body space-y-3' });
    body.append(engineBody(cfg.engine || 'xpath', cfg));
    sec.append(body);
    return sec;
  }
  function renderDiscover(list) {
    const wrap = h('div', { class: 'space-y-2', 'data-discover': '' }, [
      h('div', { class: 'flex items-center justify-between' }, [
        h('label', { class: 'label !mb-0', text: 'discover' }),
        btn('+ rule', 'add-discover'),
      ]),
    ]);
    const rows = h('div', { class: 'space-y-2', 'data-rows': 'discover' });
    for (const d of list || []) rows.append(discoverRow(d));
    wrap.append(rows);
    return wrap;
  }
  function discoverRow(d) {
    d = d || {};
    const stage = select(STAGE_KEYS, d.stage || 'detail');
    stage.setAttribute('data-f', 'stage');
    const fromKey = textInput(d.fromKey, 'fromKey');
    fromKey.setAttribute('data-f', 'fromKey');
    return h('div', { class: 'flex items-center gap-2', 'data-row': 'discover' }, [
      stage, fromKey, btn('✕', 'del-row', 'btn-ghost'),
    ]);
  }
  function engineBody(engine, cfg) {
    return engine === 'browser' ? renderBrowserBody(cfg) : renderXpathBody(cfg);
  }
  function renderBrowserBody(cfg) {
    const wrap = h('div', { class: 'space-y-2', 'data-browser': '' });
    const ta = h('textarea', { class: 'input font-mono text-xs', rows: 18, spellcheck: 'false', 'data-f': 'workflow' });
    ta.value = JSON.stringify((cfg && cfg.workflow) || { version: '1.0', actions: [] }, null, 2);
    wrap.append(field2('workflow (JSON)', ta));
    return wrap;
  }
  function renderXpathBody(cfg) {
    const wrap = h('div', { class: 'space-y-3', 'data-xpath': '' });
    const collect = textInput(cfg && cfg.collect, 'collect key (optional)');
    collect.setAttribute('data-f', 'collect');
    wrap.append(field2('collect', collect));
    wrap.append(h('div', { class: 'flex items-center justify-between' }, [
      h('label', { class: 'label !mb-0', text: 'patterns' }),
      btn('+ pattern', 'add-pattern'),
    ]));
    const list = h('div', { class: 'space-y-3', 'data-rows': 'pattern' });
    for (const p of (cfg && cfg.patterns) || []) list.append(patternCard(p));
    wrap.append(list);
    return wrap;
  }
  function patternCard(p) {
    p = p || {};
    const meta = p.meta || {};
    const pipes = p.pipes || {};
    const card = h('div', { class: 'card bg-cream p-3 space-y-2', 'data-row': 'pattern' });
    const key = textInput(p.key, 'key'); key.setAttribute('data-f', 'key');
    const rt = select(['text', 'rawHTML'], p.returnType || 'text'); rt.setAttribute('data-f', 'returnType');
    card.append(h('div', { class: 'flex items-end justify-between gap-2' }, [
      h('div', { class: 'flex-1' }, [field2('key', key)]),
      field2('returnType', rt),
      btn('✕', 'del-pattern', 'btn-danger'),
    ]));
    card.append(h('div', { class: 'flex items-center justify-between' }, [
      h('label', { class: 'label !mb-0', text: 'xpath' }),
      btn('+ xpath', 'add-xpath'),
    ]));
    const xrows = h('div', { class: 'space-y-2', 'data-rows': 'xpath' });
    const xs = p.patterns && p.patterns.length ? p.patterns : [''];
    for (const x of xs) xrows.append(xpathRow(x));
    card.append(xrows);
    card.append(h('div', { class: 'flex flex-wrap gap-4' }, [
      tagCheck('multiple', meta.multiple), tagCheck('isContainer', meta.isContainer),
    ]));
    card.append(metaAdvanced(meta));
    card.append(pipesBlock(pipes));
    return card;
  }
  function xpathRow(v) {
    const i = textInput(v || '', '//xpath/expr');
    i.setAttribute('data-f', 'xpath');
    i.classList.add('font-mono', 'text-xs');
    return h('div', { class: 'flex items-center gap-2', 'data-row': 'xpath' }, [i, btn('✕', 'del-row', 'btn-ghost')]);
  }
  function metaAdvanced(meta) {
    meta = meta || {};
    const d = h('details', { class: 'rounded-none border-2 border-ink/30 p-2' });
    d.append(h('summary', { class: 'cursor-pointer font-mono text-[0.62rem] uppercase tracking-[0.18em] text-mute', text: 'advanced meta' }));
    const body = h('div', { class: 'mt-2 space-y-2' });
    body.append(h('div', { class: 'flex flex-wrap gap-4' }, [
      tagCheck('multiline', meta.multiline), tagCheck('isPage', meta.isPage),
    ]));
    body.append(h('div', { class: 'flex items-center justify-between' }, [
      h('label', { class: 'label !mb-0', text: 'alterPattern' }),
      btn('+ alt', 'add-alter'),
    ]));
    const arows = h('div', { class: 'space-y-2', 'data-rows': 'alter' });
    for (const a of meta.alterPattern || []) arows.append(alterRow(a));
    body.append(arows);
    d.append(body);
    return d;
  }
  function alterRow(v) {
    const i = textInput(v || '', 'alt xpath');
    i.setAttribute('data-f', 'alterPattern');
    i.classList.add('font-mono', 'text-xs');
    return h('div', { class: 'flex items-center gap-2', 'data-row': 'alter' }, [i, btn('✕', 'del-row', 'btn-ghost')]);
  }
  function hasPipes(p) {
    return !!(p && (p.trim || p.decode || p.toLowerCase || p.toUpperCase || p.merge ||
      (p.replace && p.replace.length) || (p.custom && p.custom.length)));
  }
  function pipesBlock(pipes) {
    pipes = pipes || {};
    const d = h('details', { class: 'rounded-none border-2 border-ink/30 p-2' });
    if (hasPipes(pipes)) d.setAttribute('open', '');
    d.append(h('summary', { class: 'cursor-pointer font-mono text-[0.62rem] uppercase tracking-[0.18em] text-mute', text: 'pipes' }));
    const body = h('div', { class: 'mt-2 space-y-2' });
    body.append(h('div', { class: 'flex flex-wrap gap-4' }, [
      tagCheck('trim', pipes.trim), tagCheck('decode', pipes.decode),
      tagCheck('toLowerCase', pipes.toLowerCase), tagCheck('toUpperCase', pipes.toUpperCase),
    ]));
    const merge = select(['', 'true', 'with space', 'with comma'], pipes.merge === true ? 'true' : (pipes.merge || ''));
    merge.setAttribute('data-f', 'merge');
    body.append(field2('merge', merge));
    body.append(h('div', { class: 'flex items-center justify-between' }, [
      h('label', { class: 'label !mb-0', text: 'replace' }),
      btn('+ replace', 'add-replace'),
    ]));
    const rrows = h('div', { class: 'space-y-2', 'data-rows': 'replace' });
    for (const r of pipes.replace || []) rrows.append(replaceRow(r));
    body.append(rrows);
    body.append(h('div', { class: 'flex items-center justify-between' }, [
      h('label', { class: 'label !mb-0', text: 'custom pipes' }),
      btn('+ pipe', 'add-custom'),
    ]));
    const crows = h('div', { class: 'space-y-2', 'data-rows': 'custom' });
    for (const c of pipes.custom || []) crows.append(customEntry(c));
    body.append(crows);
    d.append(body);
    return d;
  }
  function replaceRow(r) {
    r = r || {};
    const from = textInput(r.from, 'from'); from.setAttribute('data-f', 'from');
    const to = textInput(r.to, 'to'); to.setAttribute('data-f', 'to');
    return h('div', { class: 'flex items-center gap-2', 'data-row': 'replace' }, [from, to, btn('✕', 'del-row', 'btn-ghost')]);
  }
  const CUSTOM_TYPES = ['regex', 'num-normalize', 'parse-as-url', 'extract-email', 'date-format', 'url-resolve'];
  function customEntry(c) {
    c = c || { type: 'regex' };
    const known = CUSTOM_TYPES.includes(c.type);
    const wrap = h('div', { class: 'card bg-panel p-2 space-y-2', 'data-row': 'custom' });
    const opts = known ? CUSTOM_TYPES : CUSTOM_TYPES.concat([c.type || '']);
    const type = select(opts, c.type || 'regex');
    type.setAttribute('data-f', 'ctype');
    wrap.append(h('div', { class: 'flex items-center gap-2' }, [
      h('label', { class: 'label !mb-0', text: 'type' }), type, btn('✕', 'del-row', 'btn-danger'),
    ]));
    const extra = h('div', { 'data-extra': '' });
    wrap.append(extra);
    renderCustomExtra(extra, c.type || 'regex', c, known);
    type.addEventListener('change', () =>
      renderCustomExtra(extra, type.value, {}, CUSTOM_TYPES.includes(type.value)));
    return wrap;
  }
  function renderCustomExtra(extra, type, c, known) {
    c = c || {};
    extra.replaceChildren();
    if (!known) {
      const ta = h('textarea', { class: 'input font-mono text-xs', rows: 3, 'data-f': 'cjson' });
      ta.value = JSON.stringify(c, null, 2);
      extra.append(field2('raw json', ta));
      return;
    }
    if (type === 'regex') {
      extra.append(h('div', { class: 'flex items-center justify-between' }, [
        h('label', { class: 'label !mb-0', text: 'rules' }),
        btn('+ rule', 'add-rule'),
      ]));
      const rows = h('div', { class: 'space-y-2', 'data-rows': 'rule' });
      for (const r of c.rules || [{}]) rows.append(ruleRow(r));
      extra.append(rows);
    } else if (type === 'date-format') {
      const i = textInput(c.format, 'YYYY-MM-DD'); i.setAttribute('data-f', 'format');
      extra.append(field2('format', i));
    } else if (type === 'url-resolve') {
      const i = textInput(c.baseUrl, 'https://...'); i.setAttribute('data-f', 'baseUrl');
      extra.append(field2('baseUrl', i));
    }
  }
  function ruleRow(r) {
    r = r || {};
    const pat = textInput(r.pattern, 'pattern'); pat.setAttribute('data-f', 'pattern'); pat.classList.add('font-mono', 'text-xs');
    const rep = textInput(r.replacement, 'replacement'); rep.setAttribute('data-f', 'replacement');
    const fl = textInput(r.flags, 'flags'); fl.setAttribute('data-f', 'flags'); fl.classList.add('!w-20');
    return h('div', { class: 'flex items-center gap-2', 'data-row': 'rule' }, [pat, rep, fl, btn('✕', 'del-row', 'btn-ghost')]);
  }
  function collectMeta(card) {
    const m = {};
    if (checkedOf(card, 'multiple')) m.multiple = true;
    if (checkedOf(card, 'isContainer')) m.isContainer = true;
    if (checkedOf(card, 'multiline')) m.multiline = true;
    if (checkedOf(card, 'isPage')) m.isPage = true;
    const alt = [...card.querySelectorAll('[data-rows="alter"] > [data-row="alter"] [data-f="alterPattern"]')]
      .map((i) => i.value).filter(Boolean);
    if (alt.length) m.alterPattern = alt;
    return m;
  }
  function collectPipes(card) {
    const p = {};
    for (const f of ['trim', 'decode', 'toLowerCase', 'toUpperCase']) if (checkedOf(card, f)) p[f] = true;
    const merge = fieldEl(card, 'merge').value;
    if (merge === 'true') p.merge = true; else if (merge) p.merge = merge;
    const rep = [...card.querySelectorAll('[data-rows="replace"] > [data-row="replace"]')]
      .map((r) => ({ from: fieldEl(r, 'from').value, to: fieldEl(r, 'to').value }))
      .filter((x) => x.from !== '' || x.to !== '');
    if (rep.length) p.replace = rep;
    const custom = [...card.querySelectorAll('[data-rows="custom"] > [data-row="custom"]')].map(collectCustom);
    if (custom.length) p.custom = custom;
    return p;
  }
  function collectCustom(entry) {
    const type = fieldEl(entry, 'ctype').value;
    const extra = entry.querySelector(':scope > [data-extra]');
    const cjson = extra.querySelector(':scope > div > [data-f="cjson"]');
    if (cjson) { try { return JSON.parse(cjson.value); } catch (_) { return { type }; } }
    const c = { type };
    if (type === 'regex') {
      c.rules = [...extra.querySelectorAll(':scope > [data-rows="rule"] > [data-row="rule"]')].map((r) => {
        const o = { pattern: fieldEl(r, 'pattern').value, replacement: fieldEl(r, 'replacement').value };
        const fl = fieldEl(r, 'flags').value; if (fl) o.flags = fl;
        return o;
      }).filter((o) => o.pattern !== '');
    } else if (type === 'date-format') {
      const f = fieldEl(extra, 'format'); if (f && f.value) c.format = f.value;
    } else if (type === 'url-resolve') {
      const b = fieldEl(extra, 'baseUrl'); if (b && b.value) c.baseUrl = b.value;
    }
    return c;
  }

  function swapBody(sec, engine) {
    const body = sec.querySelector(':scope > .stage-body');
    body.replaceChildren();
    body.append(engineBody(engine, {}));
  }

  function refreshAddSelect() {
    const present = new Set([...editor.querySelectorAll(':scope > [data-stage]')].map((s) => s.dataset.stage));
    const missing = STAGE_KEYS.filter((k) => !present.has(k));
    addSelect.replaceChildren();
    for (const k of missing) addSelect.append(h('option', { value: k, text: k }));
    addSelect.disabled = missing.length === 0;
    addBtn.disabled = missing.length === 0;
  }

  addBtn.addEventListener('click', () => {
    const stage = addSelect.value;
    if (!stage) return;
    editor.append(renderStage(stage, { engine: 'xpath', patterns: [], discover: [] }));
    refreshAddSelect();
  });

  editor.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'del-stage') { t.closest('[data-stage]').remove(); refreshAddSelect(); return; }
    if (act === 'del-row') { t.closest('[data-row]').remove(); return; }
    if (act === 'del-pattern') { t.closest('[data-row="pattern"]').remove(); return; }
    if (act === 'add-discover') { rowsOf(t, 'discover').append(discoverRow()); return; }
    if (act === 'add-pattern') { rowsOf(t, 'pattern').append(patternCard()); return; }
    if (act === 'add-xpath') { rowsOf(t, 'xpath').append(xpathRow()); return; }
    if (act === 'add-alter') { rowsOf(t, 'alter').append(alterRow()); return; }
    if (act === 'add-replace') { rowsOf(t, 'replace').append(replaceRow()); return; }
    if (act === 'add-custom') { rowsOf(t, 'custom').append(customEntry()); return; }
    if (act === 'add-rule') { rowsOf(t, 'rule').append(ruleRow()); return; }
  });

  // ---- collect ----
  function collect() {
    const stages = {};
    for (const sec of editor.querySelectorAll(':scope > [data-stage]')) {
      stages[sec.dataset.stage] = collectStage(sec);
    }
    return stages;
  }
  function collectStage(sec) {
    const engine = fieldEl(sec, 'engine').value;
    const cfg = { engine };
    const discWrap = sec.querySelector(':scope > [data-discover]');
    const disc = [...discWrap.querySelectorAll(':scope > [data-rows="discover"] > [data-row="discover"]')]
      .map((r) => ({ stage: fieldEl(r, 'stage').value, fromKey: fieldEl(r, 'fromKey').value }))
      .filter((d) => d.fromKey);
    if (disc.length) cfg.discover = disc;
    if (engine === 'browser') {
      const wf = sec.querySelector('[data-f="workflow"]').value;
      cfg.workflow = JSON.parse(wf); // throws on bad JSON → caught in submit handler
    } else {
      const xbody = sec.querySelector(':scope > .stage-body > [data-xpath]');
      const collectKey = fieldEl(xbody, 'collect').value.trim();
      const patterns = [...xbody.querySelectorAll(':scope > [data-rows="pattern"] > [data-row="pattern"]')].map(collectPattern);
      if (patterns.length) cfg.patterns = patterns;
      if (collectKey) cfg.collect = collectKey;
    }
    return cfg;
  }
  function collectPattern(card) {
    const p = { key: fieldEl(card, 'key').value, patternType: 'xpath', returnType: fieldEl(card, 'returnType').value };
    p.patterns = [...card.querySelectorAll(':scope > [data-rows="xpath"] > [data-row="xpath"] [data-f="xpath"]')]
      .map((i) => i.value).filter(Boolean);
    const meta = collectMeta(card);
    if (Object.keys(meta).length) p.meta = meta;
    const pipes = collectPipes(card);
    if (Object.keys(pipes).length) p.pipes = pipes;
    return p;
  }

  form.addEventListener('submit', (e) => {
    try {
      field.value = JSON.stringify(collect());
      errBox.classList.add('hidden');
      errBox.textContent = '';
    } catch (err) {
      e.preventDefault();
      errBox.textContent = 'Invalid workflow JSON: ' + (err && err.message ? err.message : err);
      errBox.classList.remove('hidden');
    }
  });

  function boot() {
    let stages = {};
    try { stages = JSON.parse(document.getElementById('stages-data').value || '{}'); } catch (_) {}
    for (const k of STAGE_KEYS) if (stages[k]) editor.append(renderStage(k, stages[k]));
    refreshAddSelect();
  }
  boot();
})();
