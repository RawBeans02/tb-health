# TB Health — owner decisions

Decisions the owner (Rovince) made, recorded by the TB Health lead. Question numbers refer to `docs/PLAN.md` §7.1. A decision counts only once the owner has given it; recommendations and defaults in PLAN.md are not decisions until they're listed here (or, for §7.2 defaults, until the owner overrides them).

The lead keeps this file. The Jr. Builder reads it and doesn't edit it.

## 4 November 2026 (owner, in chat with the lead)

### Plan
- **`docs/PLAN.md` approved** as revised after the independent review (commit `7ea78ff`). The builder may start step 1 (scaffold) on `build/01-scaffold`.
- Q4–Q13 stay open. The lead asks the owner before the steps that need them (grouping as in §7.1). Until then, §7.2 defaults apply.

### Q2. Language URLs
- **Filipino at `/fil/…`**, English at `/…`, both prerendered (PLAN §4.2).
- **(a) Toggle:** two links with `aria-current` on the current language, replacing README's buttons with `aria-pressed`. Log it in `docs/copy-overrides.md` as a deliberate change from the README.
- **(b) Saved choice:** a reader whose saved choice (`tbph-lang`) is Filipino is sent from **every English page** to its `/fil/` twin, keeping query and hash. Not only `/` and app launch.
- (c), (d): accepted as the costs of this option (Filipino titles and descriptions; both-language copy on Check, Places and Home).

### Q3. Copy source
- **Approved as proposed:**
  - Content-pack copy (incl. §1 global and §5 Places) ships verbatim and parity-tested.
  - Where the pack has nothing (planner, Place, Install, 404), the prototype's strings ship verbatim, flagged for EN/FIL review.
  - Where README wording differs from the pack, **README wins**. Every case is listed in `docs/copy-overrides.md` for the owner to confirm.
  - The stop explanations ("Get a chest X-ray…", "usually in 6 months") ship flagged `[REVIEW]` with Learn L6.
- **No newer content pack.** `design/design_handoff_tb_ph/reference/content-and-data-pack.md` is the latest; build from it. (The `tb-ph-content-and-data.md` cited in design prompt v2 isn't coming.)
- **Filipino descriptions for About, Data, Install, Learn and Place: the owner will supply them later.** The builder lists the strings needed (origin `owner`) and writes none. They stay blocking items in `launch-check` until supplied; the build carries on meanwhile.
- Follows from Q3 = yes: defaults D10 and D11 apply as written.

## 30 October 2026 (owner, via the Account Admin)

### Q1. Node
- Node 22 LTS through nvm for tb-health only, pinned in `.nvmrc`. nvm's default alias and the global/Homebrew Node stay unchanged (the KitaMo builders use them).
