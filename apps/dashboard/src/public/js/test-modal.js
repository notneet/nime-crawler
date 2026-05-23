// Shared test-result modal. Pages call window.TestModal.open(opts) where opts:
//   stageLabel:  string appended to the dialog title
//   endpoint:    POST url returning { ok, stage, result } | { ok:false, error }
//   buildBody:   fn(url) -> request body object (may throw; error shows in modal)
//   urlInput:    show the URL field + Run button (editor flow)
//   initialUrl:  prefill for the URL field
//   autoRun:     fetch immediately using initialUrl (inject flow)
window.TestModal = (function () {
  var ROW_CAP = 50;
  var dlg, titleEl, statusEl, bodyEl, toggleEl, urlbarEl, urlEl, runEl;
  var lastResult = null;
  var showingRaw = false;
  var current = null;

  function els() {
    dlg = document.getElementById('test-result');
    if (!dlg) return false;
    titleEl = document.getElementById('test-title');
    statusEl = document.getElementById('test-status');
    bodyEl = document.getElementById('test-body');
    toggleEl = document.getElementById('test-toggle');
    urlbarEl = document.getElementById('test-urlbar');
    urlEl = document.getElementById('test-url');
    runEl = document.getElementById('test-run');
    return true;
  }

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

  function noteEl(wrapKey, shownLen, total) {
    var note = document.createElement('p');
    note.className = 'mb-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-mute';
    note.textContent = wrapKey + ' · showing ' + shownLen + ' of ' + total;
    return note;
  }

  // generic array-of-objects → table, returns a fragment (also used nested).
  function buildRowsTable(wrapKey, rows) {
    var shown = rows.slice(0, ROW_CAP);
    var cols = [];
    var seen = {};
    shown.forEach(function (r) {
      Object.keys(r).forEach(function (k) { if (!seen[k]) { seen[k] = 1; cols.push(k); } });
    });
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
    var frag = document.createDocumentFragment();
    frag.appendChild(noteEl(wrapKey, shown.length, rows.length));
    frag.appendChild(table);
    return frag;
  }

  // single-column list (e.g. index links), returns a fragment.
  function buildLinksTable(wrapKey, arr) {
    var shown = arr.slice(0, ROW_CAP);
    var table = document.createElement('table');
    table.className = 'tbl';
    var thead = document.createElement('thead');
    var htr = document.createElement('tr');
    var th = document.createElement('th');
    th.textContent = wrapKey;
    htr.appendChild(th);
    thead.appendChild(htr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    shown.forEach(function (v) {
      var tr = document.createElement('tr');
      tr.appendChild(cell('td', v));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var frag = document.createDocumentFragment();
    frag.appendChild(noteEl(wrapKey, shown.length, arr.length));
    frag.appendChild(table);
    return frag;
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

  // downloads table styled like anime-batch / episode pages, returns a fragment.
  function buildDownloadsTable(wrapKey, rows) {
    var shown = rows.slice(0, ROW_CAP);
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
    var frag = document.createDocumentFragment();
    frag.appendChild(noteEl(wrapKey, shown.length, rows.length));
    frag.appendChild(table);
    return frag;
  }

  function isImageUrl(k, v) {
    if (!isUrl(v)) return false;
    return /(thumb|image|cover|photo|poster|img)/i.test(k) ||
      /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(v);
  }

  function isObjRows(v) {
    return Array.isArray(v) && v.length > 0 &&
      v.every(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
  }

  // detail/episode field value: thumbnails, pill lists, stacked links, nested tables.
  function fillField(el, k, v) {
    if (isImageUrl(k, v)) {
      var img = document.createElement('img');
      img.src = v;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.className = 'max-h-48 border-2 border-ink bg-blush object-cover';
      el.appendChild(img);
      return;
    }
    if (isObjRows(v)) {
      el.appendChild(isDownloadRows(v) ? buildDownloadsTable(k, explodeDownloads(v)) : buildRowsTable(k, v));
      return;
    }
    if (Array.isArray(v) && v.length) {
      if (v.some(isUrl)) {
        v.forEach(function (x) {
          if (isUrl(x)) { el.appendChild(anchor(x)); return; }
          var span = document.createElement('span');
          span.className = 'block';
          span.textContent = x == null ? '' : String(x);
          el.appendChild(span);
        });
        return;
      }
      if (v.every(function (x) { return x != null && typeof x !== 'object'; })) {
        v.forEach(function (x) {
          var pill = document.createElement('span');
          pill.className = 'pill mb-1 mr-1 inline-block';
          pill.textContent = String(x);
          el.appendChild(pill);
        });
        return;
      }
    }
    fillCell(el, v);
  }

  // key/value "fields" view styled like the detail/episode pages.
  function buildFields(result) {
    var table = document.createElement('table');
    table.className = 'tbl';
    var tbody = document.createElement('tbody');
    Object.keys(result).forEach(function (k) {
      var tr = document.createElement('tr');
      var th = cell('td', k);
      th.className += ' font-mono text-mute whitespace-nowrap';
      tr.appendChild(th);
      var td = document.createElement('td');
      td.className = 'border-b border-ink/15 px-3 py-2.5 align-top break-all';
      fillField(td, k, result[k]);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var frag = document.createDocumentFragment();
    frag.appendChild(table);
    return frag;
  }

  // single-key array of scalars/urls (e.g. index links).
  function linkArrayCase(result) {
    var keys = Object.keys(result);
    if (keys.length === 1) {
      var v = result[keys[0]];
      if (Array.isArray(v) && v.length &&
        v.every(function (x) { return x == null || typeof x !== 'object'; })) {
        return { key: keys[0], arr: v };
      }
    }
    return null;
  }

  function renderTable(result) {
    var ac = arrayCase(result);
    if (ac && isDownloadRows(ac.rows)) { bodyEl.replaceChildren(buildDownloadsTable(ac.key, explodeDownloads(ac.rows))); return; }
    if (ac) { bodyEl.replaceChildren(buildRowsTable(ac.key, ac.rows)); return; }
    var lc = linkArrayCase(result);
    if (lc) { bodyEl.replaceChildren(buildLinksTable(lc.key, lc.arr)); return; }
    bodyEl.replaceChildren(buildFields(result));
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

  function doFetch(url) {
    var body;
    try {
      body = current.buildBody(url);
    } catch (err) {
      setStatus(err && err.message ? err.message : 'invalid config', true);
      return;
    }
    lastResult = null;
    showingRaw = false;
    bodyEl.replaceChildren();
    setStatus('Testing… browser stages can take a while.', false);
    if (runEl) runEl.disabled = true;

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 130000);

    fetch(current.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
        if (runEl) runEl.disabled = false;
      });
  }

  function open(opts) {
    if (!els()) return;
    current = { endpoint: opts.endpoint, buildBody: opts.buildBody };
    lastResult = null;
    showingRaw = false;
    bodyEl.replaceChildren();
    setStatus('', false);
    titleEl.textContent = 'Test result' + (opts.stageLabel ? ' · ' + opts.stageLabel : '');
    var showUrl = !!opts.urlInput;
    urlbarEl.className = (showUrl ? '' : 'hidden ') + 'gap-2 px-6 pt-4 sm:flex';
    if (urlEl) urlEl.value = opts.initialUrl || '';
    if (typeof dlg.showModal === 'function') dlg.showModal();
    if (showUrl && urlEl) urlEl.focus();
    if (opts.autoRun) doFetch(opts.initialUrl || '');
  }

  function wire() {
    if (!els()) return;
    toggleEl.addEventListener('click', function () { showingRaw = !showingRaw; paint(); });
    if (runEl) runEl.addEventListener('click', function () { doFetch(urlEl ? urlEl.value : ''); });
    if (urlEl) {
      urlEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); doFetch(urlEl.value); }
      });
    }
  }

  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  return { open: open };
})();
