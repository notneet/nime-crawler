(function () {
  var island = document.getElementById('inject-sources');
  var sources = island ? JSON.parse(island.textContent || '[]') : [];
  var bySource = {};
  sources.forEach(function (s) { bySource[s.source] = s; });
  window.injectSyncStages = function () {
    var src = document.getElementById('inject-source');
    var stage = document.getElementById('inject-stage');
    var hint = document.getElementById('inject-hint');
    if (!src || !stage) return;
    var s = bySource[src.value];
    while (stage.firstChild) stage.removeChild(stage.firstChild);
    (s ? s.stages : []).forEach(function (st) {
      var o = document.createElement('option');
      o.value = st; o.textContent = st;
      stage.appendChild(o);
    });
    if (hint && s) hint.textContent = 'must start with ' + s.baseUrl;
  };
  window.injectSyncStages();
})();

(function () {
  var btn = document.getElementById('inject-test-btn');
  var dlg = document.getElementById('test-result');
  if (!btn || !dlg) return;

  var titleEl = document.getElementById('test-title');
  var statusEl = document.getElementById('test-status');
  var bodyEl = document.getElementById('test-body');
  var toggleEl = document.getElementById('test-toggle');

  var ROW_CAP = 50;
  var lastResult = null;
  var showingRaw = false;

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.className = (msg ? '' : 'empty:hidden ') + 'px-6 ' + (msg ? 'pt-4 ' : '') +
      'text-sm ' + (isError ? 'text-deep' : 'text-mute');
  }

  function isUrl(s) {
    return typeof s === 'string' && /^https?:\/\//i.test(s);
  }

  function anchor(url) {
    var a = document.createElement('a');
    a.href = url;
    a.textContent = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'block break-all';
    return a;
  }

  function fillCell(el, v) {
    if (v == null) return;
    if (isUrl(v)) { el.appendChild(anchor(v)); return; }
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      el.textContent = String(v);
      return;
    }
    if (Array.isArray(v) && v.every(function (x) { return x == null || typeof x !== 'object'; })) {
      if (v.some(isUrl)) {
        v.forEach(function (x) {
          if (isUrl(x)) { el.appendChild(anchor(x)); return; }
          var span = document.createElement('span');
          span.className = 'block';
          span.textContent = x == null ? '' : String(x);
          el.appendChild(span);
        });
      } else {
        el.textContent = v.join(', ');
      }
      return;
    }
    var s = JSON.stringify(v);
    el.textContent = s.length > 200 ? s.slice(0, 200) + '…' : s;
  }

  function cell(tag, value) {
    var el = document.createElement(tag);
    el.className = 'border-b border-ink/15 px-3 py-2.5 align-top break-all';
    fillCell(el, value);
    return el;
  }

  function arrayCase(result) {
    var keys = Object.keys(result);
    if (keys.length === 1) {
      var v = result[keys[0]];
      if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
        return { key: keys[0], rows: v };
      }
    }
    return null;
  }

  function renderRows(wrapKey, rows) {
    var shown = rows.slice(0, ROW_CAP);
    var cols = [];
    var seen = {};
    shown.forEach(function (r) {
      Object.keys(r).forEach(function (k) { if (!seen[k]) { seen[k] = 1; cols.push(k); } });
    });
    var note = document.createElement('p');
    note.className = 'mb-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-mute';
    note.textContent = wrapKey + ' · showing ' + shown.length + ' of ' + rows.length;
    var table = document.createElement('table');
    table.className = 'tbl';
    var thead = document.createElement('thead');
    var htr = document.createElement('tr');
    cols.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    shown.forEach(function (r) {
      var tr = document.createElement('tr');
      cols.forEach(function (c) { tr.appendChild(cell('td', r[c])); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    bodyEl.replaceChildren(note, table);
  }

  function renderKeyValue(result) {
    var table = document.createElement('table');
    table.className = 'tbl';
    var tbody = document.createElement('tbody');
    Object.keys(result).forEach(function (k) {
      var tr = document.createElement('tr');
      var th = cell('td', k);
      th.className += ' font-mono text-mute whitespace-nowrap';
      tr.appendChild(th);
      tr.appendChild(cell('td', result[k]));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    bodyEl.replaceChildren(table);
  }

  // batch/download collect shape: items carry parallel links[]/hosts[].
  function isDownloadRows(rows) {
    return rows.length > 0 && rows.every(function (r) {
      return r && Array.isArray(r.links) && Array.isArray(r.hosts);
    });
  }

  // one row per (host, link) pair, matching the anime-batch page.
  function explodeDownloads(rows) {
    var out = [];
    rows.forEach(function (r) {
      var n = Math.max(r.links.length, r.hosts.length);
      for (var i = 0; i < n; i++) {
        out.push({ quality: r.quality, host: r.hosts[i], size: r.size, url: r.links[i] });
      }
    });
    return out;
  }

  function renderDownloads(wrapKey, rows) {
    var shown = rows.slice(0, ROW_CAP);
    var note = document.createElement('p');
    note.className = 'mb-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-mute';
    note.textContent = wrapKey + ' · showing ' + shown.length + ' of ' + rows.length;
    var table = document.createElement('table');
    table.className = 'tbl';
    var thead = document.createElement('thead');
    var htr = document.createElement('tr');
    ['Quality', 'Host', 'Size', 'URL'].forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    shown.forEach(function (r) {
      var tr = document.createElement('tr');
      var qtd = document.createElement('td');
      qtd.className = 'border-b border-ink/15 px-3 py-2.5 align-top';
      if (r.quality != null && r.quality !== '') {
        var pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = String(r.quality);
        qtd.appendChild(pill);
      }
      tr.appendChild(qtd);
      tr.appendChild(cell('td', r.host));
      var std = cell('td', r.size);
      std.className += ' text-mute';
      tr.appendChild(std);
      tr.appendChild(cell('td', r.url));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    bodyEl.replaceChildren(note, table);
  }

  function renderTable(result) {
    var ac = arrayCase(result);
    if (ac && isDownloadRows(ac.rows)) renderDownloads(ac.key, explodeDownloads(ac.rows));
    else if (ac) renderRows(ac.key, ac.rows);
    else renderKeyValue(result);
  }

  function renderRaw(result) {
    var pre = document.createElement('pre');
    pre.className = 'font-mono text-xs whitespace-pre-wrap break-all';
    pre.textContent = JSON.stringify(result, null, 2);
    bodyEl.replaceChildren(pre);
  }

  function paint() {
    if (lastResult == null) return;
    if (showingRaw) renderRaw(lastResult);
    else renderTable(lastResult);
    toggleEl.textContent = showingRaw ? 'Table' : 'Raw JSON';
  }

  toggleEl.addEventListener('click', function () { showingRaw = !showingRaw; paint(); });

  btn.addEventListener('click', function () {
    var source = (document.getElementById('inject-source') || {}).value;
    var stage = (document.getElementById('inject-stage') || {}).value;
    var url = (document.getElementById('inject-url') || {}).value;

    lastResult = null;
    showingRaw = false;
    bodyEl.replaceChildren();
    titleEl.textContent = 'Test result' + (stage ? ' · ' + stage : '');
    setStatus('Testing… browser stages can take a while.', false);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    btn.disabled = true;

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 130000);

    fetch('/inject/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: source, stage: stage, url: url }),
      signal: ctrl.signal,
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'bad response (' + r.status + ')' }; }); })
      .then(function (data) {
        if (data && data.ok) {
          lastResult = data.result || {};
          setStatus('', false);
          paint();
        } else {
          setStatus((data && data.error) || 'test failed', true);
        }
      })
      .catch(function (err) {
        setStatus(err && err.name === 'AbortError' ? 'Test timed out.' : 'Test request failed.', true);
      })
      .finally(function () {
        clearTimeout(timer);
        btn.disabled = false;
      });
  });
})();
