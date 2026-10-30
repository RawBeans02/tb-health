# TB Health — builder instructions

A side project for the owner's (Rovince's) nonprofit internship on TB (tuberculosis) health. The Jr. Builder builds it. It is **not** KitaMo.

## Sources of truth
- `design/design_handoff_tb_ph/README.md`: the build spec (screens, tokens, behavior, open items). Read it first, before choosing a stack or writing UI.
- `design/design_handoff_tb_ph/prototype/`: HTML design references to recreate pixel-accurately. They are not production code: port `tbph-core.js`, never `support.js`.
- `design/design_handoff_tb_ph/reference/content-and-data-pack.md`: the canonical EN/FIL copy and chart specs. `ultimate-build-source-of-truth.md` is the checklist the build is audited against.
- `docs/`: decisions made with the owner during the build.
- If the spec and the prototype disagree, the README wins. If something is still unclear, ask the owner. Don't guess.

## Medical content
- Health copy comes verbatim from the content pack. Don't write or reword medical advice, symptom-check questions or results.
- Leave `[VERIFY]` items and the pending clinical review (Check, Learn L6) marked as open; don't resolve them yourself.

## External services
- Ask the owner before running the `pipeline/` scripts that download from PhilHealth or geocode addresses (Nominatim or Google), and before adding any third-party service, analytics or API key. The site is static and frontend-only by design.

## Keep it separate from KitaMo
- Don't read, write or run anything in `~/Documents/KitaMo-ph`. Don't reuse KitaMo code, keys or Supabase projects.
- Questions about this project go to the owner, not to the KitaMo lead.

## Health data
- **Synthetic data only.** Never put real patient names, IDs, contact details, test results or photos in code, fixtures, seeds, screenshots or logs.
- Health information is sensitive personal information under the Philippine Data Privacy Act (RA 10173). Design for that: least data collected, access controls, nothing sensitive in URLs or analytics.

## Machine rules (8 GB Mac shared with the KitaMo builders)
- Run heavy commands (Docker, full test suites, production builds, browser tests) through `_handoff/lowmem-run.sh <cmd>`. Add `GUARD_NO_DOCKER=1` for jobs that don't need Docker.
- It shares the machine-wide lock `/tmp/kitamo-heavy.lock` on purpose, so jobs queue behind KitaMo's. Never clear that lock by hand.
- Deleted files go to the Trash (`/usr/bin/trash`), never `rm -rf`.

## Git and GitHub
- Commit locally on branches. Pushes, repo creation and merges to `main` on GitHub are run by the owner: prepare them and hand over one command.
- No secrets in the repo; `.env*` files stay local.

## Handoff
- Keep `_handoff/JR-RESUME.md` current (what's done, what's next, open questions) so a fresh session can pick up.
