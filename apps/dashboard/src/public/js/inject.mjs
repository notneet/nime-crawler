document.addEventListener('alpine:init', () => {
  Alpine.data('injectForm', () => ({
    sources: [],
    source: '',
    stage: '',
    init() {
      const island = document.getElementById('inject-sources');
      this.sources = island ? JSON.parse(island.textContent || '[]') : [];
      if (this.sources.length) this.source = this.sources[0].source;
      this.syncStage();
    },
    get current() {
      return this.sources.find((s) => s.source === this.source) || null;
    },
    get stages() {
      return this.current ? this.current.stages : [];
    },
    get hint() {
      return this.current ? 'must start with ' + this.current.baseUrl : '';
    },
    syncStage() {
      const list = this.stages;
      if (!list.includes(this.stage)) this.stage = list[0] || '';
    },
    test() {
      if (!window.TestModal) return;
      const noDiscoverEl = this.$root.querySelector('input[name="noDiscover"]');
      window.TestModal.open({
        stageLabel: this.stage,
        endpoint: '/inject/test',
        buildBody: (u) => ({ source: this.source, stage: this.stage, url: u }),
        initialUrl: this.$refs.url.value,
        urlInput: true,
        autoRun: true,
        publish: {
          endpoint: '/inject',
          confirmMsg: 'Inject this URL into the crawl pipeline?',
          buildBody: (u) => ({
            source: this.source,
            stage: this.stage,
            url: u,
            noDiscover: noDiscoverEl && noDiscoverEl.checked ? 'on' : '',
          }),
        },
      });
    },
  }));
});
