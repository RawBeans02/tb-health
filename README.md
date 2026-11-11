# TB Health

Nonprofit internship project on TB (tuberculosis) health.

Status: build plan approved (`docs/PLAN.md`, 4 Nov 2026); building step by step.

Run (Node from `.nvmrc`): `npm run dev`, `npm run build`, `npm run serve`, `npm test`, `npm run test:e2e`, `npm run launch-check` (what's still open before launch). `TBPH_CHECK=false npm run build` builds without Check in the nav (Q9). Heavy runs on the shared Mac go through `_handoff/lowmem-run.sh` (see `_handoff/JR-RESUME.md`).

`npm run build` is the shipped list (PhilHealth's full TB-DOTS list), used for the budgets and the link check. The browser tests (`npm run test:e2e`) count on the 93-row sample instead: run `npm run build:sample` before them, and again after `npm run build:synthetic`, `npm run build:worst-case` or `npm run build:worst` (`npm run test:no-check` rebuilds it itself). `npm run build:worst` is a test build with the full list's worst rows behind a dev-only `?data=worst` switch, for `WORST_DIR=<folder> npx playwright test tests/e2e/worst.spec.ts --project=chromium` (step 15.4); `npm run dev` has the switch too. Never deploy it: every build checks that no other build ships the switch (`scripts/check-dev-only.mjs`), and launch-check blocks one that does. They serve `dist/` on this checkout's own port, 43000–43999 from its path (`TBPH_TEST_PORT` sets another), not on `npm run serve`'s 4322, so a server an earlier run left running is never another checkout's.

- `design/`: Claude Design export (unzipped)
- `docs/`: build plan, the owner's decisions, copy overrides for the owner to confirm
- `src/`, `public/`, `data/`, `scripts/`, `tests/`: the site (Astro 7 + Preact)
- `_handoff/`: builder notes and scripts
