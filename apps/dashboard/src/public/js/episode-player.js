(function () {
  var frame = document.getElementById('player-frame');
  if (!frame) return;
  var label = document.getElementById('player-label');
  function activate(row) {
    document.querySelectorAll('tr[data-mirror-id].is-playing').forEach(function (r) {
      r.classList.remove('is-playing');
    });
    if (row) row.classList.add('is-playing');
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-play');
    if (!btn) return;
    frame.src = btn.dataset.stream;
    if (label) label.textContent = btn.dataset.quality + ' · ' + btn.dataset.host;
    activate(btn.closest('tr[data-mirror-id]'));
  });
  var initial = frame.dataset.initial || null;
  if (initial != null) activate(document.querySelector('tr[data-mirror-id="' + initial + '"]'));
})();
