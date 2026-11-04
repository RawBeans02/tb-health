// Install page, inline right after the platform sections so they are in order before
// paint: iPhone first on iOS; the computer steps (hidden otherwise) first on a desktop
// (Install.dc.html). Reads html[data-platform], set by prepaint.js.
(function () {
  var platform = document.documentElement.getAttribute('data-platform');
  var list = document.currentScript.previousElementSibling;
  var android = list.querySelector('#android');
  if (platform === 'ios') list.insertBefore(list.querySelector('#ios'), android);
  if (platform === 'desktop') {
    var desktop = list.querySelector('#desktop');
    desktop.hidden = false;
    list.insertBefore(desktop, android);
  }
})();
