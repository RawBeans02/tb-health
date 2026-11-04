// The installable-app helper (the prototype's pwa.js), on every page: registers the service
// worker (src/sw.ts) and holds back Chrome's own install banner, so the Install page can
// offer the prompt after showing what the app does. html[data-installable] lets pages show
// their install button.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const html = document.documentElement;
let deferred: BeforeInstallPromptEvent | null = null;

// Built sites only (the dev server has no sw.js), over HTTPS or on this machine. Absolute,
// so a page at any depth registers the same worker for the whole site.
if (import.meta.env.PROD && 'serviceWorker' in navigator && isSecureContext) {
  // A failed registration leaves the site as it is online.
  const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
  if (document.readyState === 'complete') register();
  else addEventListener('load', register, { once: true });
}

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
