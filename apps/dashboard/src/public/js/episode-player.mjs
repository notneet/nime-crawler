document.addEventListener('alpine:init', () => {
  Alpine.data('player', (initial) => ({
    src: '',
    label: '',
    playingId: initial == null || initial === '' ? null : String(initial),
    init() {
      const f = this.$refs.frame;
      if (f) this.src = f.getAttribute('src') || '';
      const l = this.$refs.label;
      if (l) this.label = l.textContent.trim();
    },
    play(id, stream, quality, host) {
      this.src = stream;
      this.label = quality + ' · ' + host;
      this.playingId = String(id);
    },
  }));
});
