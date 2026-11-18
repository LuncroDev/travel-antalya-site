/* Loads Instagram's embed script only when the feed nears the viewport. */
(function () {
  var g = document.getElementById('social-grid'); if (!g) return;
  function load() {
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.instagram.com/embed.js';
    s.onload = function () { if (window.instgrm) window.instgrm.Embeds.process(); }; document.body.appendChild(s);
  }
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '300px' }); io.observe(g); } else load();
})();
