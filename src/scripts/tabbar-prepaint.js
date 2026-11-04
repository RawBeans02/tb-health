// The tab bar's real height before first paint (audit B68). SiteHeader inlines this right
// after the bar, so the footer spacer and Check's Next start where they stay when the labels
// wrap (Filipino at tablet widths: 81px, not the 70px fallback, which moved the footer 11px
// after the first paint). tabbar.ts keeps it current afterwards. BaseLayout adds its hash.
(function () {
  var bar = document.currentScript && document.currentScript.previousElementSibling;
  var height = bar ? bar.getBoundingClientRect().height : 0;
  if (height > 0) document.documentElement.style.setProperty('--tabbar-h', Math.round(height) + 'px');
})();
