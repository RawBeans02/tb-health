// Install page: the one-tap button (shown by CSS while html[data-installable] is set) and
// the line that says how it went (Install.dc.html).
import { promptInstall } from './pwa.ts';

const button = document.querySelector<HTMLButtonElement>('[data-install]');
const status = document.querySelector<HTMLElement>('[data-install-status]');

const say = (key: 'done' | 'later' | '') => {
  if (status) status.textContent = key ? (status.dataset[key] ?? '') : '';
};

button?.addEventListener('click', async () => {
  const outcome = await promptInstall();
  say(outcome === 'accepted' ? 'done' : outcome === 'dismissed' ? 'later' : '');
});
addEventListener('tbph:installed', () => say('done'));
