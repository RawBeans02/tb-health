# TB PH: handover

How to take the build to launch. The decisions themselves are in `docs/owner-queue.md`; the audit and its evidence are in `docs/AUDIT-build.md`. Every command runs from the project folder after `. ~/.nvm/nvm.sh && nvm use` (Node 22.23.4, from `.nvmrc`). On the shared Mac, heavy commands go through `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh …`.

## Where the build is

Steps 1–14 are on local branches, each cut from the one before: `build/01-scaffold` … `build/13-qa`, `build/14-release`. `build/14-release` holds everything. The TB Health lead hands over the push and merge commands.

## Before launch: what only you can do

`npm run launch-check` lists what's still open at any time, and its blocking items stop the release. This is the plan's full owner-only list (PLAN §5, step 14):

- [ ] **Open questions** in `docs/owner-queue.md`, starting with Q7 (host and web address) and Q8 (the full clinic list: a pipeline run needs your OK).
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
- [ ] **Search Console**, after launch (release step 6).

## Release

### One-time setup

1. `npx wrangler@4.151.3 login`, into the Cloudflare account that belongs to TB Health only, never KitaMo's.
2. `npx wrangler@4.151.3 whoami` must show that account. An exported `CLOUDFLARE_API_TOKEN` takes priority over the login (wrangler's docs), so on this shared Mac run `unset CLOUDFLARE_API_TOKEN` first.
3. `npx wrangler@4.151.3 pages project create <your-project> --production-branch=main`. With the production branch set to `main`, `--branch=main` deploys to production and any other branch name makes a preview. If you skip this step, the first deploy asks for the production branch instead: enter `main`.

Wrangler sends anonymous usage data to Cloudflare unless told not to (`WRANGLER_SEND_METRICS` defaults to `true`, per its docs). The release command below sets `WRANGLER_SEND_METRICS=false`; `npx wrangler@4.151.3 telemetry disable` turns it off on this Mac for good.

### Each release

1. **Start from a clean checkout of `main`**, never the builder's working folder: another session's build or tests can rewrite `dist/` between the gate and the upload, and uncommitted edits would ship.
   ```
   git clone https://github.com/RawBeans02/tb-health.git tb-health-release
   cd tb-health-release && . ~/.nvm/nvm.sh && nvm use && npm ci
   ```
2. **Build, gate and deploy in one command**, so the upload is the build the gate just passed:
   ```
   SITE_URL=https://your-domain.example TBPH_PRODUCTION=true GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && npm run release-check && WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=main
   ```
   - Put the real address in place of `https://your-domain.example`; the gate blocks any `.example` address.
   - To launch without the check, add `TBPH_CHECK=false` before `GUARD_NO_DOCKER=1` (Q9).
   - Only the build runs under the memory guard. The guard runs its job in the background, so a wrangler prompt inside it would stop the job and keep holding the machine-wide lock. If the guard exits 97, 98 or 99, the Mac was busy: run the command again.
   - `npm run release-check` is the gate (`launch-check --release`). Wrangler uploads `dist/` as built, without rebuilding, and Cloudflare reads `dist/_headers` as is.
3. **If the gate stops**, it lists what's open, and nothing is uploaded. You may accept only your own calls, and only keys the gate lists as open, for example `npm run release-check -- --accept=sample` (naming any other key exits 2; without the `--`, npm drops the list and the gate still blocks). The keys you can accept: `check-review`, `sample`, `owner-strings`, `review`, `verify`, `placeholders` and `check-mentions`. The rest can't be accepted: the privacy row (Q5: without it About doesn't say who else sees what, which RA 10173 requires; the lead's ruling), synthetic data, no build, no facility list, a missing `_headers`, the placeholder address and a noindex build. The gate prints what you accepted with the release. Send that list to the TB Health lead, who records it in `docs/decisions.md`.
4. **Previews are public.** Anyone who has a preview link can open it. A build without `TBPH_PRODUCTION=true` sends `X-Robots-Tag: noindex`, which only keeps it out of search, and only on a host that reads `_headers`. Share preview links only with reviewers.
5. **Check the live site** from the same checkout: `npm run post-deploy-check -- https://your-domain.example` (the real address). It reads every page back and compares it with `dist/`: identical HTML (no injected scripts), no cookies, every response's headers exactly as `dist/_headers` sets them, and the 404s in both languages. Turn off any host feature it flags (analytics beacons, email obfuscation, script optimisers, bot challenges).
   - Exit 1: it found problems, listed above it.
   - Exit 3: the check is incomplete. Run it again if the host didn't answer; otherwise fix the cause on its "couldn't check" or "failed:" lines.
   - If every page differs from `dist/`, first make sure `dist/` is still the build you deployed. Then run `npx wrangler@4.151.3 pages deployment list --project-name=<your-project>` and look for your deploy listed as Preview instead of Production.
   - It warns if the address you give isn't the one the build was made for.
6. **Search Console:** add the site, submit `https://your-domain.example/sitemap.xml` (the real address), and check that Google sees the Filipino pages as `fil` alternates.

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
- Every deploy: steps 1–5 of "Each release" above.
