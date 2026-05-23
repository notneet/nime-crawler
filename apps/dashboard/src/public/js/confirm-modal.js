// shared confirm modal: replaces native window.confirm for every hx-confirm
(function () {
  var modal = document.getElementById('confirm-modal');
  var msg = document.getElementById('confirm-message');
  var ok = document.getElementById('confirm-ok');
  var cancel = document.getElementById('confirm-cancel');
  var pending = null;
  var resolver = null;
  function open(question, label) {
    msg.textContent = question;
    label = label || 'Delete';
    ok.textContent = label;
    ok.className = 'btn ' + (label === 'Delete' ? 'btn-danger' : 'btn-acid');
    modal.showModal();
  }
  // Promise-based API for non-htmx callers (e.g. client-side editor deletes).
  window.confirmModal = function (question, label) {
    return new Promise(function (resolve) { resolver = resolve; open(question, label); });
  };
  document.addEventListener('htmx:confirm', function (e) {
    if (!e.detail.question) return; // no hx-confirm → proceed normally
    e.preventDefault();
    pending = e.detail;
    open(e.detail.question, (e.detail.elt && e.detail.elt.getAttribute('data-confirm-label')) || 'Delete');
  });
  ok.addEventListener('click', function () {
    modal.close();
    if (pending) { pending.issueRequest(true); pending = null; }
    if (resolver) { resolver(true); resolver = null; }
  });
  function dismiss() {
    if (resolver) { resolver(false); resolver = null; }
    pending = null;
  }
  cancel.addEventListener('click', function () { dismiss(); modal.close(); });
  modal.addEventListener('cancel', dismiss); // Esc key
})();
