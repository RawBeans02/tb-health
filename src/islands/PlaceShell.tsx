// The place shell (PLAN §4.4): /place and /fil/place, which the service worker serves at the
// address of a place page that isn't saved yet. It reads the id from the address and renders
// the same PlaceDetails from the saved facility list, or the place page's missing state.
import { useEffect, useState } from 'preact/hooks';
import { loadFacilities } from '../lib/core/data.ts';
import type { Place } from '../lib/core/facility.ts';
import { href, type Lang } from '../lib/i18n.ts';
import { placeDetails } from '../lib/place-details.ts';
import PlaceDetails, { type PlaceStrings } from './PlaceDetails.tsx';

export type ShellStrings = PlaceStrings & Record<'loading' | 'failed' | 'retry' | 'notFoundTitle', string>;

interface Props {
  lang: Lang;
  t: ShellStrings;
}

type State = { kind: 'loading' | 'missing' | 'error' } | { kind: 'ready'; place: Place; sample: boolean };

/** The missing state of an unknown place, as place/404 shows it. */
export function PlaceMissing({ lang, t }: { lang: Lang; t: Pick<PlaceStrings, 'missing' | 'seeMore'> }) {
  return (
    <div class="place-missing">
      <h1 class="place-name">{t.missing}</h1>
      <a class="btn btn--primary" href={href('places', lang)}>
        {t.seeMore}
      </a>
    </div>
  );
}

function idFromAddress(): string {
  try {
    return decodeURIComponent(location.pathname.split('/').pop() ?? '');
  } catch {
    return '';
  }
}

export default function PlaceShell({ lang, t }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  function load() {
    setState({ kind: 'loading' });
    const id = idFromAddress();
    loadFacilities().then(
      (data) => {
        const place = data.byId.get(Object.hasOwn(data.aliases, id) ? data.aliases[id] : id);
        setState(place ? { kind: 'ready', place, sample: data.sample } : { kind: 'missing' });
      },
      () => setState({ kind: 'error' }),
    );
  }

  useEffect(load, []);

  useEffect(() => {
    if (state.kind === 'ready') document.title = `${state.place.name} — TB PH`;
    if (state.kind === 'missing') document.title = t.notFoundTitle;
  }, [state]);

  if (state.kind === 'ready') return <PlaceDetails place={state.place} lang={lang} t={t} details={placeDetails(state.place, t, lang)} sample={state.sample} />;
  if (state.kind === 'missing') return <PlaceMissing lang={lang} t={t} />;
  if (state.kind === 'loading') {
    return (
      <p class="place-shell-status" role="status">
        {t.loading}
      </p>
    );
  }
  return (
    <div class="place-missing" role="alert">
      <p class="place-shell-status">{t.failed}</p>
      <button type="button" class="btn btn--soft btn--md" onClick={load}>
        {t.retry}
      </button>
    </div>
  );
}
