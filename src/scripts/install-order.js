// Install page, inline right after the platform sections so it runs before paint
// (Install.dc.html). The HTML hides the installed app's line, so that without JavaScript
// only the steps show (step 15.6): in the installed app this shows it, and install.ts keeps
// it in line with html[data-standalone] from then on. Then it puts the steps in order:
// iPhone first on iOS; the computer steps (hidden otherwise) first on a desktop. Reads
// html[data-standalone] and html[data-platform], set by prepaint.js.
(function () {
  var d = document.documentElement;
  var platform = d.getAttribute('data-platform');
  var list = document.currentScript.previousElementSibling;
  if (d.getAttribute('data-standalone') === 'true') list.parentNode.querySelector('.install-done').hidden = false;
  var android = list.querySelector('#android');
  if (platform === 'ios') list.insertBefore(list.querySelector('#ios'), android);
  if (platform === 'desktop') {
    var desktop = list.querySelector('#desktop');
    desktop.hidden = false;
    list.insertBefore(desktop, android);
  }
})();
