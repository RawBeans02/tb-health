# TB PH: handover

How to take the build to launch. The decisions themselves are in `docs/owner-queue.md`; the audit and its evidence are in `docs/AUDIT-build.md`. Every command runs from the project folder after `. ~/.nvm/nvm.sh && nvm use` (Node 22.23.4, from `.nvmrc`). On the shared Mac, heavy commands go through `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh …`.

## Where the build is

Steps 1–14 are on local branches, each cut from the one before: `build/01-scaffold` … `build/13-qa`, `build/14-release`. `build/14-release` holds everything. The TB Health lead hands over the push and merge commands.

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

**The launch and test copies.** A deploy with `--branch=main` is **the public launch**: the production site, at the domain once one is attached, and until then at `https://<your-project>.pages.dev`, open to search engines. Run it only when launching ("Each release" below). To try the site on Cloudflare first, make a **test copy** ("Test copies" below): a non-production build deployed as a preview at `https://test.<your-project>.pages.dev`, which search engines are told not to index.

**What the release tools send.** Besides the upload itself:
- **Wrangler** sends anonymous usage data to Cloudflare unless `WRANGLER_SEND_METRICS=false` (its docs: the default is `true`). Every wrangler command below sets it; set it on any other wrangler command you run. Don't use `wrangler telemetry disable`: it changes the setting for every project of this macOS user, KitaMo's builders included.
- **Astro** sends anonymous usage data from `astro build` and `astro dev` unless `ASTRO_TELEMETRY_DISABLED=1` (astro.build/telemetry: you opt out). The project's npm scripts set it. Don't use `astro telemetry disable`, for the same reason.
- **npm:** `npm ci` and `npm audit` send the dependency list to the npm registry.

### One-time setup

1. **An API token, not a login.** In the TB Health Cloudflare account (never KitaMo's), create an API token with only **Account › Cloudflare Pages › Edit**, the permission Cloudflare's Direct Upload docs give. Their docs don't say what `wrangler whoami` needs to name the account; if it can't, add **Account › Account Settings › Read** (read only) and nothing more. Note the account ID (the dashboard shows it in the API section of an account or zone overview).
   Don't use wrangler's own login command: it stores the login in a file every session of this macOS user reads, so it would replace any other project's Cloudflare login, KitaMo's included, and theirs would replace ours.
2. **Store the token in this Mac's Keychain yourself.** The final `-w` makes it ask for the token, so it never shows in the shell history:
   ```
   security add-generic-password -a "$USER" -s tbhealth-cloudflare -w
   ```
   Every wrangler command below reads it for that command only, and pins the account with `CLOUDFLARE_ACCOUNT_ID`. If the Keychain has no token, the line stops before wrangler runs, so wrangler can't fall back to another login. The token and the account ID go in no file in the repo. Below, put the account ID in place of `<account-id>`.
3. **Create the project**, with `main` as its production branch:
   ```
   T=$(security find-generic-password -s tbhealth-cloudflare -w) && env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 pages project create <your-project> --production-branch=main; unset T
   ```
   With the production branch set to `main`, `--branch=main` deploys to production and any other branch name makes a preview.

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
   unset LAUNCH_CHECK_DIST && T=$(security find-generic-password -s tbhealth-cloudflare -w) && env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 whoami; unset T
   ```
   Stop unless it shows the TB Health account.
3. **Build, gate and deploy: the public launch.** The upload is the build the gate just passed, and the line checks the account again itself, so a second Terminal tab or a skipped step 2 can't deploy with another account's token. It starts by checking it runs in this release's folder:
   ```
   [ "$PWD" = "$D" ] && SITE_URL=https://your-domain.example TBPH_PRODUCTION=true GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && npm run release-check && T=$(security find-generic-password -s tbhealth-cloudflare -w) && env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=main; unset T
   ```
   With items you accept (step 4), for example the sample list:
   ```
   [ "$PWD" = "$D" ] && SITE_URL=https://your-domain.example TBPH_PRODUCTION=true GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && npm run release-check -- --accept=sample && T=$(security find-generic-password -s tbhealth-cloudflare -w) && env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=main; unset T
   ```
   - Put the real address in place of `https://your-domain.example` (the gate blocks any `.example` address). Before a domain is attached, the launch address is `https://<your-project>.pages.dev`.
   - To launch without the check, add `TBPH_CHECK=false` before `GUARD_NO_DOCKER=1` (Q9).
   - Only the build runs under the memory guard. The guard runs its job in the background, so a wrangler prompt inside it would stop the job and keep holding the machine-wide lock. If the guard exits 97, 98 or 99, the Mac was busy: run the line again.
   - **Ctrl-C during the build** ends the guard and frees its lock, but the build keeps running in the background (the guard starts it in its own process group) and can still write into this folder's `dist/`. Start again from step 1, in a new folder. Wait until the old build has finished (`pgrep -f "astro build"` prints nothing) before you do.
   - `npm run release-check` is the gate (`launch-check --release`). Wrangler uploads `dist/` as built, without rebuilding, and Cloudflare reads `dist/_headers` as is.
4. **If the gate stops**, it lists what's open, and nothing is uploaded. You may accept only your own calls, and only keys the gate lists as open, with `-- --accept=<key>,<key>` after `npm run release-check`, as in the second line above (naming any other key exits 2; without the `--`, npm drops the list and the gate still blocks). The keys you can accept: `check-review`, `sample`, `owner-strings`, `review`, `verify`, `placeholders` and `check-mentions`. The rest can't be accepted: the privacy row (Q5: without it About doesn't say who else sees what, which RA 10173 requires; the lead's ruling), synthetic data, no build, no facility list, a missing `_headers` or one that isn't exactly the production file, Check in one language only, the placeholder address and a noindex build. The gate prints what you accepted with the release. Send that list to the TB Health lead, who records it in `docs/decisions.md`.
5. **Previews are public.** Anyone who has a preview link can open it (Cloudflare's docs: deployment URLs are public by default). Cloudflare sends `X-Robots-Tag: noindex` on every preview, which only keeps it out of search. Share preview links only with reviewers.
6. **Check the live site** from the same release folder: `npm run post-deploy-check -- https://your-domain.example` (the address you deployed to). It reads every page back and compares it with `dist/`: identical HTML (no injected scripts), no cookies, every response's headers exactly as `dist/_headers` sets them, and the 404s in both languages. Turn off any host feature it flags (analytics beacons, email obfuscation, script optimisers, bot challenges).
   - Exit 1: it found problems, listed above it.
   - Exit 3: the check is incomplete. Run it again if the host didn't answer; otherwise fix the cause on its "couldn't check" or "failed:" lines.
   - If every page differs from `dist/`, first make sure `dist/` is still the build you deployed. Then list the deployments and look for yours listed as Preview instead of Production:
     ```
     T=$(security find-generic-password -s tbhealth-cloudflare -w) && env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 pages deployment list --project-name=<your-project>; unset T
     ```
   - It warns if the address you give isn't the one the build was made for.
7. **Search Console:** add the site, submit `https://your-domain.example/sitemap.xml` (the real address), and check that Google sees the Filipino pages as `fil` alternates.

### Test copies

A test copy is a non-production build deployed as a preview, at `https://test.<your-project>.pages.dev`: it carries noindex, and Cloudflare adds its own to every preview. It needs no release gate and no accept list (`npm run launch-check` shows what's open), and it can't reach the production branch. Do steps 1 and 2 of "Each release", then:
```
[ "$PWD" = "$D" ] && SITE_URL=https://test.<your-project>.pages.dev GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && T=$(security find-generic-password -s tbhealth-cloudflare -w) && env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=test; unset T
```
`npm run post-deploy-check -- https://test.<your-project>.pages.dev` works on a test copy too, but it flags the preview's noindex header by design: Cloudflare's header comes on top of the one in `dist/_headers`.

## Other hosts (not set up)

The release steps above are for Cloudflare Pages only. Another host needs this first:
- **Netlify:** `netlify deploy` builds the project again unless given `--no-build`, and that build would have no `SITE_URL`, `TBPH_PRODUCTION` or `TBPH_CHECK`: a non-production site, and in a launch without Check, the unreviewed check back. It also needs 404 rules in a `netlify.toml`, most specific first: `/fil/place/*` to `/fil/place/404.html`, `/place/*` to `/place/404.html`, then `/fil/*` to `/fil/404.html`, each with status 404. It reads `_headers`.
- **GitHub Pages:** it ignores `_headers`, so it can't send our security headers (HSTS, frame-ancestors, Permissions-Policy, nosniff) or the noindex, and it serves only the English root 404. `post-deploy-check` fails there by design. It also needs a `.nojekyll` file and a GitHub Actions deploy of `dist/`. See PLAN §3, Host.

## Pending first runs

- **CI** (`.github/workflows/ci.yml`, D22): manual only. GitHub offers a manual workflow only once its file is on the default branch, so start it from the repository's Actions tab after the merge to `main`; it runs the type check, unit tests, the build, every browser project and the Check-off build. Its `npm audit` sends the dependency list to the npm registry (the same lookup `npm install` does).
- **Outside links** (L8): `node scripts/outside-links.mjs --fetch` asks each of the 28 cited sources whether it still answers. It contacts those 23 sites only (it reports redirects instead of following them), so it waits for your OK. Dead or moved sources go to the content owner.

## Device checks

The audit's runtime checks need a real iPhone and Android phone (and the installed app): landscape insets, the Filters sheet's Back gesture and swipe, long-press and stuck-hover, Save as image and Share, Enter in the place field with Safari's suggestions open, VoiceOver, TalkBack and a Safari keyboard pass, and printing a check result. The list is under "Runtime checks still needed" in `docs/AUDIT-build.md` and the interim audit.

## Keeping it current

- New facility data or a WHO report: rebuild; the dot-count tripwire (Q11) and the data guards stop a build whose numbers no longer match the copy.
- Every launch deploy: steps 1–6 of "Each release" above, in a new release folder. Test copies: "Test copies" above.
