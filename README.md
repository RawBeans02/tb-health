# TB Health

Nonprofit internship project on TB (tuberculosis) health.

Status: build plan approved (`docs/PLAN.md`, 4 Nov 2026); building step by step.

Run (Node from `.nvmrc`): `npm run dev`, `npm run build`, `npm run serve`, `npm test`, `npm run test:e2e`, `npm run launch-check` (what's still open before launch). `TBPH_CHECK=false npm run build` builds without Check in the nav (Q9). Heavy runs on the shared Mac go through `_handoff/lowmem-run.sh` (see `_handoff/JR-RESUME.md`).

- `design/`: Claude Design export (unzipped)
- `docs/`: build plan, the owner's decisions, copy overrides for the owner to confirm
- `src/`, `public/`, `data/`, `scripts/`, `tests/`: the site (Astro 7 + Preact)
- `_handoff/`: builder notes and scripts
