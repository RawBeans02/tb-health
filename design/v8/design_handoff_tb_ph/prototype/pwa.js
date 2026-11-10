/* TB PH: installable-app helper. Registers the service worker and exposes window.TBPH_PWA.
   Pages build their own UI on top (Install page, footer link, About). No UI is injected here. */
(function () {
  var html = document.documentElement;
  var api = { deferred: null };
  function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) {} }
  api.isStandalone = function () {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  };
  api.platform = function () {
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  };
  api.canInstall = function () { return !!api.deferred; };
  api.promptInstall = function () {
    if (!api.deferred) return Promise.resolve('unavailable');
    var ev = api.deferred; api.deferred = null; html.removeAttribute('data-installable');
    ev.prompt();
    return ev.userChoice.then(function (c) { emit('tbph:installchoice', { outcome: c.outcome }); return c.outcome; });
  };
  // Keep Chrome's automatic banner from appearing on first load; pages offer install after showing value.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); api.deferred = e; html.setAttribute('data-installable', 'true'); emit('tbph:installable');
  });
  window.addEventListener('appinstalled', function () {
    api.deferred = null; html.setAttribute('data-installed', 'true'); emit('tbph:installed');
  });
  function net() { html.setAttribute('data-online', navigator.onLine ? 'true' : 'false'); emit(navigator.onLine ? 'tbph:online' : 'tbph:offline'); }
  window.addEventListener('online', net); window.addEventListener('offline', net); net();
  html.setAttribute('data-standalone', api.isStandalone() ? 'true' : 'false');
  html.setAttribute('data-platform', api.platform());
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) { api.registration = reg; emit('tbph:sw-ready'); }).catch(function () {});
    });
  }
  window.TBPH_PWA = api;
})();
