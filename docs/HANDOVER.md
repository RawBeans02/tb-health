# TB PH: handover

How to take the build to launch. The decisions themselves are in `docs/owner-queue.md`; the audit and its evidence are in `docs/AUDIT-build.md`. Every command runs from the project folder after `. ~/.nvm/nvm.sh && nvm use` (Node 22.23.4, from `.nvmrc`). On the shared Mac, heavy commands go through `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh …`.

## Where the build is

Steps 1–14 are on local branches, each cut from the one before: `build/01-scaffold` … `build/13-qa`, `build/14-release`. `build/14-release` holds everything. The TB Health lead hands over the push and merge commands.

## Before launch: what only you can do

1. **Answer the open questions** in `docs/owner-queue.md`, starting with Q7 (host and web address) and Q8 (the full clinic list: a pipeline run needs your OK).
2. **The clinical review** of the symptom check, Learn L6 and the six route-stop strings. Or launch without the check: build with `TBPH_CHECK=false` (Q9), and reword or approve the six strings that still mention it.
3. **Your wording**: the privacy row (Q5), the Filipino page descriptions (Q3), the placeholders (group name, partners, reviewer, contact), the link-preview alt text, and the accepted copy overrides and Filipino review.
4. **Reuse terms** for the WHO data and the PhilHealth list (O12).

`npm run launch-check` lists what's still open at any time.

## Release

1. **Build for production** with the real address:
   `SITE_URL=https://your.address TBPH_PRODUCTION=true npm run build`
   (A production build refuses the placeholder address. Add `TBPH_CHECK=false` to launch without the check.)
2. **Run the gate:** `npm run launch-check -- --release`. It stops on anything still open. To launch with an item you have decided to accept (for example the sample list), name it: `npm run launch-check -- --release --accept=sample`. Accepted items are printed with the release, so the decision is on record.
3. **Deploy `dist/`** to the host you chose (Q7). Use a project or site that belongs to TB Health only, never KitaMo's.
   - **Cloudflare Pages** (recommended): `npx wrangler@4.151.3 pages deploy dist --project-name=<your-project> --branch=main` (after `npx wrangler@4.151.3 login` once). It reads `dist/_headers` as is.
   - **Netlify:** `npx netlify-cli@27.14.0 deploy --dir=dist --prod` (after `npx netlify-cli@27.14.0 login`). Also reads `dist/_headers`.
   - **GitHub Pages:** publish `dist/` to Pages. It ignores `_headers` (no HSTS from us, no frame-ancestors, Permissions-Policy or nosniff) and serves only the English root 404; see PLAN §3, Host.
   Keep previews private or noindex: every build without `TBPH_PRODUCTION=true` sends `X-Robots-Tag: noindex`.
4. **Check the live site:** `npm run post-deploy-check -- https://your.address`. It reads every page back and compares it with `dist/`: identical HTML (no injected scripts), no cookies, the security and caching headers, and the 404s. Turn off any host feature it flags (analytics beacons, email obfuscation, script optimisers, bot challenges).
5. **Search Console:** add the site, submit `https://your.address/sitemap.xml`, and check that Google sees the Filipino pages as `fil` alternates.

## Pending first runs

- **CI** (`.github/workflows/ci.yml`, D22): manual only. GitHub offers a manual workflow only once its file is on the default branch, so start it from the repository's Actions tab after the merge to `main`; it runs the type check, unit tests, the build, every browser project and the Check-off build. Its `npm audit` sends the dependency list to the npm registry (the same lookup `npm install` does).
- **Outside links** (L8): `node scripts/outside-links.mjs --fetch` asks each of the 27 cited sources whether it still answers. It contacts other sites, so it waits for your OK; dead sources go to the content owner.

## Device checks

The audit's runtime checks need a real iPhone and Android phone (and the installed app): landscape insets, the Filters sheet's Back gesture and swipe, long-press and stuck-hover, Save as image and Share, Enter in the place field with Safari's suggestions open, VoiceOver and TalkBack, and printing a check result. The list is under "Runtime checks still needed" in `docs/AUDIT-build.md` and the interim audit.

## Keeping it current

- New facility data or a WHO report: rebuild; the dot-count tripwire (Q11) and the data guards stop a build whose numbers no longer match the copy.
- Every deploy: steps 1–4 above.
