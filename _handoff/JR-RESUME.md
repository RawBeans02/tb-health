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
- Node 22.23.4 installed through nvm for this folder only and pinned in `.nvmrc` (owner said yes via the Account Admin session, 30 Oct 2026). nvm's default alias (`16`) and the Homebrew/global Node were left unchanged, because the KitaMo builders use them. Don't change them.

## Next
1. Wait for the owner to approve `docs/PLAN.md` and answer §7.1 (Q2 and Q3 at least). Approval, answers and next tasks come from the **TB Health** lead session. Don't poll or schedule /loop wakeups: the lead messages when there's news.
2. The lead records the owner's answers in `docs/decisions.md`. **That file is the lead's: read it, don't edit it.** Update PLAN.md to match the answers.
3. Step 1 (scaffold) on branch `build/01-scaffold`, only after the lead says the owner approved. The lead will suggest working in a separate git worktree, so we aren't both editing this checkout.
- Git hygiene: stage commits by path (`git add <files>`), never `git add -A` or `git add .`, so the lead's files don't get swept in.

## How to run things
- Every shell: `. ~/.nvm/nvm.sh && nvm use` (reads `.nvmrc`) before any node/npm command. Package manager is npm (ships with the pinned Node); leave the Homebrew pnpm alone.
- Heavy jobs (build, Playwright, Lighthouse): `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && npm run <script>'`.
- View the prototype: `cd design/design_handoff_tb_ph/prototype && python3 -m http.server 8080` (it loads React and fonts from CDNs).

## Contacts
- **Lead: the "TB Health" desktop session** in `~/Documents/tb-health`, at `uds:/tmp/cc-socks/22329.sock` (4 Nov 2026). It leads the project and talks to the owner directly. Send it review results, questions and status, and take tasks from it. Batch questions into one message.
- **Account Admin:** only for Mac problems or pushes. Its address was `uds:/tmp/cc-socks/19695.sock` on 4 Nov 2026 (`2530.sock` is stale).
- Socket addresses change when a session restarts, so reply to the `from` address of each session's latest message. These sessions don't show in `ListAgents`. Never send TB Health questions to KitaMo sessions.
- The gh account on this Mac has read access only, so pushes stay with the owner.
- This builder is full-time on TB Health (the owner retired its KitaMo session, 4 Nov 2026). The KitaMo rules in `CLAUDE.md` still apply.

## Open questions
- `docs/PLAN.md` §7.1 (revised 4 Nov 2026). The original Q2–Q8 were relayed to the owner by the Account Admin on 30 Oct 2026; the revised list goes through the TB Health lead.
  - Before I start: Q2 language URLs (incl. toggle links and the saved-choice redirect), Q3 copy source (incl. who supplies the missing Filipino descriptions, and whether a newer content pack exists).
  - Before specific steps: Q4 URL privacy and location (incl. bare place links, Place distance), Q5 OSM tiles + who writes the privacy text, Q6 facility data and ids, Q7 host/account/domain/deploy model, Q9 launching without Check, Q10 Check question title colour.
  - Before launch: Q8 full facility list (Nominatim, OSM credit), Q11 WHO 2026 refresh, Q12 lapsed accreditations, Q13 no-X-ray rule.
