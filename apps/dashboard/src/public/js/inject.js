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
  if (!btn || !window.TestModal) return;
  btn.addEventListener('click', function () {
    var source = (document.getElementById('inject-source') || {}).value;
    var stage = (document.getElementById('inject-stage') || {}).value;
    var url = (document.getElementById('inject-url') || {}).value;
    window.TestModal.open({
      stageLabel: stage,
      endpoint: '/inject/test',
      buildBody: function (u) { return { source: source, stage: stage, url: u }; },
      initialUrl: url,
      autoRun: true,
    });
  });
})();
