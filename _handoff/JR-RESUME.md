# JR resume — TB Health

## Done
- Folder, git repo and builder rules (`CLAUDE.md`) set up. Remote: https://github.com/RawBeans02/tb-health (owner pushes).
- Claude Design handoff v6 imported into `design/design_handoff_tb_ph/` (30 Oct 2026).
- Handoff studied in full: README, every prototype page, `tbph-core.js`, the content pack, SOT checklist, audit and notes, data files, pipeline scripts (read, not run) (30 Oct 2026).
- `docs/PLAN.md` written (30 Oct 2026): stack choice (Astro 7 static + Preact islands + TypeScript + plain CSS tokens, self-hosted fonts, Workbox SW, Vitest + Playwright, npm), a 15-step build plan with the Home planner as the first full slice, and owner questions with defaults. The Account Admin relayed §7.1 to the owner on 30 Oct 2026.
- Review status: a five-angle independent review (spec coverage, rules/privacy, stack facts, sequencing/tests, owner questions) was started on 30 Oct but **failed**: the Mac slept and lost the network, and no critic returned findings. Only the stack critic's lookups were recovered. Its corrections were applied to PLAN.md §3 and §4.5: CSP through Astro's `security.csp` hashes, `Referrer-Policy: strict-origin-when-cross-origin` (OSM tiles need a Referer), the SW source bundled before `injectManifest`, npm instead of the old Homebrew pnpm 9, explicit style units for Preact 11. The other four angles were never reviewed; rerun them if the owner or Account Admin wants.
- Committed on branch `plan/build-plan` (4 Nov 2026). The owner pushed it the same day, and it tracks `origin/plan/build-plan`. Pushes stay with the owner, through the Account Admin.
- 4 Nov 2026: the four review angles that failed were rerun (spec coverage, rules/privacy, sequencing/tests, owner questions), each with a skeptic verify pass. There were 46 findings, no blockers, and every serious one was confirmed or partly confirmed. PLAN.md was rewritten to match:
  - §4.2 language design: links stay in the page's language, toggle links, in-place switch only where state would be lost, saved-choice redirect;
  - one Place renderer + `place/404`;
  - shared UI parts in `src/ui/` as Preact;
  - CSP and PWA attributes from step 1/2;
  - service workers blocked in default tests;
  - an explicit precache;
  - a synthetic 2,100-row fixture;
  - the run shape on the 8 GB Mac and the visual-check method;
  - the host treated as a data processor;
  - no builder-written copy;
  - Q3 premise corrected, Q2/Q4–Q8 reworded, new Q9–Q13, D23–D25.

  Results sent to the TB Health lead.
- **4 Nov 2026: plan approved**, Q2/Q3 answered (`docs/decisions.md`, lead's file). PLAN.md marked approved on `plan/build-plan` (`ba3ee92`).
- **4 Nov 2026: step 1 (scaffold) built** on `build/01-scaffold`, **approved by the lead** the same day with no changes (installer pin added after review):
  - Astro 7.4.5 static (`trailingSlash: 'never'`, `build.format: 'file'`), Preact 11.1.1, TypeScript 6.0.3 strict, `security.csp` on (meta tag, hashes; img/font/connect `'self'` only, no OSM until Q5).
  - `tokens.css` (all README tokens), `global.css` (reset, focus, links). Fonts through Astro's fonts API from the Fontsource packages, woff2 only, with metric-matched fallbacks.
  - Icons copied to `public/icons/`; BaseLayout with the prototype's head tags; a placeholder `/`.
  - `data/` copied from the handoff. `scripts/prepare-data.mjs` validates the data, writes the slimmed `public/data/facilities.json` and `src/generated/region-counts.json` (both git-ignored), with `--synthetic` for 2,100 fake rows. Place ids pass through unchanged as a **Q6 stub**. The gazetteer comes in step 3 with the ported core.
  - Vitest (9 tests for prepare-data), Playwright (Chromium + WebKit, service workers blocked, fixed synthetic geolocation without permission), `scripts/serve-dist.mjs` (slashless files, 308 for `/x/` and `/x.html`, nearest `404.html`).
- Node 22.23.4 installed through nvm for this folder only and pinned in `.nvmrc` (owner said yes via the Account Admin session, 30 Oct 2026). nvm's default alias (`16`) and the Homebrew/global Node were left unchanged, because the KitaMo builders use them. Don't change them.

## Next
1. **Steps 2 onward, back to back** (lead, 4 Nov 2026): each step on its own branch cut from the previous one, staged by path. At the end of each, send the lead a short report (commits, test results, guard peak line, deviations), then start the next one straight away without waiting for review. The lead messages if something needs fixing.
2. Stop and ask the lead only for: a genuinely open question; anything needing new copy, a new service or a pipeline run; failing tests I can't fix; a big change to the plan.
3. Step 4 (Home): send the lead how to run the owner demo (command, URL, states to try, what's stubbed), then carry on with step 5 without waiting.
4. **Before step 12, ask the lead about Q7** (host and domain). Until then use the placeholder domain, flagged in `launch-check`.
5. Step 2 notes: `npx playwright install chromium webkit` is approved; run it when step 2 first needs it. Log Q2a's toggle change in `docs/copy-overrides.md`. Astro puts the CSP `<meta>` after the font `<style>` blocks, and a meta CSP only covers what comes after it, so the pre-paint script goes after the CSP meta.
- Checkout: this checkout is mine and I own branch switching. The lead only edits `docs/decisions.md`, reviews with `git show`/`git diff`, and tells me before committing a decision by path on my current branch.
- Git hygiene: stage commits by path (`git add <files>`), never `git add -A` or `git add .`, so the lead's files don't get swept in.

## How to run things
- Every shell: `. ~/.nvm/nvm.sh && nvm use` (reads `.nvmrc`) before any node/npm command. Package manager is npm; leave the Homebrew pnpm alone.
- Fresh checkout: `npm ci` (the bundled npm 10.9.9 is fine for that). **Adding or updating packages: `npx -y npm@11.21.1 install …`** (pinned, so installs repeat exactly), because npm 10's installer crashes on this tree (`reading 'edgesOut'`). Pin exact versions.
- Scripts: `npm run build` (prepare-data + astro build), `npm run build:synthetic` (2,100 fake facilities, for scale only; rebuild normally afterwards), `npm run check` (astro check), `npm test` (Vitest), `npm run test:e2e -- --project=chromium` (Playwright against `dist/`, build first), `npm run serve` (dist/ on http://127.0.0.1:4322).
- Heavy jobs (check, build, tests, Playwright, Lighthouse), one guarded job each, one Playwright project per job: `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && npm run <script>'`. Keep the guard's `peak … GB` line as evidence for each step.
- View the prototype: `cd design/design_handoff_tb_ph/prototype && python3 -m http.server 8080` (it loads React and fonts from CDNs).

## Contacts
- **Lead: the "TB Health" desktop session** in `~/Documents/tb-health`, at `uds:/tmp/cc-socks/22329.sock` (4 Nov 2026). It leads the project and talks to the owner directly. Send it review results, questions, status, **pushes and owner questions** (from 4 Nov 2026), and take tasks from it. Batch questions into one message.
- **Account Admin:** only for Mac problems (pushes go through the lead from 4 Nov 2026). Its address was `uds:/tmp/cc-socks/19695.sock` on 4 Nov 2026 (`2530.sock` is stale).
- Socket addresses change when a session restarts, so reply to the `from` address of each session's latest message. These sessions don't show in `ListAgents`. Never send TB Health questions to KitaMo sessions.
- The gh account on this Mac has read access only, so pushes stay with the owner.
- This builder is full-time on TB Health (the owner retired its KitaMo session, 4 Nov 2026). The KitaMo rules in `CLAUDE.md` still apply.

## Open questions
- `docs/PLAN.md` §7.1. Q1–Q3 answered (Q2, Q3 on 4 Nov 2026, see `docs/decisions.md`). Open questions go through the TB Health lead, who asks the owner before the steps that need them:
  - Before specific steps: Q4 URL privacy and location (incl. bare place links, Place distance), Q5 OSM tiles + who writes the privacy text, Q6 facility data and ids, Q7 host/account/domain/deploy model, Q9 launching without Check, Q10 Check question title colour.
  - Before launch: Q8 full facility list (Nominatim, OSM credit), Q11 WHO 2026 refresh, Q12 lapsed accreditations, Q13 no-X-ray rule.
- The owner supplies the Filipino descriptions for About, Data, Install, Learn and Place later (Q3). They are `owner` strings, blocking in `launch-check`; I write none.
