// Install (README:250, v4 from v5; Install.dc.html). The pack has no Install copy, so the
// strings are the prototype's.
import { ui, type Dict } from './types.ts';

const file = 'Install.dc.html';

export const install = {
  h1: ui('Use TB PH like an app.', 'Gamitin ang TB PH na parang app.', file),
  lead: ui(
    'Add it to your home screen. It opens full screen, and once it has been opened, the planner, the symptom check and Learn still work without a signal.',
    'Idagdag ito sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner, ang symptom check at ang Alamin kahit walang signal.',
    file,
  ),
  // Q9: a build without Check (TBPH_CHECK=false) ships this instead of `lead`, which names the check.
  leadNoCheck: {
    en: '',
    fil: '',
    origin: 'owner',
    src: ['owner', 'owner'],
    note:
      'Q9: install.lead without the symptom check, for a build without Check. The owner approves the wording.',
  },
  button: ui('Install TB PH', 'I-install ang TB PH', file),
  installed: ui("TB PH is installed. You're using the app.", 'Naka-install na ang TB PH. Ginagamit mo na ang app.', file),
  done: ui('Installed. Look for TB PH on your home screen.', 'Na-install na. Hanapin ang TB PH sa home screen mo.', file),
  later: ui('No problem. You can install it any time from this page.', 'Walang problema. Puwede mo itong i-install anumang oras mula sa pahinang ito.', file),

  android: ui('On Android (Chrome)', 'Sa Android (Chrome)', file),
  android1: ui(
    'Tap Install TB PH on this page. If you don’t see it, open the browser menu (⋮) and tap Install app or Add to Home screen.',
    'I-tap ang I-install ang TB PH sa pahinang ito. Kung wala ito, buksan ang menu ng browser (⋮) at i-tap ang Install app o Add to Home screen.',
    file,
  ),
  android2: ui('Confirm.', 'Kumpirmahin.', file),
  android3: ui('Open TB PH from your home screen.', 'Buksan ang TB PH mula sa home screen mo.', file),

  ios: ui('On iPhone or iPad (Safari)', 'Sa iPhone o iPad (Safari)', file),
  ios1: ui(
    'Open this page in Safari, then tap the Share button (a square with an arrow pointing up).',
    'Buksan ang pahinang ito sa Safari, saka i-tap ang Share button (parisukat na may arrow na nakaturo pataas).',
    file,
  ),
  ios2: ui('Scroll down and tap Add to Home Screen.', 'Mag-scroll pababa at i-tap ang Add to Home Screen.', file),
  ios3: ui('Tap Add. TB PH appears on your home screen.', 'I-tap ang Add. Lalabas ang TB PH sa home screen mo.', file),

  desktop: ui('On a computer (Chrome or Edge)', 'Sa computer (Chrome o Edge)', file),
  desktop1: ui(
    'Click the install icon at the right end of the address bar, or open the browser menu and choose Install TB PH.',
    'I-click ang install icon sa dulong kanan ng address bar, o buksan ang menu ng browser at piliin ang Install TB PH.',
    file,
  ),
  desktop2: ui('Confirm.', 'Kumpirmahin.', file),
  desktop3: ui('Open TB PH from your apps or desktop.', 'Buksan ang TB PH mula sa iyong apps o desktop.', file),

  offH: ui('What works without a signal', 'Ano ang gumagana kahit walang signal', file),
  off1: ui('The route planner, using the saved list of centers', 'Ang route planner, gamit ang naka-save na listahan ng mga center', file),
  off2: ui('The symptom check', 'Ang symptom check', file),
  off3: ui('Learn about TB and the data', 'Ang Alamin ang TB at ang datos', file),
  offNote: ui(
    'Directions, maps and calls still need a connection. Open TB PH once with a signal so it can save itself on your phone.',
    'Kailangan pa rin ng koneksiyon para sa direksiyon, mapa at tawag. Buksan muna ang TB PH nang may signal para ma-save nito ang sarili sa phone mo.',
    file,
  ),
  privacy: ui(
    "Installing doesn't create an account and doesn't share anything about you. It only saves TB PH's pages and data on your phone.",
    'Walang account na gagawin at walang ibinabahaging impormasyon tungkol sa iyo ang pag-install. Sine-save lang nito ang mga pahina at datos ng TB PH sa phone mo.',
    file,
  ),
} satisfies Dict;
