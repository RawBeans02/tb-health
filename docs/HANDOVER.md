# TB PH: handover

How to take the build to launch. The decisions themselves are in `docs/owner-queue.md`; the audit and its evidence are in `docs/AUDIT-build.md`. Every command runs from the project folder after `. ~/.nvm/nvm.sh && nvm use` (Node 22.23.4, from `.nvmrc`). On the shared Mac, heavy commands go through `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh …`.

## Where the build is

Steps 1–14 are on GitHub, each branch cut from the one before (`build/01-scaffold` … `build/14-release`, then `build/14-launch`), and `main` is the launch commit, 27526c8, live at https://tb-ph.pages.dev since 9 November 2026 (`docs/launch-2026-11-08.md`). Step 15, the v8 fix pass (`docs/step-15-fix-pass.md`), is on `build/15-fix-pass`. The TB Health lead hands over the push and merge commands.

## Before launch: what only you can do

`npm run launch-check` lists what's still open at any time, and its blocking items stop the release. This is the plan's full owner-only list (PLAN §5, step 14):

- [ ] **Open questions** in `docs/owner-queue.md`, starting with the domain (Q7: the host, Cloudflare Pages, is decided) and Q8 (the full clinic list: a pipeline run needs your OK).
- [ ] **The v7 design:** import v7 (dark mode and the v7 wording: V1–V3), or decide to launch on v6.
- [ ] **The clinical review** of the symptom check, Learn L6 and the six route-stop strings, with the four cases in O11, and whether the saved or printed summary card should list risk factors such as HIV (sensitive health information under RA 10173). Or launch without the check: build with `TBPH_CHECK=false` (Q9), and reword or approve the strings that still mention it, which `launch-check` lists under [check-mentions].
- [ ] **`[VERIFY]` items and placeholders:** the Sakay.ph deep links (none ship until someone confirms Sakay's link format); the group name, partners, medical reviewer and contact (`launch-check` lists them).
- [ ] **Your wording:** the privacy row (Q5), the Filipino page descriptions (Q3), the link-preview alt text, and the copy overrides in `docs/copy-overrides.md`.
- [ ] **The Filipino review** of the strings not from the pack, and one register across the site (D10, C7).
- [ ] **The content conflicts and D5:** the conflicts are resolved (V5); D5's default stands (the Data takeaways stay the pack's text) unless you change it.
- [ ] **Type sizes (D1):** keep the exact sizes the design specifies (recommended), or merge them into a smaller set, a one-file change.
- [ ] **The clinic list's age:** lapsed accreditations (Q12; shown as listed meanwhile, D24), the list's date (`launch-check` shows it), and who runs the monthly refresh.
- [ ] **Reuse terms** for the WHO data and the PhilHealth list (O12).
- [ ] **Real-device installs** of the app on an iPhone and an Android phone.
- [ ] **VoiceOver, TalkBack and a Safari keyboard pass** (see Device checks below).
- [ ] **Search Console**, after launch (release step 7).

## Release

The host is Cloudflare Pages, in a Cloudflare account used only for TB Health (Q7, decided 5 November 2026). The domain is still open.

**The launch and test copies.** A deploy with `--branch=main` is **the public launch**: the production site, at the domain once one is attached, and until then at `https://<subdomain>.pages.dev`, open to search engines. Run it only when launching ("Each release" below). To try the site on Cloudflare first, make a **test copy** ("Test copies" below): a non-production build deployed as a preview at `https://test.<subdomain>.pages.dev`, which search engines are told not to index. `<subdomain>` is the pages.dev address `pages project create` prints (setup step 6).

**What the release tools send.** Besides the upload itself:
- **Wrangler** sends anonymous usage data to Cloudflare unless `WRANGLER_SEND_METRICS=false` (its docs: the default is `true`), and offers to send an error report after a crash unless `WRANGLER_SEND_ERROR_REPORTS=false` (its docs: left unset, it asks each time). Every wrangler line below sets both; set them on any other wrangler command you run. Don't use `wrangler telemetry disable`: it changes the setting for every project of this macOS user, KitaMo's builders included.
- **Astro** sends anonymous usage data from `astro build` and `astro dev` unless `ASTRO_TELEMETRY_DISABLED=1` (astro.build/telemetry: you opt out). The project's npm scripts set it. Don't use `astro telemetry disable`, for the same reason.
- **npm:** `npm ci` and `npm audit` send the dependency list to the npm registry.

**Every wrangler line has one form**, run in a subshell `( … )` so nothing outlives it:
```
( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 <command> )
```
- It reads the TB Health token from the Keychain for that command only, and stops if the Keychain has no token or an empty one (`[ -n "$T" ]`), so wrangler can't fall back to another login.
- The token reaches wrangler through its environment, never as a command-line argument, which other accounts on the Mac could see with `ps`.
- It pins the TB Health account with `CLOUDFLARE_ACCOUNT_ID`, clears any other Cloudflare credentials and API address (`CLOUDFLARE_API_BASE_URL`, which would send the token elsewhere) set in the shell, and turns off wrangler's usage data and error reports.
- When it ends, or after Ctrl-C, the token is gone with the subshell, and the line returns wrangler's own exit status.

Below, put the account ID in place of `<account-id>`.

### One-time setup

1. **Fetch wrangler once, with no token:**
   ```
   WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false npx wrangler@4.151.3 --version
   ```
   This answers npx's "Ok to proceed?" and installs wrangler before any token is in play.
2. **An API token, not a login.** In the Cloudflare dashboard, create a custom API token:
   - **Permissions:** Account › Cloudflare Pages › Edit, the permission Cloudflare's Direct Upload docs give. Cloudflare's docs don't say what `wrangler whoami` needs to name the account; if step 5 can't, add Account › Account Settings › Read (read only) and nothing more.
   - **Account Resources:** Include › the TB Health account only.

   Don't use wrangler's own login command: it stores the login in a file every session of this macOS user reads, so it would replace any other project's Cloudflare login, KitaMo's included, and theirs would replace ours.
3. **The account ID:** Workers & Pages › Account details › Account ID, or from Account home, search for "Copy account ID". (An account with no domain has no zone overview to show it.)
4. **Store the token in this Mac's Keychain yourself:**
   ```
   security add-generic-password -a "$USER" -s tbhealth-cloudflare -w
   ```
   - It asks twice, "password data for new item" and then "retype password data for new item": paste the Cloudflare token both times, not your Mac password. It never shows in the shell history.
   - To replace the token later, run the same line with `-U` after `add-generic-password`.
   - Afterwards copy something else, so the token leaves the clipboard: Universal Clipboard shares the clipboard with your other Apple devices nearby.
   - **Who can read it:** any program running as this Mac user can read the stored token, as it can gh's. The builder and lead sessions never ask for it, and only the wrangler lines in this file read it. To be asked every time it's read, create the item with `-T ""` instead (`security add-generic-password -a "$USER" -s tbhealth-cloudflare -T "" -w`). Then every release needs someone at the Mac to click Allow, so it can't be run over Remote Control.
   - The token and the account ID go in no file in the repo.
5. **Check the account:**
   ```
   ( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 whoami )
   ```
   Stop unless it names the TB Health account, with the same ID as `<account-id>`.
6. **Create the project**, with `main` as its production branch:
   ```
   ( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 pages project create <your-project> --production-branch=main )
   ```
   - It prints the project's pages.dev address. Its subdomain is the project name only when that name is free; otherwise Cloudflare adds characters. Use that subdomain wherever this file says `<subdomain>`, while `--project-name` keeps the project name.
   - With the production branch set to `main`, `--branch=main` deploys to production and any other branch name makes a preview.

### Each release

A release builds what's committed to `main`. **The real facility list (Q8) has to be committed to `main` first**, or the release builds the 93-row sample (and the gate stops on [sample] unless you accept it).

Run the steps in one Terminal window, in order. Each is one line, so a failed part stops the rest.

1. **A fresh clone of `main` in a new dated folder**, never the builder's working folder or an earlier release folder (another session's build or tests can rewrite `dist/`, uncommitted edits would ship, and an old folder holds an old commit):
   ```
   D=~/Documents/tb-health-release-$(date +%Y%m%d-%H%M%S) && git clone --branch main https://github.com/RawBeans02/tb-health.git "$D" && cd "$D" && git --no-pager log --oneline -1 && . ~/.nvm/nvm.sh && nvm use && npm ci
   ```
   It prints the commit it will release. Old release folders go to the Trash: `/usr/bin/trash ~/Documents/tb-health-release-<date>`.
2. **Check the account:**
   ```
   unset LAUNCH_CHECK_DIST && ( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 whoami )
   ```
   Stop unless it names the TB Health account.
3. **Build, gate and deploy: the public launch.** The upload is the build the gate just passed, and the line checks the account again itself, so a second Terminal tab or a skipped step 2 can't deploy with another account's token. It starts by checking it runs in this release's folder:
   ```
   [ "$PWD" = "$D" ] && SITE_URL=https://your-domain.example TBPH_PRODUCTION=true GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && npm run release-check && ( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=main )
   ```
   With items you accept (step 4), for example the sample list:
   ```
   [ "$PWD" = "$D" ] && SITE_URL=https://your-domain.example TBPH_PRODUCTION=true GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && npm run release-check -- --accept=sample && ( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=main )
   ```
   - Put the real address in place of `https://your-domain.example` (the gate blocks any `.example` address). Before a domain is attached, the launch address is `https://<subdomain>.pages.dev`.
   - To launch without the check, add `TBPH_CHECK=false` before `GUARD_NO_DOCKER=1` (Q9).
   - Only the build runs under the memory guard. The guard runs its job in the background, so a wrangler prompt inside it would stop the job and keep holding the machine-wide lock. If the guard exits 97, 98 or 99, the Mac was busy: run the line again.
   - **Ctrl-C during the build** ends the guard and frees its lock, but the build keeps running in the background (the guard starts it in its own process group) and can still write into this folder's `dist/`. Start again from step 1, in a new folder. Wait until the old build has finished (`pgrep -f "astro build"` prints nothing) before you do.
   - `npm run release-check` is the gate (`launch-check --release`). Wrangler uploads `dist/` as built, without rebuilding, and Cloudflare reads `dist/_headers` as is.
4. **If the gate stops**, it lists what's open, and nothing is uploaded. You may accept only your own calls, and only keys the gate lists as open, with `-- --accept=<key>,<key>` after `npm run release-check`, as in the second line above (naming any other key exits 2; without the `--`, npm drops the list and the gate still blocks). The keys you can accept: `check-review`, `sample`, `owner-strings`, `review`, `verify`, `placeholders` and `check-mentions`. The rest can't be accepted: the privacy row (Q5: without it About doesn't say who else sees what, which RA 10173 requires; the lead's ruling), synthetic data, no build, no facility list, a missing `_headers` or one that isn't exactly the production file, Check in one language only, the placeholder address and a noindex build. The gate prints what you accepted with the release. Send that list to the TB Health lead, who records it in `docs/decisions.md`.
5. **Previews are public.** Anyone who has a preview's address, or guesses it, can open it (Cloudflare's docs: deployment URLs are public by default). Cloudflare sends `X-Robots-Tag: noindex` on every preview, which only keeps it out of search. Share preview addresses only with reviewers ("Test copies" below).
6. **Check the live site** from the same release folder: `npm run post-deploy-check -- https://your-domain.example` (the address you deployed to). It reads every page back and compares it with `dist/`: identical HTML (no injected scripts), no cookies, every response's headers exactly as `dist/_headers` sets them, and the 404s in both languages. Turn off any host feature it flags (analytics beacons, email obfuscation, script optimisers, bot challenges).
   - Exit 1: it found problems, listed above it.
   - Exit 3: the check is incomplete. Run it again if the host didn't answer; otherwise fix the cause on its "couldn't check" or "failed:" lines.
   - If every page differs from `dist/`, first make sure `dist/` is still the build you deployed. Then list the deployments and look for yours listed as Preview instead of Production:
     ```
     ( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 pages deployment list --project-name=<your-project> )
     ```
   - It warns if the address you give isn't the one the build was made for.
7. **Search Console:** add the site, submit `https://your-domain.example/sitemap.xml` (the real address), and check that Google sees the Filipino pages as `fil` alternates.

### Test copies

A test copy is a non-production build deployed as a preview, at `https://test.<subdomain>.pages.dev`: it carries noindex, and Cloudflare adds its own to every preview. It needs no release gate and no accept list (`npm run launch-check` shows what's open), and it can't reach the production branch. Do steps 1 and 2 of "Each release", then:
```
[ "$PWD" = "$D" ] && SITE_URL=https://test.<subdomain>.pages.dev TBPH_PRODUCTION= TBPH_CHECK=false GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && ( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=test )
```
- `TBPH_PRODUCTION=` keeps it a non-production build even if the shell has `TBPH_PRODUCTION=true` set from earlier.
- **Without Check, like production** (V15): `TBPH_CHECK=false` leaves the unreviewed symptom check out. Drop it only for a reviewer who needs to see Check, since the copy is public (next point).
- **A branch before it's merged:** in step 1, clone that branch instead of `main` (`--branch build/15-fix-pass`), and stop unless the commit it prints is the one you pushed.
- **It's public too:** anyone who has its address, or guesses it, can open it, and it carries whatever the build has. Share it only with reviewers, or turn on the project's preview access policy (Settings › General › Enable access policy; Cloudflare's docs: it limits previews to your Cloudflare account). Cloudflare Access, for letting in reviewers outside the account, is free for small teams but needs its own setup.
- `npm run post-deploy-check -- https://test.<subdomain>.pages.dev` works on a test copy too, but it flags the preview's noindex header by design: Cloudflare's header comes on top of the one in `dist/_headers`.

## Other hosts (not set up)

The release steps above are for Cloudflare Pages only. Another host needs this first:
- **Netlify:** `netlify deploy` builds the project again unless given `--no-build`, and that build would have no `SITE_URL`, `TBPH_PRODUCTION` or `TBPH_CHECK`: a non-production site, and in a launch without Check, the unreviewed check back. It also needs 404 rules in a `netlify.toml`, most specific first: `/fil/place/*` to `/fil/place/404.html`, `/place/*` to `/place/404.html`, then `/fil/*` to `/fil/404.html`, each with status 404. It reads `_headers`.
- **GitHub Pages:** it ignores `_headers`, so it can't send our security headers (HSTS, frame-ancestors, Permissions-Policy, nosniff) or the noindex, and it serves only the English root 404. `post-deploy-check` fails there by design. It also needs a `.nojekyll` file and a GitHub Actions deploy of `dist/`, which V21 (no GitHub Actions) rules out. See PLAN §3, Host.

## Pending first runs

- **No CI** (V21, 11 Nov 2026): TB Health uses no GitHub Actions, so `.github/workflows/ci.yml` is gone, and every check runs on the Mac through the guard. The Linux run is `scripts/linux-check.sh` (next section). The launch went without it (R2); whether a later release runs it is your call. It hasn't been run yet. Its `npm audit` sends the dependency list to the npm registry (the same lookup `npm install` does).
- **Outside links** (L8): `node scripts/outside-links.mjs --fetch` asks each of the 28 cited sources whether it still answers. It contacts those 23 sites only (it reports redirects instead of following them), so it waits for your OK. Dead or moved sources go to the content owner.

## Linux check on the Mac

With no GitHub Actions (V21), this is how to run the tests on Linux before a release, if you want to: `scripts/linux-check.sh` runs the install, the type check, the unit tests, both builds (the full list, then the 93-row sample the browser tests use), every browser project, the build without Check and `npm audit --omit=dev`, in Docker on this Mac, against the commit you'll release. The launch went without it (R2); whether a later release runs it is your call. It runs on arm64 Linux, with the Playwright image's fonts and libraries (Liberation Sans stands in for Arial), and as root; the script's header lists how it runs.

**Results: not run yet.** The script has never produced results (V15), so no release evidence comes from it so far.

**A quiet hour.** Docker's VM has about 2 GB, shared with every container, and the guard stops a job above 6.5 GB on the Mac:
- KitaMo's containers stopped and its heavy jobs paused (ask the Account Admin);
- Chrome, Codex and ChatGPT quit;
- Docker Desktop left open.

The script waits for room by itself, without the shared lock: until Memory Used, plus what Docker's VM can still grow, is under the guard's soft limit with 0.15 GB to spare. With the VM asleep that's Memory Used at most about 4.3 GB. It gives up after 2 hours.

**Once:** the image, pulled by its digest, and Node for Linux at the version in `.nvmrc`, checked against nodejs.org's checksums, in the script's folder (`~/tbh-linux-check`; `TBH_LINUX_CHECK_HOME` moves it, but never into the repo or a temporary folder). From the repository folder:
```
_handoff/lowmem-run.sh docker pull mcr.microsoft.com/playwright:v1.64.1-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f
N=~/tbh-linux-check/node/v22.23.4 && mkdir -p "$N" && cd "$N" && curl -fsSLO https://nodejs.org/dist/v22.23.4/SHASUMS256.txt && curl -fsSLO https://nodejs.org/dist/v22.23.4/node-v22.23.4-linux-arm64.tar.xz && grep ' node-v22.23.4-linux-arm64.tar.xz$' SHASUMS256.txt | shasum -a 256 -c && tar -xJf node-v22.23.4-linux-arm64.tar.xz && cd -
```

**Each check,** from the repository folder:
```
scripts/linux-check.sh <commit>
```
It fills a new Docker volume with the commit, straight from git so the file names never pass through the Mac's file system, and checks it holds exactly git's file list. Then it runs each step as one guarded job, in a container capped at 1,400 MB with no swap and a 1 GB Node heap, and never while another container runs. It checks Node and Playwright in every step. It goes on after a failed test step, so one pass shows everything, but stops after a failed `npm ci`. Results go to a new folder, `~/tbh-linux-check/runs/<first 12 characters of the commit>-<UTC time>/`:
- `linux-check.log`;
- `summary.tsv`, one row per step;
- a folder per step with the guard's output, the log, the exit state and the memory figures, plus the Playwright reports for the browser steps.

To rerun from one step on the same volume: `scripts/linux-check.sh --from <step> <commit>`. A new full run of the same commit needs the old volume removed first, with the `docker volume rm` line the script prints at the end. Keep the volume until the results are reviewed.

| Exit | Meaning |
|---|---|
| 0 | Every step passed. |
| 1 | A step failed: see `summary.tsv` and that step's log. |
| 2 | Wrong arguments, or a missing prerequisite (Docker not running, the image or Node not set up): nothing ran. |
| 90 | A container named `tbh-linux-ci` is left over from an earlier run. |
| 91 | Another container was running, or started during a step: pick a quieter hour. |
| 92 | The volume already exists for a full run, or a rerun found it missing or holding another commit. |
| 93 | Node, Playwright, the volume's file list or Node's checksum didn't match. |
| 97 / 98 / 99 | The guard: the lock was busy for 2 h, memory stayed high for 2 h, or it stopped the step. The Mac ran out of room, not a test result. |
| 125 | A Docker error. |
| 143 | The container was stopped from outside (`docker stop`). |

A step killed for memory shows as `OOMKilled=true` or `oom_kill` above 0 in its row, whatever its exit code: usually a browser or a test worker is killed and the step exits 1. That's a result to report, not a reason to raise the caps. If the unit tests are killed for memory, the script runs them once more with one worker (`unit-1worker`) and records both.

**To stop a run,** type `docker stop tbh-linux-ci` in another Terminal tab. Ctrl-C in the script's window works too: it stops the container first, then waits for the guard to finish. Never kill the guard (`lowmem-run.sh`): that frees the shared lock while the step goes on running.

**Afterwards,** `docker ps -a --format '{{.Names}}' | grep -x tbh-linux-ci` should print nothing (KitaMo's stopped containers may still be listed by `docker ps -a`; leave them). Keep the image for next time, and quit Docker Desktop when no one else needs it.

## Device checks

The audit's runtime checks need a real iPhone and Android phone (and the installed app): landscape insets, the Filters sheet's Back gesture and swipe, long-press and stuck-hover, Save as image and Share, Enter in the place field with Safari's suggestions open, VoiceOver, TalkBack and a Safari keyboard pass, and printing a check result. The list is under "Runtime checks still needed" in `docs/AUDIT-build.md` and the interim audit. Step 15 adds its own (taps and the pressed look, the toolbar and the page's height, the Places map with one and two fingers, the worst-case rows on a small phone, the Filters sheet's flick, the route's draw-in on a mid-range phone, and dark mode): "The device list (step 15)" in the same file.

## Keeping it current

- New facility data or a WHO report: rebuild; the dot-count tripwire (Q11) and the data guards stop a build whose numbers no longer match the copy.
- **Em dashes in the PhilHealth list:** check-dashes ends every build, and it stops the build if a clinic's name or address has an em dash (V15), because a place page shows them in its heading, title and text. None does today. If one does, the row needs a correction, recorded like the earlier ones (`docs/data-refresh-2026-11-07.md`) and with your OK; the check stays strict.
- Every launch deploy: steps 1–6 of "Each release" above, in a new release folder. Test copies: "Test copies" above.
