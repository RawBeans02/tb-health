// Install page: the line for the installed app, the one-tap button and the line that says
// how it went (Install.dc.html). The installed line and the button are hidden in the HTML,
// so without JavaScript only the steps show (step 15.6). Here they follow the html
// attributes: the installed line in the installed app (data-standalone, set before paint,
// when install-order.js has already shown it), the button while the browser offers to
// install (data-installable, set and cleared by pwa.ts) and never in the installed app.
import { promptInstall } from './pwa.ts';

const html = document.documentElement;
const done = document.querySelector<HTMLElement>('.install-done');
const action = document.querySelector<HTMLElement>('.install-action');
const button = document.querySelector<HTMLButtonElement>('[data-install]');
const status = document.querySelector<HTMLElement>('[data-install-status]');

const sync = () => {
  const standalone = html.dataset.standalone === 'true';
  if (done) done.hidden = !standalone;
  if (action) action.hidden = standalone || html.dataset.installable !== 'true';
};
sync();
new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['data-standalone', 'data-installable'] });

const say = (key: 'done' | 'later' | '') => {
  if (status) status.textContent = key ? (status.dataset[key] ?? '') : '';
};

button?.addEventListener('click', async () => {
  const outcome = await promptInstall();
  say(outcome === 'accepted' ? 'done' : outcome === 'dismissed' ? 'later' : '');
});
addEventListener('tbph:installed', () => say('done'));
