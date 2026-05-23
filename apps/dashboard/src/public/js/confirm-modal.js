// shared confirm modal: replaces native window.confirm for every hx-confirm
(function () {
  var modal = document.getElementById('confirm-modal');
  var msg = document.getElementById('confirm-message');
  var ok = document.getElementById('confirm-ok');
  var cancel = document.getElementById('confirm-cancel');
  var pending = null;
  document.addEventListener('htmx:confirm', function (e) {
    if (!e.detail.question) return; // no hx-confirm → proceed normally
    e.preventDefault();
    pending = e.detail;
    msg.textContent = e.detail.question;
    var label = (e.detail.elt && e.detail.elt.getAttribute('data-confirm-label')) || 'Delete';
    var danger = label === 'Delete';
    ok.textContent = label;
    ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-acid');
    modal.showModal();
  });
  ok.addEventListener('click', function () {
    modal.close();
    if (pending) { pending.issueRequest(true); pending = null; }
  });
  cancel.addEventListener('click', function () { pending = null; modal.close(); });
  modal.addEventListener('cancel', function () { pending = null; }); // Esc key
})();
