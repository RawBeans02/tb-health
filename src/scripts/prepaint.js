// Pre-paint, first thing in <body> so the CSP meta covers it; BaseLayout adds its hash.
// A reader whose saved choice is Filipino goes from any English page to its /fil twin,
// keeping query and hash (Q2b). Then the attributes pages read for the installed app and
// the offline lines, as the prototype's pwa.js sets them (PLAN §4.2, §4.5).
(function () {
  var d = document.documentElement;
  var l = location;
  try {
    if (d.lang === 'en' && localStorage.getItem('tbph-lang') === 'fil') {
      d.style.visibility = 'hidden';
      l.replace('/fil' + (l.pathname === '/' ? '' : l.pathname) + l.search + l.hash);
      return;
    }
  } catch (e) {}
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var ua = navigator.userAgent || '';
  var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  d.setAttribute('data-standalone', standalone ? 'true' : 'false');
  d.setAttribute('data-platform', ios ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop');
  function online() {
    d.setAttribute('data-online', navigator.onLine ? 'true' : 'false');
  }
  online();
  addEventListener('online', online);
  addEventListener('offline', online);
})();
