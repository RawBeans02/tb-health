// The installable-app helper (the prototype's pwa.js), on every page. Chrome's own install
// banner is held back; the Install page offers the prompt after showing what the app does.
// html[data-installable] lets pages show their install button. Step 11 adds the service
// worker here.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const html = document.documentElement;
let deferred: BeforeInstallPromptEvent | null = null;

addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferred = event as BeforeInstallPromptEvent;
  html.setAttribute('data-installable', 'true');
  dispatchEvent(new CustomEvent('tbph:installable'));
});

addEventListener('appinstalled', () => {
  deferred = null;
  html.removeAttribute('data-installable');
  html.setAttribute('data-installed', 'true');
  dispatchEvent(new CustomEvent('tbph:installed'));
});

/** Shows the browser's install prompt, once per captured event. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferred;
  if (!event) return 'unavailable';
  deferred = null;
  html.removeAttribute('data-installable');
  await event.prompt();
  return (await event.userChoice).outcome;
}
