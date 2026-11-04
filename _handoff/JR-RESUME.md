# JR resume — TB Health

## Done
- Folder, git repo and builder rules (`CLAUDE.md`) set up. Remote: https://github.com/RawBeans02/tb-health (owner pushes).
- Claude Design handoff v6 imported into `design/design_handoff_tb_ph/` (30 Oct 2026).
- Handoff studied in full: README, every prototype page, `tbph-core.js`, the content pack, SOT checklist, audit and notes, data files, pipeline scripts (read, not run) (30 Oct 2026).
- `docs/PLAN.md` written (30 Oct 2026): stack choice (Astro 7 static + Preact islands + TypeScript + plain CSS tokens, self-hosted fonts, Workbox SW, Vitest + Playwright, npm), a 15-step build plan with the Home planner as the first full slice, and owner questions with defaults. The Account Admin relayed §7.1 to the owner on 30 Oct 2026.
- Review status: a five-angle independent review (spec coverage, rules/privacy, stack facts, sequencing/tests, owner questions) was started on 30 Oct but **failed**: the Mac slept and lost the network, and no critic returned findings. Only the stack critic's lookups were recovered. Its corrections were applied to PLAN.md §3 and §4.5: CSP through Astro's `security.csp` hashes, `Referrer-Policy: strict-origin-when-cross-origin` (OSM tiles need a Referer), the SW source bundled before `injectManifest`, npm instead of the old Homebrew pnpm 9, explicit style units for Preact 11. The other four angles were never reviewed; rerun them if the owner or Account Admin wants.
- Committed on local branch `plan/build-plan` (4 Nov 2026), not pushed. Pushes go through the owner and the Account Admin.
- Node 22.23.4 installed through nvm for this folder only and pinned in `.nvmrc` (owner said yes via the Account Admin session, 30 Oct 2026). nvm's default alias (`16`) and the Homebrew/global Node were left unchanged, because the KitaMo builders use them. Don't change them.

## Next
1. Wait for the owner to approve `docs/PLAN.md` and answer §7.1 (Q2 and Q3 at least). Answers come through the Account Admin session. Don't poll or schedule /loop wakeups: the Account Admin messages when there's news.
2. Record the answers in `docs/decisions.md` and update PLAN.md.
3. Step 1 (scaffold) on branch `build/01-scaffold`. Don't write app code before approval.

## How to run things
- Every shell: `. ~/.nvm/nvm.sh && nvm use` (reads `.nvmrc`) before any node/npm command. Package manager is npm (ships with the pinned Node); leave the Homebrew pnpm alone.
- Heavy jobs (build, Playwright, Lighthouse): `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && npm run <script>'`.
- View the prototype: `cd design/design_handoff_tb_ph/prototype && python3 -m http.server 8080` (it loads React and fonts from CDNs).

## Contacts
- Questions for the owner go to the **Account Admin** session. Reply to the `from` address of its **latest** message, because the address changes when that session restarts. It was `uds:/tmp/cc-socks/19695.sock` on 4 Nov 2026; the earlier `2530.sock` is stale. Batch questions into one message. The Account Admin also handles pushes with the owner. Never send TB Health questions to KitaMo sessions.
- This builder is full-time on TB Health (the owner retired its KitaMo session, 4 Nov 2026). The KitaMo rules in `CLAUDE.md` still apply.

## Open questions
- `docs/PLAN.md` §7.1: Q2 language URLs, Q3 copy source (and whether a newer content pack exists). Before specific steps: Q4 URL privacy and location prompt, Q5 third parties (fonts, Leaflet, OSM tiles) and the About privacy text, Q6 facility data handling, Q7 host and domain, Q8 full facility list (pipeline run). Relayed to the owner by the Account Admin on 30 Oct 2026; still unanswered on 4 Nov 2026.
