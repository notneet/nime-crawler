import { classify, isUrl, isImageUrl, isObjRows, isDownloadRows, explodeDownloads } from './test-result-view.mjs';

let instance = null;

document.addEventListener('alpine:init', () => {
  Alpine.data('testModal', () => ({
    title: 'Test result',
    status: '',
    isError: false,
    showingRaw: false,
    showUrl: false,
    url: '',
    result: null,
    current: null,
    publish: null,
    running: false,
    committing: false,

    _dlg: null,
    init() { instance = this; this._dlg = this.$el; },

    get vm() { return this.result == null ? null : classify(this.result); },
    get rawText() { return this.result == null ? '' : JSON.stringify(this.result, null, 2); },

    open(opts) {
      this.current = { endpoint: opts.endpoint, buildBody: opts.buildBody };
      this.publish = opts.publish || null;
      this.result = null;
      this.showingRaw = false;
      this.status = '';
      this.isError = false;
      this.title = 'Test result' + (opts.stageLabel ? ' · ' + opts.stageLabel : '');
      this.showUrl = !!opts.urlInput;
      this.url = opts.initialUrl || '';
      this._dlg.showModal();
      if (this.showUrl) this.$nextTick(() => this.$refs.url && this.$refs.url.focus());
      if (opts.autoRun) this.run(this.url);
    },
    close() { this._dlg.close(); },
    toggle() { this.showingRaw = !this.showingRaw; },

    run(url) {
      let body;
      try { body = this.current.buildBody(url); }
      catch (err) { this.setStatus(err && err.message ? err.message : 'invalid config', true); return; }
      this.result = null;
      this.showingRaw = false;
      this.setStatus('Testing… browser stages can take a while.', false);
      this.running = true;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 130000);
      fetch(this.current.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
        .then((r) => r.json().catch(() => ({ ok: false, error: 'bad response (' + r.status + ')' })))
        .then((data) => {
          if (data && data.ok) { this.result = data.result || {}; this.setStatus('', false); }
          else { this.setStatus((data && data.error) || 'test failed', true); }
        })
        .catch((err) => this.setStatus(err && err.name === 'AbortError' ? 'Test timed out.' : 'Test request failed.', true))
        .finally(() => { clearTimeout(timer); this.running = false; });
    },
    setStatus(msg, isError) { this.status = msg || ''; this.isError = !!isError; },

    commit() {
      if (!this.publish || this.committing) return;
      const go = () => {
        let body;
        try { body = this.publish.buildBody(this.url); }
        catch (err) { this.setStatus(err && err.message ? err.message : 'invalid request', true); return; }
        this.committing = true;
        this.setStatus('Injecting…', false);
        fetch(this.publish.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
          .then((r) => r.text().then((t) => ({ status: r.status, text: t })))
          .then(({ status, text }) => {
            const ok = status >= 200 && status < 300 && !/border-warn/.test(text);
            const m = text.match(/>([^<]+)<\/div>/);
            const msg = (m && m[1].trim()) || (ok ? 'Injected.' : 'Inject failed.');
            this.setStatus(msg, !ok);
            if (ok) setTimeout(() => this.close(), 1200);
          })
          .catch(() => this.setStatus('Inject request failed.', true))
          .finally(() => { this.committing = false; });
      };
      const msg = this.publish.confirmMsg || 'Inject this URL?';
      if (window.confirmModal) {
        window.confirmModal(msg, 'Inject').then((y) => { if (y) go(); });
      } else if (window.confirm(msg)) {
        go();
      }
    },

    isUrl, isImageUrl,
    cellKind(v) {
      if (v == null) return 'empty';
      if (isUrl(v)) return 'url';
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return 'scalar';
      if (Array.isArray(v) && v.every((x) => x == null || typeof x !== 'object')) return v.some(isUrl) ? 'mixed' : 'joined';
      return 'json';
    },
    joined(v) { return v.join(', '); },
    jsonCell(v) { const s = JSON.stringify(v); return s.length > 200 ? s.slice(0, 200) + '…' : s; },
    fieldKind(k, v) {
      if (isImageUrl(k, v)) return 'image';
      if (isObjRows(v)) return isDownloadRows(v) ? 'downloads' : 'rows';
      if (Array.isArray(v) && v.length) {
        if (v.some(isUrl)) return 'urls';
        if (v.every((x) => x != null && typeof x !== 'object')) return 'pills';
      }
      return 'cell';
    },
    fieldRows(v) { return v; },
    fieldDownloads(v) { return explodeDownloads(v); },
    rowCols(rows) {
      const cols = []; const seen = {};
      for (const r of rows) for (const k of Object.keys(r)) if (!seen[k]) { seen[k] = 1; cols.push(k); }
      return cols;
    },
    copy(text, ev) {
      if (!(navigator.clipboard && navigator.clipboard.writeText)) return;
      const b = ev.currentTarget; const o = b.textContent;
      navigator.clipboard.writeText(text).then(() => { b.textContent = '✓'; setTimeout(() => { b.textContent = o; }, 1200); }, () => {});
    },
  }));
});

window.TestModal = { open: (opts) => { if (instance) instance.open(opts); } };
