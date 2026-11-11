// Fail closed without JavaScript; use an absolute Antalya-midnight expiry.
(function () {
  const start = Date.parse('2026-11-09T00:00:00+03:00');
  const end = Date.parse('2026-11-14T00:00:00+03:00');
  function refresh() {
    const notice = document.getElementById('cop31-airport-advisory');
    if (notice) notice.hidden = !(Date.now() >= start && Date.now() < end);
  }
  refresh();
  setInterval(refresh, 1000);
  document.addEventListener('visibilitychange', refresh);
})();
