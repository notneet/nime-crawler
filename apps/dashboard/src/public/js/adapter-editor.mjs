import {
  STAGE_KEYS, ACTION_TYPES, CUSTOM_TYPES, serializeStages, cleanStage,
} from './adapter-serialize.mjs';

let uid = 0;

document.addEventListener('alpine:init', () => {
  Alpine.data('stageEditor', () => ({
    STAGE_KEYS,
    ACTION_TYPES,
    CUSTOM_TYPES,
    stages: {},
    addPick: '',
    error: '',

    init() {
      let parsed = {};
      try { parsed = JSON.parse(this.$refs.data.value || '{}'); } catch { parsed = {}; }
      const out = {};
      for (const k of STAGE_KEYS) if (parsed[k]) { out[k] = parsed[k]; this.normalize(out[k]); }
      this.stages = out;
      this.order.forEach((k, i) => { this.stages[k].__open = i === 0; });
      this.addPick = this.missing[0] || '';
    },

    get order() { return STAGE_KEYS.filter((k) => k in this.stages); },
    get missing() { return STAGE_KEYS.filter((k) => !(k in this.stages)); },

    normalize(stage) {
      if (!Array.isArray(stage.discover)) stage.discover = [];
      if (stage.engine === 'browser') {
        stage.workflow ||= { version: '1.0', actions: [] };
        stage.workflow.actions ||= [];
        stage.workflow.actions.forEach((a) => { if (a.__k == null) a.__k = ++uid; if (a.__open === undefined) a.__open = false; });
      } else {
        stage.patterns ||= [];
        stage.patterns.forEach((p) => this.normalizePattern(p));
      }
    },
    normalizePattern(p) {
      if (p.__k == null) p.__k = ++uid;
      p.patterns ||= [''];
      p.meta ||= {};
      p.meta.alterPattern ||= [];
      p.pipes ||= {};
      p.pipes.replace ||= [];
      p.pipes.custom ||= [];
      if (p.pipes.merge === true) p.pipes.merge = 'true';
      p.pipes.custom.forEach((c) => {
        if (c.__k == null) c.__k = ++uid;
        if (!CUSTOM_TYPES.includes(c.type) && c.__cjson === undefined) c.__cjson = JSON.stringify(c, null, 2);
        if (c.type === 'regex') c.rules ||= [{}];
      });
    },

    addStage() {
      const k = this.addPick;
      if (!k || k in this.stages) return;
      const s = { engine: 'xpath' };
      this.normalize(s);
      s.__open = true;
      this.stages[k] = s;
      this.addPick = this.missing[0] || '';
    },
    removeStage(k) {
      this.confirm('Delete the "' + k + '" stage?').then((y) => {
        if (y) { delete this.stages[k]; this.addPick = this.missing[0] || ''; }
      });
    },
    setEngine(stage) { this.normalize(stage); },

    addDiscover(stage) { stage.discover.push({ stage: 'detail', fromKey: '' }); },
    removeDiscover(stage, i) { stage.discover.splice(i, 1); },

    addAction(stage) { stage.workflow.actions.push({ __k: ++uid, __open: true, action: 'extract' }); },
    removeAction(stage, i) {
      this.confirm('Delete this action?').then((y) => { if (y) stage.workflow.actions.splice(i, 1); });
    },
    actionOptions(a) { return ACTION_TYPES.includes(a.action) ? ACTION_TYPES : [...ACTION_TYPES, a.action]; },
    summaryOf(a) { return (a.id && a.id.trim()) || a.action; },
    tgt(a) { return a.target || (a.target = { type: 'css' }); },
    opts(a) { return a.options || (a.options = {}); },

    addPattern(stage) { const p = {}; this.normalizePattern(p); stage.patterns.push(p); },
    removePattern(stage, i) {
      this.confirm('Delete this pattern?').then((y) => { if (y) stage.patterns.splice(i, 1); });
    },
    addXpath(p) { p.patterns.push(''); },
    removeXpath(p, i) { p.patterns.splice(i, 1); },
    addAlter(p) { p.meta.alterPattern.push(''); },
    removeAlter(p, i) { p.meta.alterPattern.splice(i, 1); },
    addReplace(p) { p.pipes.replace.push({ from: '', to: '' }); },
    removeReplace(p, i) { p.pipes.replace.splice(i, 1); },
    addCustom(p) { const c = { __k: ++uid, type: 'regex', rules: [{}] }; p.pipes.custom.push(c); },
    removeCustom(p, i) { p.pipes.custom.splice(i, 1); },
    customChange(c) {
      if (c.type === 'regex' && !c.rules) c.rules = [{}];
      if (!CUSTOM_TYPES.includes(c.type) && c.__cjson === undefined) c.__cjson = JSON.stringify({ type: c.type }, null, 2);
    },
    customOptions(c) { return CUSTOM_TYPES.includes(c.type) ? CUSTOM_TYPES : [...CUSTOM_TYPES, c.type]; },
    addRule(c) { c.rules.push({}); },
    removeRule(c, i) { c.rules.splice(i, 1); },

    confirm(msg) {
      return window.confirmModal ? window.confirmModal(msg) : Promise.resolve(window.confirm(msg));
    },

    serializeStage(stage) { return cleanStage(stage); },

    copy(text, ev) {
      if (!(navigator.clipboard && navigator.clipboard.writeText)) return;
      const b = ev.currentTarget;
      const o = b.textContent;
      navigator.clipboard.writeText(text).then(() => { b.textContent = '✓'; setTimeout(() => { b.textContent = o; }, 1200); }, () => {});
    },

    toggleJson(key) {
      const stage = this.stages[key];
      stage.__showJson = !stage.__showJson;
      if (stage.__showJson) {
        stage.__jsonStr = JSON.stringify(this.stageJson(stage), null, 2);
        stage.__jsonErr = '';
      }
    },

    applyJson(key, text) {
      const stage = this.stages[key];
      try {
        const parsed = JSON.parse(text);
        const { __open, __showJson, __jsonStr } = stage;
        this.stages[key] = { ...parsed };
        this.normalize(this.stages[key]);
        Object.assign(this.stages[key], { __open, __showJson, __jsonStr, __jsonErr: '' });
      } catch (e) {
        stage.__jsonErr = e.message;
      }
    },

    stageJson(stage) {
      const plain = JSON.parse(JSON.stringify(stage, (k, v) => k.startsWith('__') ? undefined : v));
      const out = cleanStage(plain);
      const disc = (plain.discover || []).map((d) => ({ stage: d.stage, fromKey: d.fromKey }));
      if (disc.length) out.discover = disc;
      return out;
    },

    onSubmit(e) {
      try {
        this.$refs.field.value = JSON.stringify(serializeStages(this.stages, this.order));
        this.error = '';
      } catch (err) {
        e.preventDefault();
        this.error = 'Invalid workflow JSON: ' + (err && err.message ? err.message : err);
      }
    },

    test(stage, key) {
      if (!window.TestModal) return;
      const baseUrl = (this.$root.querySelector('input[name="baseUrl"]') || {}).value || '';
      window.TestModal.open({
        stageLabel: key,
        endpoint: '/inject/test-config',
        urlInput: true,
        initialUrl: baseUrl,
        buildBody: (url) => ({ config: this.serializeStage(stage), url, baseUrl, stage: key }),
      });
    },
  }));
});
