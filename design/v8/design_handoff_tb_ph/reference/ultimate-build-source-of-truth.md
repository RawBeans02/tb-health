# Ultimate Build Source of Truth (SOT)

**Purpose:** reusable build-quality standard for websites, mobile apps, backends, and AI-assisted software projects.

This file is **not a record of any one project**. It is a living Source of Truth derived from the tutorials, audits, and engineering lessons collected in this chat. Use it to check whether a build applies the relevant product, UX, accessibility, security, performance, release, growth, and monetization practices before shipping.

**Knowledge-base provenance:** consolidated from the complete tutorial corpus collected in this chat, with duplicate lessons merged and volatile claims treated as experiments rather than universal rules.

## How to use this SOT

For every build, create an audit record and evaluate every rule that could apply. Do **not** force irrelevant features into a product just to satisfy a checklist.

### Status legend

- ✅ **Verified** — implemented and supported by evidence/testing.
- 🟡 **Partial** — some of the requirement is present, but more work or verification is needed.
- ❌ **Missing** — applicable requirement is not implemented.
- ⭕ **Not applicable** — the build genuinely does not have the user need, architecture, or workload that would require it.
- 🔍 **Runtime verification required** — source inspection alone cannot prove it; test the deployed/release build.
- 🧪 **Experiment / hypothesis** — useful tactic worth testing, but not a universal product requirement.

### Requirement classes

- **MUST** — shipping without it creates a meaningful quality, security, accessibility, legal, data-integrity, or release risk when applicable.
- **SHOULD** — strong default practice; omit only with a deliberate reason.
- **WHEN APPLICABLE** — required only when the corresponding feature/workload exists.
- **EXPERIMENT** — growth, retention, monetization, or UX hypothesis that must be validated with product data.

### Per-build audit record

Copy this block for each project/release:

```md
Project / Build:
Platform: Web / iOS / Android / Backend / Full-stack / Other
Environment audited:
Branch / commit / release:
Audit date:
Auditor:

Blocking findings:
- None / ...

Accepted exceptions / N/A rationale:
- ...
```

### Evidence rule

A checkbox is not enough. For important items, attach evidence such as:
- source file / component / configuration path
- screenshot or screen recording
- automated test or CI result
- Lighthouse / performance report
- database migration / query plan
- App Store / Play Console configuration
- deployed-response headers / network trace
- security test result

---

## UI / UX Design

### Reduce decision friction — Hick's Law

Hick's Law: the more choices a user is given, the longer it takes them to make a decision.

Practical implication for apps:
- More decisions create more friction.
- More friction can hurt retention.
- Keep the next action obvious instead of making users decide among several equally prominent choices.

#### Five UX rules for reducing friction

1. **Don't show irrelevant options.**
   - Remove actions that do not apply to the user's current state or task.
   - Example: if a file has not been uploaded yet, do not present actions that only become useful after upload.

2. **Do not make multiple buttons look equally important.**
   - Avoid presenting several primary-looking CTAs at once.
   - Establish a clear visual hierarchy.

3. **Hide unneeded options.**
   - Keep secondary or advanced actions out of the main flow until they are necessary.
   - The interface should expose what the user needs now, not every possible control.

4. **Prioritize the main button/action.**
   - The primary CTA should be the most visually obvious action on the screen.
   - Secondary controls should not compete with it.

5. **Give each screen one primary action.**
   - A user should be able to quickly tell what the main thing to do is.

Core principle: simplify complex products by making the intended action obvious.

### Use familiar interaction patterns — Jakob's Law

Jakob's Law: users spend most of their time using other products, so they expect a new product to behave similarly to interfaces they already know.

Do not redesign common patterns just to be different. Familiar behavior reduces the amount users have to learn and can improve retention.

#### Five familiar mobile-app conventions

1. **Swipe down to refresh.**
2. **Swipe left to go back.**
3. **Put the main Create/Add action in the middle** when using a bottom navigation pattern where creation is a core action.
4. **Place Home on the far left and Profile on the far right** of bottom navigation when those destinations are present.
5. **Use a maximum of about five bottom-navigation tabs.**

Examples referenced include navigation patterns used by major apps such as Instagram, TikTok, YouTube, and Snapchat.

> Note: the clip states that "Rules 6–15" are in the original social-media caption, but those rules are not embedded in the video itself. Only the five visible rules above can be recovered from the provided clip.

### Design empty states as activation flows, not dead ends

**Requirement class:** SHOULD whenever a screen can legitimately have zero user data.

An empty screen should help a new or returning user understand what to do next. A tutorial showed a finance-style app whose first screen was initially almost completely empty; after replacing the dead-end state with guided starter actions and category suggestions, the creator reported a large improvement in successful onboarding. Treat the reported percentage as anecdotal, but keep the product lesson.

Audit criteria:
- [ ] Every important empty state explains what is missing or why the screen is empty.
- [ ] The screen exposes **one obvious next step** instead of forcing the user to infer the workflow.
- [ ] Where useful, offer starter categories, templates, examples, demo data, imports, or another low-effort way to begin.
- [ ] If AI suggestions are offered, they are optional, reviewable, and do not hide the manual path.
- [ ] The empty-state CTA leads directly to the action that creates the first useful object/result.
- [ ] Empty states remain understandable with accessibility technologies and without relying only on illustration.
- [ ] Analytics can measure the path from empty state → first action → first value so the design can be validated.

Core principle: **an empty state is part of onboarding. It should teach, reassure, and move the user toward first value rather than merely announce that no data exists.**

### Ask for notification permission after delivering value

The tutorial argues that the timing of the iOS push-notification permission prompt can strongly affect opt-in and retention.

The clip cites an Airship study of roughly **63 million new app users** over their first **90 days** and shows this comparison:

- Users with no push notification: **1.0× retention baseline**
- Users who received a push notification: about **3.0× retention**

The problem presented is not that apps should avoid asking for notifications. It is that many apps ask immediately on launch, before the user has seen any value. The clip says roughly half of users press **Don't Allow**, and the native iOS permission dialog is not something an app can simply keep showing repeatedly after a denial.

Suggested flow:

1. **Do not trigger the native notification prompt on the first screen.**
2. Let the user complete an important action or experience a first result.
3. Show an **in-app pre-permission screen** first, explaining why notifications are useful in that specific context.
4. Ask the user on your own screen whether they want the notification.
5. Only if they say yes, trigger Apple's native permission prompt.

Example shown in the tutorial: after the user's first meaningful result, explain that notifications can tell them when the next result/update is ready, then show the system prompt.

Core idea: **earn the permission request by giving users a reason to care first.**


### Use a mascot / character as a retention and trust device

One tutorial argues that a product mascot is not just decoration; it can become part of the product's engagement strategy.

The clip cites a claim of roughly **+48% engagement for apps using mascots** compared with apps without them. It also references Duolingo and shows a claim that the owl mascot contributed to **4.5× daily-active-user growth**. Treat these figures as claims presented in the tutorial rather than independently verified benchmarks.

The useful product idea is broader than the exact numbers: a mascot gives the product a recognizable personality and a consistent "voice" that can appear across the user journey.

The creator's example does **not** require:
- A human face
- A realistic person
- Anything literally alive

A stylized character can work. One example shown is a food/chef-themed character used around a trial-reminder message.

#### Give the mascot an explicit personality

The example personality traits shown are:
- **Friendly**
- **Encouraging**
- **Helpful**
- **Consistent**

The character should behave like the same character everywhere rather than changing tone randomly between onboarding, reminders, errors, empty states, and marketing.

Potential benefits highlighted in the tutorial:
- Builds trust
- Makes product communication feel more conversational
- Makes the app more memorable
- Gives otherwise functional screens a distinctive character

Practical use cases:
- Onboarding
- Trial-expiry reminders
- Empty states
- Progress celebrations
- Nudges and reminders
- Error/recovery states
- Habit or streak messaging

Core principle: **a mascot is most useful when it has a defined role and personality inside the product, not when it is added as a random visual gimmick.**

### Treat home-screen widgets as part of the retention loop

A tutorial about iOS widgets argues that launching without a useful widget can waste valuable home-screen visibility.

The key advantage of a widget is that it can occupy prominent space on the user's home screen — in the example, roughly the area of several normal app icons — while showing useful information **without requiring the user to open the app first**.

The example is a calorie-tracking app called **Amy**. Its widget displays information such as:
- Calories remaining for the day
- Macro/progress information
- A quick visual reminder of the user's current status

The tutorial describes the widget as a small behavioral nudge: seeing the remaining calories or progress can remind the user to reopen the app and log food.

The creator says users who added the widget had roughly **25% higher week-one retention** than users who did not. Treat that as the creator's observed result, not a universal benchmark.

Practical widget design principles:
- Show a metric the user cares about frequently.
- Make the information glanceable in a second or two.
- Use it to reinforce the core habit of the product.
- Give the user a reason to reopen the app, rather than using the widget only for branding.
- Keep the widget useful even when the app itself is closed.

Core principle: **a good widget extends the product's habit loop onto the home screen.**



### Keep high-frequency actions inside the product when context switching hurts the experience

A tutorial compares using the default iOS camera flow with a custom inline camera inside the app. The reusable lesson is not "always replace native UI." It is to ask whether a system handoff interrupts a core, repeated workflow enough to justify a more integrated experience.

Use this rule when a capture, scan, upload, or creation action is central to the product:
- Prefer an **in-context / inline flow** when users perform the action frequently and leaving the current screen breaks continuity.
- Preserve the information and controls the user needs before and after capture.
- Match the product's visual language without hiding platform permissions or safety indicators.
- Keep a fallback to the platform picker/camera when it provides capabilities the custom flow does not.
- Do not rebuild a native component merely for novelty; custom UI adds accessibility, permission, device, orientation, error-handling, and maintenance responsibilities.

**Audit criterion — WHEN APPLICABLE:** for every high-frequency system handoff (camera, scanner, file picker, share, media capture), verify whether the transition feels intentional. If a custom flow is used, test permission denial, camera unavailable, orientation changes, cancellation, retry, accessibility labels, and return-state restoration.

Core principle: **use native patterns by default, but keep critical repeated tasks in context when the handoff itself creates measurable friction.**

### Avoid the default “vibe-coded” visual fingerprint

One tutorial gives a 20-point list of design patterns that can make an app immediately look AI-generated or “vibe-coded” when too many of them appear together. The point is **not** that each pattern is bad on its own. The problem is repeatedly combining the same fashionable defaults until unrelated products start looking interchangeable.

The 20 visual/content tells shown in the clip are:

1. Purple-to-blue gradients
2. Gradient hero text
3. Emojis in headings
4. Inter used everywhere
5. Colored-border cards
6. Glassmorphism cards
7. Low-contrast dark mode
8. Three icon boxes in a row
9. A badge above the headline
10. Lucide icons everywhere
11. Untouched/default shadcn UI
12. Fade-in-on-scroll on everything
13. Cursor-following beams/effects
14. Buttons that fade on hover
15. Inconsistent spacing
16. Em dashes everywhere in the copy
17. Generic buzzword-heavy copy
18. Serif italic accent text
19. Repeating the same trendy font pairing, such as Space Grotesk + Instrument Serif
20. Grain/noise layered over a gradient

Practical interpretation:
- Do not ban these patterns mechanically; use them when they fit the brand and task.
- Avoid stacking many of them simply because an AI design assistant suggested them.
- Establish a deliberate type scale, spacing system, color logic, icon language, and component vocabulary before polishing effects.
- Customize component libraries instead of shipping their default look unchanged.
- Review the product as a whole for repetition: the strongest signal of generic AI design is often **the combination of familiar clichés**, not any one component.
- Copy matters too. Generic phrases and overused punctuation can make the interface feel templated even when the visuals are polished.

Core principle: **AI can accelerate execution, but the final product still needs an intentional visual identity rather than a collage of current design defaults.**

---

## Website / SEO / Technical Launch Checklist

Before treating a website as finished, check the following technical SEO and launch items:

- Build a `sitemap.xml`.
- Build a `robots.txt` file.
- Check for unintended `noindex` tags and remove/fix them where pages should be indexed.
- Add and optimize meta titles.
- Add meta descriptions.
- Add canonical tags.
- Fix heading hierarchy.
- Use only one main `H1` tag per page.
- Add alt text to images.
- Add relevant schema markup / structured data.
- Add useful internal links.
- Find and fix broken links.
- Compress images.
- Improve Core Web Vitals.
- Add an Open Graph image (`og:image`) for social sharing.
- Clean up URL slugs.
- Enforce HTTPS.
- Create a backlink strategy.
- Verify the site in Google Search Console.
- Fix mobile responsiveness.

The overall idea is that a website is not finished when the visual design is done; crawlability, metadata, indexing, performance, mobile behavior, internal structure, and search visibility also need to be checked.


#### Search discovery verification

A later tutorial reinforces a simple failure mode for AI-built websites: the site can look finished but still be effectively invisible to search engines. Treat search discoverability as a release check rather than a post-launch afterthought.

- Submit/verify the production property in **Google Search Console** when Google discovery matters.
- Confirm the production sitemap is reachable and submitted where appropriate.
- Inspect representative URLs for indexing/crawl problems.
- Make sure each important page has a deliberate title and meta description aligned with the page's actual topic/search intent.
- Do not assume deployment automatically means indexing or ranking.

**Audit criterion — MUST for indexable public websites:** provide evidence that the production domain is crawlable, important URLs are discoverable/indexable, and metadata is intentional.




### Use agent-assisted SEO tooling as an audit accelerator, not an authority

**Requirement class:** SHOULD for non-trivial public websites where organic search matters; WHEN APPLICABLE for agent-assisted development workflows.

A tutorial demonstrates an open-source SEO platform with an MCP/agent connection that can expose keyword research, competitor analysis, backlinks, rank tracking, technical audits, and related SEO data directly to an AI coding agent. The specific tool is not the requirement. The reusable lesson is that agents can work faster when they have **structured SEO evidence** rather than relying on guesses.

Audit criteria:
- [ ] SEO agents/tools can inspect the **production domain or a production-representative environment**, not only source files.
- [ ] The audit covers crawlability, indexability, metadata, canonicalization, headings, internal links, broken links, structured data, performance/Core Web Vitals, and mobile behavior as applicable.
- [ ] Keyword or competitor data is treated as research evidence, not as permission to stuff keywords or copy competitors.
- [ ] Rank/backlink/traffic estimates are labeled as estimates unless verified by first-party analytics or search-console data.
- [ ] If an AI agent can modify the site, changes go through normal source control, review, testing, and deployment gates rather than writing directly to production.
- [ ] Third-party SEO/MCP credentials are scoped minimally and stored as secrets; write access is not granted when read-only access is sufficient.
- [ ] Search Console, analytics, or customer-query data connected to an agent is handled according to the project's privacy/data-access rules.
- [ ] Proposed SEO fixes are verified against official search-engine guidance when they affect indexing, structured data, redirects, canonicalization, or other search-critical behavior.

**Agent evidence examples:** crawl/audit report, representative URL inspection, keyword research export, broken-link report, Core Web Vitals/Lighthouse result, Search Console evidence, or a reviewed PR containing the proposed fixes.

Core principle: **give agents real SEO data, but keep human/release controls around what they change.**

### Set up domain, app, and email subdomains deliberately

**Requirement class:** MUST when a product owns a custom domain and sends production email; SHOULD for public web apps that separate marketing and application surfaces.

A tutorial shows a simple post-domain setup: put the application on a dedicated subdomain, separate transactional/app email from marketing email, and then verify the public domain with search tooling. The exact providers shown are not requirements; the reusable lesson is to make domain boundaries intentional.

Audit criteria:
- [ ] The production domain architecture is documented: apex/marketing site, application subdomain(s), API subdomain(s), and any other public surfaces have clear ownership.
- [ ] Application hosting on a subdomain (for example `app.example.com`) is used when it improves deployment isolation, routing, cookies, security boundaries, or product organization; otherwise the chosen structure is justified.
- [ ] Transactional/app email and bulk/marketing email are separated when practical so reputation or abuse in one stream does not unnecessarily damage the other.
- [ ] Sending domains/subdomains are authenticated with the provider-required DNS records such as SPF, DKIM, and DMARC where applicable.
- [ ] DNS records are versioned/documented operationally so changes can be reviewed and recovered.
- [ ] Links in production emails resolve to trusted product-controlled domains and use HTTPS.
- [ ] Marketing email has the required consent/unsubscribe behavior and is not sent through a stream intended only for critical transactional mail.
- [ ] Public/indexable web surfaces are verified in the relevant webmaster/search console and representative production URLs are checked for discoverability.

Core principle: **domain structure, email reputation, and search discoverability are infrastructure decisions, not cosmetic setup tasks.**

### Website Quality Metrics — reusable audit matrix

Run this matrix against **every website or web surface**. The table defines the expected rule, not a current-project status. Mark each item in the per-build audit as ✅ / 🟡 / ❌ / ⭕ / 🔍.

#### Frontend / UX metrics

| Metric | Class | Acceptance criterion |
|---|---|---|
| Dark mode | WHEN APPLICABLE | Support dark mode when it is part of the product/brand/system-theme experience. Do not add it mechanically when the design is intentionally light-only. |
| Sticky header | WHEN APPLICABLE | Use when persistent navigation materially helps. It must not cover anchors/content, must work on small screens, and must preserve keyboard access. |
| Mobile menu | WHEN APPLICABLE | Required when navigation no longer fits clearly on mobile. Keep focus management, escape/close behavior, and accessible labels correct. |
| Hover states | SHOULD | Interactive controls should have deliberate hover treatment on pointer devices and equivalent keyboard focus-visible states. |
| Scroll progress bar | WHEN APPLICABLE | Use for long-form reading or multi-step progress where position matters; do not add decorative progress UI without user value. |
| Back-to-top | WHEN APPLICABLE | Consider for sufficiently long pages. Do not replace normal/native scrolling behavior. |
| Loading states | MUST WHEN ASYNC | Every user-visible async operation must have an intentional pending, success, empty, and error behavior. |
| Search | WHEN APPLICABLE | Add when content/records are large enough that navigation/filtering alone is insufficient. Search results need empty/no-result/error states. |
| Skip-to-content | MUST for public web UI | Provide a keyboard-accessible skip link that targets the main content region. |
| Floating contact button | WHEN APPLICABLE | Add only when contact/support is a high-frequency action. It must not obscure content or compete with the primary CTA. |
| FAQ section | WHEN APPLICABLE | Build from real recurring user/support questions, not filler content. |
| Newsletter signup | WHEN APPLICABLE | Define consent, validation, storage, unsubscribe, privacy handling, success, and failure states before launch. |
| Password visibility toggle | MUST WHEN PASSWORD INPUT EXISTS | Password inputs should support visibility toggling without breaking accessible naming or security behavior. |
| Cookie / consent banner | MUST WHEN REQUIRED | Only show when deployed cookies/trackers require consent. It must offer meaningful choices and persist them correctly. |
| Confirmation modal | MUST for destructive/high-impact actions | Confirm only actions where accidental execution has meaningful consequences. Avoid modal fatigue for reversible low-risk actions. |
| Real 404 page | MUST | Provide a useful branded not-found experience with a path back to valid navigation. |
| Print stylesheet | WHEN APPLICABLE | Add `@media print` rules when pages are expected to be printed or saved as clean PDFs. |
| UTM / campaign attribution | WHEN APPLICABLE | Preserve needed `utm_*` parameters, define attribution rules, and minimize collected data. |
| Copy-to-clipboard | WHEN APPLICABLE | Use for values users repeatedly copy. Provide success/failure feedback and a fallback where needed. |
| Last-updated dates | SHOULD for freshness-sensitive content | Show update dates on policies, help/status/reference material where freshness affects trust or decisions. |

#### Backend / performance metrics

| Metric | Class | Acceptance criterion |
|---|---|---|
| Images compressed / optimized | MUST | Source assets should be reasonably compressed and runtime delivery should use appropriate responsive formats/sizes such as AVIF/WebP when supported. |
| Lazy-load non-critical images | SHOULD | Below-the-fold/non-critical imagery should load lazily. Above-the-fold/LCP imagery should be prioritized intentionally. |
| Split code into chunks | MUST for non-trivial apps | Use route/module splitting and dynamic loading for genuinely heavy client-only features. Avoid shipping one oversized bundle. |
| Cache API responses | WHEN APPLICABLE | Define cacheability, TTL, invalidation, stale behavior, and user-specific boundaries. Never cache sensitive/private data indiscriminately. |
| CDN | SHOULD for public production assets | Verify CDN/static-edge delivery, cache headers, geographic behavior, and purge/invalidation strategy from the deployed domain. |
| Minify JS and CSS | MUST for production | Production build must bundle/minify assets. Verify output rather than assuming dev behavior matches production. |
| Database indexes | MUST WHEN DATABASE EXISTS | Index based on actual query/filter/join/order patterns. Validate with query plans and measured latency rather than adding indexes blindly. |
| Reduce unnecessary re-renders | SHOULD | Keep state local, avoid needless client components/state churn, memoize only when measured, and profile before/after. |
| Debounce/throttle input handlers | WHEN APPLICABLE | High-frequency handlers that trigger network or expensive work should be debounced/throttled with correct UX semantics. |
| Paginate / virtualize large lists | MUST WHEN LISTS ARE LARGE | Avoid loading/rendering unbounded collections. Use pagination, cursoring, virtualization, or progressive loading. |
| Remove unused dependencies | SHOULD | Keep dependency surface lean. Periodically run dependency audits and remove packages not used in runtime/build/test flows. |
| Defer non-critical scripts | MUST WHEN THIRD-PARTY SCRIPTS EXIST | Analytics/chat/ads/embeds should not block critical rendering unless technically required. |
| Loading skeleton | WHEN APPLICABLE | Use only when it improves perceived waiting and does not create misleading content or layout shift. |
| Load balancer | WHEN APPLICABLE | Add when traffic/availability architecture requires multiple service instances. It is not a default frontend checkbox. |
| Compress API payloads | MUST for sizable APIs | Use HTTP compression plus small response shapes; avoid returning unused fields. |
| Database connection pooling | MUST WHEN SERVER DB CONNECTIONS EXIST | Configure pooling for the deployment model and prevent connection exhaustion. |
| Cache expensive queries | WHEN APPLICABLE | Cache measured expensive work with explicit freshness/invalidation rules and tenant/user boundaries. |
| Fix N+1 database queries | MUST | Detect excessive query counts in relational/object-loading flows and replace with joins/batching/prefetching as appropriate. |
| Server-side caching | WHEN APPLICABLE | Define what can be cached server-side, for how long, and how it invalidates. Avoid serving one user's data to another. |
| Lighthouse audit | MUST for public web release | Run against the deployed/release build on mobile and desktop; record regressions over time. |

#### Lighthouse / web performance release gate

For every deployable public web build, record at minimum:

- [ ] Performance score
- [ ] Accessibility score
- [ ] Best Practices score
- [ ] SEO score
- [ ] Largest Contentful Paint (LCP)
- [ ] Interaction to Next Paint (INP)
- [ ] Cumulative Layout Shift (CLS)
- [ ] Total Blocking Time (TBT) for lab diagnostics
- [ ] Main/route bundle sizes
- [ ] Image/font/JS/CSS request counts and transfer sizes
- [ ] Major console errors/warnings reviewed
- [ ] Network failures/4xx/5xx reviewed

Use performance metrics as **regression guards**, not vanity scores. A new feature should not silently introduce major bundle growth, accessibility regressions, layout shift, blocking scripts, or unnecessary network work.

#### Metric policy: avoid cargo-cult features

This matrix is a **decision framework**, not a command to implement every feature. Cookie banners, skeletons, pagination, load balancers, database indexes, connection pooling, confirmation modals, search, dark mode, and other items should exist only when the product has the corresponding requirement. A well-designed build can legitimately mark an item **⭕ Not applicable** — but the reason should be explicit.

---

## Legal / Accessibility

### Accessibility needs to be handled explicitly in AI-built / “vibe-coded” products

The tutorial warns that quickly generated websites and apps can ship with accessibility problems that expose the owner to complaints or legal risk.

The post shown behind the speaker makes these claims:

- More than **60% of companies** surveyed said AI-generated content was the main cause of accessibility-related legal action.
- More than **50%** reportedly publish at least a quarter of their AI-generated content without an accessibility review.
- Roughly **80% of cases** mentioned in the post reportedly ended in a financial settlement.

The practical recommendation in the clip is to make sure the product has an **accessibility statement** and that it is easy to find, typically through the footer.

A basic accessibility statement should communicate things such as:

- Commitment to making the product usable by people with disabilities.
- Accessibility standards or targets being followed.
- Known limitations, if any.
- A way for users to report accessibility problems or request assistance.
- Contact information for accessibility feedback.

The tutorial suggests using AI to draft the statement and linking it in the website footer.

**Important compilation note:** an accessibility statement by itself does **not** make a website or app accessible and is not a substitute for actual accessibility work. The product still needs accessible structure, keyboard support, labels, contrast, alt text, focus states, screen-reader compatibility, testing, and remediation of real defects.

---


### Legal/compliance traps common in fast or AI-assisted builds

A tutorial highlights several areas that are easy to miss when an app is assembled quickly. The exact fine amounts shown in the clip are jurisdiction- and fact-specific and should **not** be used as fixed benchmarks. The reusable SOT requirement is to verify the underlying obligations before release.

#### Cancellation must not use dark patterns
- Users must be able to find and complete cancellation without deceptive obstruction.
- Do not use misleading button hierarchy, hidden exits, repeated guilt screens, or unnecessary steps intended only to prevent cancellation.
- Subscription cancellation UX must follow the applicable store/platform rules and consumer-protection law for the markets served.

#### Account deletion must cover the real data lifecycle
- When account deletion is required/offered, deleting the visible login record alone is not enough.
- Identify associated profile data, uploaded files, user-generated content, tokens/sessions, analytics identifiers, backups/retention exceptions, and third-party processor data.
- Document what is deleted immediately, what is retained temporarily, and the lawful reason for retention.

#### Age / child-directed-product checks
- If children may use the service or the product is directed at children, determine whether COPPA or other child-privacy rules apply.
- Do not collect date of birth merely as decoration; define the behavior triggered by the age result.
- Verify parental consent, data minimization, advertising/analytics restrictions, and store age-rating requirements where relevant.

#### Marketing email unsubscribe
- Marketing email must provide a functioning unsubscribe mechanism where required.
- Unsubscribe actions should be honored reliably and reflected in the sending system, not just hidden in UI.
- Keep transactional/service messages logically separate from marketing consent where the law distinguishes them.

#### Privacy policy must describe the actual system
- Do not ship a generic template that omits the real data flow.
- Name or accurately describe material categories of processors/services used for authentication, payments, analytics, AI, storage, email, crash reporting, advertising, and other data handling.
- Keep the policy synchronized with the implementation and retention/deletion behavior.

**Audit criterion — MUST WHEN APPLICABLE:** legal/privacy review should trace the real product behavior, not just verify that policy links exist. For jurisdiction-specific requirements, verify against current official guidance or qualified legal advice.


## App Store Review / Compliance

### Common reasons a quickly built iOS app gets rejected

One tutorial gives a 12-item pre-submission checklist for "vibe-coded" iOS apps. The wording in the clip is shorthand, so the items below preserve the tutorial's point while adding the practical interpretation.

1. **Stripe in-app / external payment for digital purchases**
   - Do not assume a normal Stripe checkout can be used inside an iOS app for digital content, subscriptions, or features.
   - Apple's in-app-purchase rules and storefront-specific exceptions need to be checked for the app's exact case.

2. **Missing Sign in with Apple**
   - If the app offers certain third-party/social login methods, Apple may also require Sign in with Apple unless an exception applies.
   - This is not the same as saying every app must provide Apple login.

3. **No account-deletion flow**
   - If users can create an account, make sure they can initiate account deletion in the app where Apple's rules require it.

4. **"Website in a box"**
   - A thin wrapper around a website with little native/app-specific value can run into minimum-functionality problems.

5. **Broken demo/reviewer login**
   - If App Review needs a demo account, the credentials and any required review instructions must actually work.

6. **Broken iPad UI**
   - If the submitted build supports iPad, test the interface on iPad layouts rather than assuming an iPhone layout will stretch correctly.

7. **Outdated App Store screenshots**
   - Screenshots should reflect the current product and should not misrepresent the submitted build.

8. **"Coming soon" / unfinished screens**
   - Remove placeholder or visibly unfinished experiences from the production submission unless they are appropriate and compliant for the specific app.

9. **Broken links**
   - Check support, privacy-policy, terms, account, and other links before submission.

10. **Missing reporting controls where users can post content**
   - The clip's shorthand is `"Report" feature` and the spoken example says: if the product has comments, make sure users also have a way to report problematic content where required.

11. **Broken Restore Purchases**
   - If the app has restorable in-app purchases/subscriptions, make sure the restore flow works in review conditions.

12. **Paid features shown in screenshots without indicating they are paid**
   - If App Store screenshots show functionality that requires purchase/subscription, clearly indicate that those features are paid rather than presenting them as universally included.

### Lessons from an actual App Store rejection cycle

A later tutorial walks through several real rejection notes from one iOS submission. The useful lesson is that App Review can fail for **build configuration, authentication UX, metadata, subscriptions, and App Store Connect setup at the same time**. Treat submission as a system-level release check, not just a code check.

#### 1. Test the actual Release / archive build

The first rejection was an **App Completeness** issue: Sign in with Apple failed for the reviewer even though the developer had been testing the app successfully. The tutorial traces the problem to testing mainly in a debug configuration rather than validating the release configuration used for App Store submission.

Practical rule:
- Test authentication and other environment-sensitive features using the same **Release/archive configuration** that will be submitted.
- Verify entitlements, capabilities, bundle identifiers, environment variables, backend redirect/config values, and production credentials in the release build.
- Do not treat “works in debug” as proof that the App Store build works.

#### 2. Do not force users to re-enter data that Sign in with Apple already supplies

Apple rejected the onboarding flow because the app used Sign in with Apple and then required the user to provide a name and/or email again. The developer tried reframing the field as a **display name rather than a legal name**, but the flow was still rejected.

The fix shown in the tutorial was to remove the required name field from onboarding altogether and let users change profile information later.

Practical rule:
- Use the information provided through Apple's Authentication Services flow where appropriate.
- Do not require a redundant name/email step immediately after Sign in with Apple simply to complete onboarding.
- If a profile nickname or display name is optional product functionality, consider letting the user set it later rather than making it a login requirement.

#### 3. Clearly label paid functionality in App Store metadata

A rejection under **Guideline 2.3.2 — Accurate Metadata** said the app description/screenshots referred to paid content or features without clearly telling users that an additional purchase was required.

The tutorial's fix was to add explicit subscription language to the listing, e.g. that a subscription is required to access all features and that weekly/yearly plans are available.

Practical rule:
- If screenshots or description text promote subscription-only functionality, clearly disclose that access requires purchase/subscription.
- Review screenshots and marketing copy from the perspective of a user who has not yet seen the paywall.
- Avoid implying that every pictured feature is included for free when it is not.

#### 4. Submit the in-app purchases with the app and test the purchase path

Another **App Completeness** rejection said the subscription button was unresponsive. A related review note said one or more in-app purchase products had not been submitted for review.

Practical rule:
- Create and configure the IAP/subscription products in App Store Connect.
- Attach/submit the relevant products with the app version when required.
- Test the full subscribe flow in the review-equivalent environment rather than only rendering the paywall UI.
- Confirm product identifiers, availability, pricing, storefront configuration, and purchase restoration before submission.

#### 5. Include a functional Terms of Use / EULA link

The review note shown in the tutorial required a functional **Terms of Use (EULA)** link in App Store metadata. It stated that, when using Apple's standard EULA, the Terms of Use link should be included in the app description; a custom EULA should be configured in App Store Connect.

Practical rule:
- Add a working Terms of Use/EULA link where App Store metadata requires it.
- Test the URL before submission.
- Keep privacy-policy, support, and Terms links distinct and functional.

#### 6. Check App Store Connect agreements before blaming the code

The tutorial also shows the **Agreements** area in App Store Connect while troubleshooting subscriptions. This is a reminder that paid functionality can depend on account/commercial setup outside the app binary.

Practical rule:
- Verify that required paid-app agreements are accepted and active.
- Check tax/banking/commercial setup where relevant.
- When a purchase flow fails in review, inspect both the app code **and** App Store Connect configuration.

**Release lesson:** a successful App Store submission requires the application binary, the release configuration, App Store metadata, IAP products, legal links, and App Store Connect agreements to agree with one another. A defect in any one layer can block review.

#### Pre-submission habit

Before uploading a release candidate, run a dedicated App Review pass covering:
- Release/archive build behavior — not only debug builds
- Authentication and Sign in with Apple onboarding
- Payments, subscriptions, and submitted IAP products
- App Store Connect agreements/commercial setup
- Account deletion
- Reviewer credentials
- iPhone and iPad layouts
- Store screenshots/metadata
- Clear disclosure of paid functionality
- Privacy, support, and Terms of Use/EULA links
- Dead links
- User-generated-content safety controls
- Purchase restoration

**Important note:** App Store Review rules change and contain exceptions. Treat this tutorial as a practical checklist, not as a substitute for checking the current Apple App Review Guidelines for the exact product and storefront.

---


## Product Messaging / Launch Growth

### Describe the ideal customer and desired relationship, not only the service

**Requirement class:** SHOULD for public product/service websites, landing pages, and acquisition copy.

One tutorial argues that generic service descriptions make it hard for the right prospects to recognize themselves. A stronger page explains **who gets the most value from the product or service, what they value, and what kind of relationship or outcome the product is designed for**.

Audit criteria:
- [ ] The primary landing page clearly identifies the intended user/customer and the problem or outcome being addressed.
- [ ] Copy explains the value in customer language rather than relying mainly on internal capability lists or vague phrases such as “comprehensive solutions.”
- [ ] Qualification language helps the right users self-select based on needs, priorities, workflow, maturity, or trade-offs.
- [ ] Positioning states meaningful preferences or trade-offs when they matter (for example, quality vs. lowest price, guided service vs. self-service, speed vs. customization).
- [ ] The page avoids pretending the product is for everyone.
- [ ] Audience qualification is based on legitimate product fit and is reviewed for legal/ethical issues; it should not create discriminatory exclusions unrelated to the product.
- [ ] Messaging claims can be supported by the actual product/service and do not promise outcomes that cannot be substantiated.
- [ ] Lead quality, qualified conversion, activation, retention, or another meaningful downstream metric is used to judge whether the positioning attracts the right audience.

Core principle: **good marketing lets the right prospect recognize “this was built for me” before the sales conversation starts.**

### Treat “viral launch” formulas as testable launch-content hypotheses

**Requirement class:** EXPERIMENT.

A tutorial presents a multi-point recipe for a “viral launch.” There is no reliable formula that can guarantee virality, so the checklist should be used as an **experiment library**, not a release requirement.

Candidate hypotheses worth testing:
- Put a real founder/operator/user in the content when authenticity and trust matter.
- Use a **specific, verifiable number** when concreteness improves the hook.
- Frame the problem clearly; in some categories, an explicit “enemy” or status quo can create useful tension, but avoid harassment, misinformation, or manufactured outrage.
- Introduce a distinct category/angle when the product is genuinely different instead of sounding interchangeable.
- Communicate **one clear message and one clear promise** per creative.
- Remove distracting or overly “AI-ish” animation/effects when they obscure the message.
- Produce platform-native vertical versions for short-form channels.
- Build the creative around a story rather than a feature dump.
- Use tension, contrast, or a non-consensus point of view carefully; disagreement is not a goal by itself.
- Show proof: product footage, user outcomes, data, demonstrations, testimonials, or other evidence that fits the claim.
- Give the viewer a clear reason to act now when one genuinely exists.
- Tie launches to relevant news/cultural context only when the connection is real and brand-safe.
- Test posting time/day rather than treating one creator's preferred day as universal.
- Test content length instead of assuming shorter is always better; use retention and conversion data.
- Build legitimate early distribution through customers, community, partners, team, or existing audience. Do not fabricate engagement.
- Adapt/cross-post creative across relevant platforms instead of assuming one channel is sufficient.
- Relaunch/repackage strong ideas when the first creative underperforms; change the hook, proof, framing, or audience rather than endlessly reposting the exact same asset.
- Measure **saves, shares, qualified clicks, signups, activation, revenue, and retention** where possible—not views alone.

Audit rule for launch experiments:
- [ ] Hypothesis is written before launch.
- [ ] Target audience and channel are defined.
- [ ] Creative has one primary message/promise.
- [ ] Claims have evidence.
- [ ] Success metric is defined in advance.
- [ ] Distribution method is legitimate and policy-compliant.
- [ ] Results are recorded and used to inform the next iteration.

Core principle: **launch playbooks are hypotheses; instrument them, test them, and keep only what works for the actual product and audience.**

---

## App Store Growth / Organic Acquisition


### Research before designing App Store screenshots

A tutorial proposes a simple workflow for making stronger App Store screenshot sets instead of designing them from scratch without reference.

Suggested workflow:

1. **Research screenshot patterns first.**
   - Use galleries/reference tools such as **ScreensDesign** and **Dribbble** to study how strong app listings present their products.
   - Collect references from relevant apps rather than copying a random visual style.

2. **Capture the best screens from your own app.**
   - Choose screens that communicate the product's strongest features or outcomes.
   - Prioritize screens a prospective user can understand quickly.

3. **Give an AI design assistant both sets of material.**
   - Provide the reference App Store screenshots.
   - Provide screenshots of your own UI.
   - Explain the product's important features and ask the model to help turn those inputs into an App Store screenshot concept/set.

4. **Keep the product truthful.**
   - References should guide composition, hierarchy, and messaging, not cause the generated marketing images to misrepresent features that do not exist.

The tutorial labels the result “high performing,” but performance still needs to be validated with actual store conversion data or experiments.

Core principle: **research proven presentation patterns, then adapt them to the real strengths of your own product instead of designing App Store screenshots in isolation.**

### Localize App Store metadata to compete in less crowded markets

The tutorial describes a localization strategy for getting organic App Store downloads without relying on paid advertising.

The creator says he gets more than **20,000 downloads per month** and frames localization as one of the systems he sets up for every launch.

Key idea: the App Store should not be treated as one global search market. The clip says Apple has storefronts across roughly **175 countries/regions**, while many developers effectively compete only in their default market.

Example:

- Search for a term such as **“calorie counter”** in the U.S. storefront and there may be hundreds of competing apps.
- Search for the equivalent term in German and the competition can be much lower.

The fix is **App Store localization**.

Apple allows localized metadata for different storefronts/languages, including items such as:

- App name/title
- Subtitle
- Keywords
- Description / localized listing text

The search system can use this localized metadata. Therefore, a German-localized title and keyword set can help an app appear for German searches even if the underlying app itself is still primarily in English.

### Use Apple Search Ads as keyword-demand research

The tutorial also uses the **Apple Search Ads** interface as a research tool even when not planning to run an ad.

The workflow shown is:

1. Search a target keyword in Apple Search Ads.
2. Look at Apple's popularity indicator for that keyword and its suggestions.
3. Repeat this for different languages/countries.
4. Find terms that appear to have **meaningful demand but relatively weak competition**.
5. Localize the App Store metadata around those terms.
6. Use AI to help translate/localize the metadata at scale.
7. Repeat across many storefronts rather than fighting only for one highly competitive English keyword.

The creator says this approach lets the app appear in **20+ stores** instead of competing only in one.

Core principle: **localization is not only translation; it is market-specific keyword positioning.**

---


### Prioritize storefronts and markets using real monetization evidence

**Requirement class:** EXPERIMENT / SHOULD for products targeting multiple countries or storefronts.

A tutorial ranks countries where people are said to be more willing to pay for apps. The exact ranking is time-sensitive and should not become a permanent rule. The reusable idea is to choose markets from **observed demand and monetization**, not population size or developer intuition alone.

Market-prioritization audit:
- [ ] Paid conversion is segmented by country/storefront where sample size permits.
- [ ] Revenue per install/user, ARPU/ARPPU, LTV, refund/churn, and trial-to-paid are compared by market when relevant.
- [ ] Store keyword demand and competition are considered alongside monetization.
- [ ] Localization effort, support burden, payment coverage, taxes, legal requirements, and cultural fit are included in the decision.
- [ ] Pricing is reviewed for local purchasing power and platform-supported price tiers instead of mechanically converting one currency.
- [ ] Store metadata, screenshots, onboarding copy, and support content are localized for markets selected as priorities when the expected return justifies it.
- [ ] Expansion decisions are revisited using current analytics instead of preserving a static "top countries" list from a tutorial.

Core principle: **choose where to compete using measured customer value, demand, competition, and operating cost — not country population alone.**

---

## App Ideation / Public Data & APIs

### Start app ideas from useful data that already exists

One tutorial argues that a useful way to discover app ideas is to look at **public datasets and public APIs before deciding what to build**. Instead of assuming every app needs proprietary data from day one, start by asking what valuable public information already exists and what user problem could be built around it.

Examples shown in the clip include public data for:
- Food/images and nutrition-related experiences
- Weather
- Transportation and live transit information
- Maps
- Events
- Jobs
- Books
- Movies
- Many other categories exposed through public APIs

The tutorial references the **Food-101** image dataset while discussing calorie/food-recognition apps, and cites **Cal AI** as an example of a product built around food-image recognition. A revenue figure is mentioned in the clip; treat it as the creator's example/claim rather than a verified benchmark.

A more interesting approach is often to **combine multiple public sources into one workflow**. The example shown is combining:
- Map data
- Live train/transit times
- Event information

That combination could create an app that helps someone plan an evening around an event and the last train home. The value comes from the **problem solved by the combination**, not from owning each underlying dataset.

The clip also points to the GitHub repository:

`public-apis/public-apis`

It is presented as a categorized directory of public APIs that developers can browse when exploring app ideas or asking an AI coding assistant to propose concepts around available data sources.

Practical ideation workflow:
1. Browse datasets/API directories by domain.
2. Identify data that updates often or affects real decisions.
3. Ask what repeated user problem that data could solve.
4. Look for combinations of two or more sources that create a more complete workflow.
5. Verify licensing, rate limits, attribution requirements, reliability, geographic coverage, and commercial-use terms before committing to the idea.
6. Prototype the value proposition before building a large backend.

Core principle: **a defensible app idea can begin with public data; the product value is often in the workflow, interpretation, combination, and user experience built on top of it.**

---

## Development / AI Coding Workflows

### “Everything Claude Code” repository / reusable agentic coding setup

One tutorial highlights a GitHub repository shown as:

`github.com/affaan-m/ECC`

The repository is presented as an **Everything Claude Code** / agent-harness collection that packages reusable coding workflows rather than starting every AI coding project from a blank configuration.

The clip shows a large library containing approximately:

- **261 skills**
- **64 agents**
- **84 commands**
- Additional hooks and MCP-related configuration/components are also shown.

Examples visible in the library include:

**Skills**
- Agent-harness construction
- Context budgeting
- Continuous agent loops
- Agentic OS patterns
- Autonomous loops
- MCP server patterns
- A/B regression testing
- Agent evaluation
- Content-hash caching

**Agents**
- Harness optimizer
- Code reviewer
- Code architect
- Code simplifier
- GAN planner / generator / evaluator
- E2E runner
- Build-error resolver
- Ally architect

**Commands**
- Harness audit
- Code review
- Feature development
- Checkpoint
- GAN design
- Evolve
- Hookify
- Santa loop
- Security scan
- Skill creation

The repository also shows configuration guidance for **MCPs**, hooks/plugins, and API-key placeholders.

The tutorial's main point is that a prebuilt repository like this can turn an AI coding assistant into a more complete engineering harness with:

- Reusable specialist agents
- Repeatable commands
- Memory/context optimization
- Continuous-learning or iterative loops
- Testing and validation workflows
- Security/review routines
- MCP/tool integrations

The clip also emphasizes that the ideas are not necessarily limited to Claude Code; it visually references use alongside tools such as **Codex, Cursor, Gemini**, and other coding agents.

Core principle: **build or reuse an engineering harness around the model instead of relying only on one-off prompts.**



#### Agent-harness audit rules

The exact number of bundled skills, agents, and commands shown across tutorials can change between repository versions. **Do not treat those counts as a requirement.** Audit the capabilities that matter instead.

For projects that rely heavily on coding agents, check whether the engineering harness provides:
- [ ] Version-controlled repository instructions and project conventions.
- [ ] Reusable commands/workflows for recurring engineering tasks instead of repeated ad-hoc prompts.
- [ ] Specialist review roles or subagents where they materially improve architecture, testing, security, or debugging.
- [ ] A repeatable security-review/scan workflow before release.
- [ ] Context or memory management so long sessions do not silently lose important project constraints.
- [ ] A way to preserve useful session learnings without blindly persisting mistakes or secrets.
- [ ] Tool portability where the team intentionally uses more than one coding agent/IDE.

For any third-party agent harness, starter kit, hook, plugin, MCP server, or copied configuration:
- [ ] Pin or record the version/commit being adopted.
- [ ] Review scripts, hooks, permissions, network access, and commands before executing them.
- [ ] Check licensing and commercial-use terms.
- [ ] Keep API keys/secrets outside the repository and give tools the minimum permissions needed.
- [ ] Do not assume popularity or a tutorial endorsement makes external automation safe.

Core principle: **reuse mature agent workflows, but audit the automation with the same care as production code.**


### Configure model/provider profiles and fallbacks intentionally

**Requirement class:** SHOULD when coding agents or AI-assisted build tooling can route across multiple cloud, BYOK, proxy, or local model providers.

One tutorial demonstrates using an agent client with an alternate model provider through a named configuration/profile, including an OpenAI-compatible local endpoint and a separate hosted provider. It also references local inference tooling and multiple model variants. The reusable lesson is not to depend on one opaque model path when the workflow benefits from controlled routing, but also not to treat every model as interchangeable.

Agent/model-routing audit:
- [ ] Named profiles/configuration layers exist when different tasks require different providers, models, privacy levels, or cost envelopes.
- [ ] Provider endpoints, model identifiers, context limits, and authentication expectations are explicit rather than hidden in ad-hoc shell history.
- [ ] API keys/tokens are stored outside source control and profiles contain no reusable secrets.
- [ ] Local/OpenAI-compatible proxy endpoints are bound and exposed intentionally; a development-only local endpoint is not accidentally reachable from untrusted networks.
- [ ] Project trust settings and tool permissions are reviewed before enabling an agent to execute commands or access repositories.
- [ ] Fallback providers/models are tested on representative repository tasks before being relied on during a limit/outage event.
- [ ] The workflow records which model/provider produced important changes when provenance matters for debugging or review.
- [ ] Cost, latency, privacy, context-window size, tool support, and code quality are considered when selecting a profile.
- [ ] Local/open-weight models are treated as an option for privacy, offline work, or cost control—not as automatically equivalent to the strongest hosted model.
- [ ] Switching providers does not bypass existing tests, code review, security scans, or release gates.

Core principle: **provider flexibility is useful only when routing is explicit, secure, testable, and quality-gated.**

### Control runaway infrastructure and API spend

**Requirement class:** MUST when the build uses metered APIs, cloud functions, paid AI inference, storage/egress, database operations, or other usage-priced infrastructure.

A tutorial illustrates how a quickly built app can create a large bill through a few common failure modes: no spend limit, fetching far more database data than necessary, retry loops, absent rate limits, and automated/bot downloads. The exact dollar examples are scenario-dependent; the reusable lesson is to make uncontrolled spend technically difficult.

Audit criteria:
- [ ] Provider-level budget alerts are configured for paid infrastructure.
- [ ] Hard spend caps, quotas, project limits, or an operational kill switch exist wherever the provider supports them.
- [ ] Paid endpoints have per-user/per-key/per-IP rate limits appropriate to the abuse model.
- [ ] Retries are **bounded** with a maximum attempt count; use backoff/jitter where appropriate.
- [ ] Repeated failures cannot create an infinite or near-infinite paid request loop.
- [ ] Circuit breakers or equivalent failure guards exist for dependencies that can fail repeatedly or become expensive.
- [ ] Database queries request only the rows/columns required; unbounded "load the whole table/database" behavior is prohibited.
- [ ] Large collections/downloads use pagination, limits, streaming, signed URLs, quotas, or another bounded strategy.
- [ ] Bot/scraper/download abuse is considered for public assets and expensive endpoints.
- [ ] Usage/cost telemetry can identify which endpoint, user, tenant, model, job, or asset is driving spend.
- [ ] Alerts exist for abnormal request volume, egress, token usage, database operations, or other relevant billing units.
- [ ] Non-production environments cannot accidentally consume production-scale budgets.

Useful failure-mode tests:
1. Force an upstream API to return repeated errors and verify retry behavior stops.
2. Attempt high-frequency requests and verify rate limiting.
3. Request the largest legal list/export and verify it is bounded.
4. Simulate bot-like download behavior and confirm abuse controls.
5. Verify an operator can disable the expensive path quickly without redeploying the entire product when practical.

Core principle: **cost safety is part of reliability and security. A production system should fail boundedly, not spend unboundedly.**

### Evaluate open-source components and external APIs before rebuilding commodity infrastructure

**Requirement class:** SHOULD for capabilities that could reasonably be supplied by an established library, open-source project, or API.

One tutorial highlights a commercial AI/video stack that published substantial code and exposed pay-per-request APIs. The build lesson is broader than that example: open source and APIs can remove months of undifferentiated engineering, but adoption still requires technical, legal, and financial due diligence.

Build-vs-buy/reuse audit:
- [ ] The team explicitly considered whether this capability should be built, bought, or reused.
- [ ] License terms permit the intended commercial/distribution model.
- [ ] Security-sensitive external code is reviewed before being trusted with secrets, user data, or deployment credentials.
- [ ] Dependency maintenance/activity and known vulnerabilities are checked.
- [ ] API data-handling/privacy terms are compatible with the product's data classification.
- [ ] Rate limits, quotas, geographic availability, latency, and reliability are understood.
- [ ] Unit economics are modeled using the provider's **actual billing unit** (request, token, image, video-second, bandwidth, etc.).
- [ ] Cost at expected scale and under abuse is acceptable.
- [ ] Vendor lock-in and migration/fallback options are consciously accepted or mitigated.
- [ ] Critical behavior is wrapped behind an internal interface where portability is valuable.
- [ ] The product does not copy code, assets, or competitor functionality in violation of license, copyright, trademark, or platform terms.

Core principle: **do not rebuild commodity infrastructure for pride, and do not outsource critical infrastructure without understanding the dependency.**

### Supabase RLS does not automatically protect sensitive columns

A security tutorial shows a real failure mode from building too quickly: the app had **AI usage limits** stored in a user/profile record, and Row Level Security (RLS) allowed each authenticated user to update their own row. That sounded safe because users could only access their own account, but it still allowed them to modify fields that should have been controlled only by the backend.

The creator says a security researcher emailed them after discovering that a user could effectively give themselves **unlimited AI usage** by changing their own limit-related database fields.

The mistake:
- User-level access was restricted to the correct row.
- But the policy was too broad about **which columns inside that row** the user was allowed to change.
- Sensitive fields such as AI quotas/limits were therefore still client-modifiable.

The fix shown is to restrict normal users so they can update only explicitly allowed profile fields, while limit/quota fields remain **backend-only**.

General rule for Supabase or any database-backed app:
- RLS answers **which rows** a user can read/write.
- You must also verify **which fields/operations** the client is allowed to mutate.
- Do not trust a client-side UI to hide or disable sensitive fields; a user can bypass the UI and call the database/API directly.
- Treat credits, quotas, subscription state, role/permission flags, balances, entitlements, billing state, and other authority-bearing fields as server-controlled unless there is a very specific reason not to.
- Review write permissions from an attacker's perspective: “What could I change if I called this endpoint/table directly?”

Useful release checks derived from the clip:
- Can a user change their own quota, role, subscription, entitlement, or billing-related fields?
- Can they update hidden columns that the UI never exposes?
- Are privileged fields changed only through trusted server/backend logic?
- Are RLS policies tested with adversarial requests, not only normal UI flows?

Core principle: **“users can only edit their own row” is not enough; users should only be able to edit the specific fields they are authorized to control.**

### AI-generated code is not the same thing as production readiness

Another tutorial uses an iceberg analogy: the visible "vibe-coded website" is only the small part above water, while **real software engineering** includes a much larger set of production concerns.

The clip rapidly lists areas that still need deliberate engineering, review, and testing. Recoverable items include:
- Input validation / abuse prevention
- Roles and permissions
- Credential/token expiry
- HTTPS and TLS
- Rate limiting and abuse prevention
- Dependency management/security
- Multi-tenancy and data isolation
- PII handling
- Data-retention and deletion policies
- Audit trails
- Integration testing
- Regression testing
- Chaos/resilience testing
- Checks enforced in CI
- Code-review process and engineering standards
- Retry logic with backoff
- Circuit breakers
- Fallback behavior
- Race-condition handling
- Cache/invalidation behavior
- RPO and disaster recovery
- Accessibility
- Architecture diagrams
- API/contracts and other interface guarantees

The practical message is not that Claude or another coding model can never help with these items. It is that **having AI generate a working feature does not prove that all of these production properties are designed, implemented, tested, monitored, and maintained correctly.**

A better workflow is to treat the model as an engineering assistant while keeping explicit production checklists for:
1. Security and access control
2. Data/privacy lifecycle
3. Reliability and failure handling
4. Testing and CI
5. Architecture/contracts
6. Accessibility
7. Operations/disaster recovery
8. Human review and standards

Core principle: **"it runs" is a milestone, not evidence that the system is production-ready.**

### Run more iOS simulators by trimming unnecessary simulator services

A tutorial demonstrates **SimSlim**, a public tool/repository intended to reduce the resource cost of running many iOS Simulator instances on one Mac.

The problem described is that each simulator can start numerous background services even when a particular test does not need them, including examples such as:
- iCloud-related services
- Siri
- Photos-related services
- Search/indexing
- Other background daemons

Those processes consume memory, which becomes a bottleneck when running a large simulator fleet for automated testing or coding-agent workflows.

The repository description shown in the clip is essentially: **run more iOS simulators on one Mac by disabling background daemons that a simulator does not need.**

The demonstration shows roughly **12 simulators** running on a **2022 M2 MacBook Air with 8 GB RAM**, illustrating the type of density the creator is trying to achieve.

Potential use cases:
- Parallel UI/E2E testing
- Multi-agent development where separate agents need separate simulator instances
- Testing several device configurations at once
- Reducing memory pressure on lower-RAM development Macs

Important engineering caveat: if a test actually depends on Siri, Photos, iCloud, indexing, or another service that has been disabled, the optimized simulator is no longer representative for that test. Use service trimming selectively rather than assuming every test environment should be stripped down.

Core principle: **for large simulator fleets, optimize the simulator environment as well as the test code.**

---

## Monetization / App Pricing


### Run controlled A/B tests on conversion pages and paywalls

**Requirement class:** EXPERIMENT; MUST follow experiment-integrity rules when an A/B test is run.

A tutorial shows examples where apparently minor wording differences—such as how a duration is expressed or how a benefit headline is phrased—produce different conversion outcomes. The reusable lesson is not that one phrase always wins; it is that **conversion surfaces should be simple enough to understand quickly and important copy changes should be tested cleanly**.

Experiment-integrity checklist:
- [ ] Define the hypothesis before exposure starts.
- [ ] Change one primary variable at a time when the purpose is to learn which change caused the result. If multiple changes are intentionally bundled, treat the result as a package test and do not attribute the effect to one element.
- [ ] Random assignment is stable for a user/session as appropriate and avoids users bouncing between variants.
- [ ] Exposure and conversion events are instrumented correctly before interpreting results.
- [ ] Primary metric and guardrail metrics are defined in advance.
- [ ] Sample size/duration/decision rule are defined before declaring a winner; do not stop only because an early result looks favorable.
- [ ] Check for obvious sample-ratio mismatch, broken variants, unequal traffic sources, or instrumentation errors.
- [ ] Use plain, outcome-oriented copy that users can understand without decoding clever language.
- [ ] Verify the winning variant does not improve short-term conversion by harming refunds, retention, trust, accessibility, support burden, or compliance.
- [ ] Record the result, dates, audience, variant definitions, and follow-up decision so the organization does not repeat the same experiment blindly.

Good variables to test can include:
- benefit headline / value proposition
- duration framing
- CTA wording
- proof/social-proof placement
- price framing
- trial/paywall timing
- plan ordering or default emphasis
- layout simplification

Core principle: **simplify the decision, isolate what changed, and trust measured behavior more than design preference.**



### Subscription revenue-leak checklist — platform settings and cancellation flow

A tutorial presents several small configuration/flow changes that may materially affect subscription revenue. Separate the **platform/configuration checks** from the **conversion experiments**.

#### Platform/configuration checks

1. **Check small-business commission programs.**
   - If eligible for a reduced App Store commission program, verify enrollment and current eligibility rather than assuming the default commission applies.
   - Commission rates and eligibility rules can change; verify current official Apple terms.

2. **Configure Billing Grace Period when appropriate.**
   - For auto-renewable subscriptions, evaluate whether users should retain entitlement for a grace period while Apple retries a failed payment method.
   - Test entitlement behavior during billing retry, grace, recovery, and expiration states.
   - Do not implement access rules based only on a client-side "paid" boolean.

#### Conversion / retention experiments

3. **Test paywall timing deliberately.**
   - The clip recommends showing the paywall early in onboarding rather than only after the user has used the app for a long time.
   - Treat this as an **EXPERIMENT**, not a universal rule. Test early vs later paywall timing against activation, trial starts, paid conversion, refunds, churn, and retention.

4. **Use the cancellation surface as a retention opportunity without blocking exit.**
   - A blank cancellation surface wastes the opportunity to explain value or present a legitimate save offer.
   - Where the platform supports retention messaging/offers, test concise copy, a relevant image, or an eligible offer.
   - The user must still be able to cancel easily; retention messaging must not become a dark pattern.

5. **Test trial length instead of copying the default.**
   - The tutorial compares short and longer trials and claims the longer trial converted more users in the cited data.
   - Trial length is an **EXPERIMENT**. Measure downstream paid conversion, refund rate, trial abuse, retention, and revenue—not just trial starts.

**Agent audit criteria:**
- Verify commission-program eligibility/configuration.
- Verify billing retry/grace-period entitlement handling.
- Record where the paywall appears and why.
- Verify the cancellation flow is easy to complete and, if retention messaging is supported, whether it is intentionally configured.
- Record trial length and evidence for why that duration was chosen.


### Preference framing / “fake choice” before showing a price

A tutorial on pricing psychology describes a change that the creator says allowed a company to raise prices by roughly **30%** without the expected sales decline; the clip claims sales instead increased and attributes the effect to one question added to the product page.

Before showing the offer, the customer is asked something like:

> Which of the following best describes your preference today?

The two options shown are essentially:

- **Option A:** I want faster/better results.
- **Option B:** I want the lowest price.

The psychological framing described in the clip works like this:

- If the customer chooses **faster results**, they have mentally stated that results matter more than minimizing price.
- If the customer chooses **lowest price**, they are primed to interpret the next offer as the best-price option being shown to them.

The creator calls this an **“illusion of choice”** or **“fake choice”** in marketing: both paths prepare the customer to interpret the next offer through a frame they selected themselves.

The intended mechanism is not simply the two buttons; it is that the customer first states what outcome matters to them, so the following offer can be positioned as matching that preference.

Practical takeaway:
- Ask a meaningful preference question before presenting an offer.
- Use the answer to tailor the explanation, package, or price shown next.
- The customer should feel that the recommendation corresponds to the outcome they selected.

Use this carefully: preference questions are strongest when they lead to a genuinely relevant recommendation. Avoid creating a deceptive choice where both paths secretly force the same conclusion without giving the user meaningful information or alternatives.

### Test a pay-first model instead of defaulting to free

A tutorial cites a RevenueCat study covering roughly **115,000 apps** and argues that making an app free by default can leave substantial revenue on the table.

Main points shown in the clip:

- A free-first app may get more people through the initial experience, but only a small percentage of downloads ultimately become paying users.
- A paywall-first / pay-first approach asks users to confront the price earlier instead of using the product indefinitely before seeing the offer.
- The example shown reports revenue per download of roughly:
  - **Free app:** `$0.38`
  - **Paywall-first:** `$3.09`
- That is presented as roughly **8× more revenue per download** from the same number of people.

A common fear is: **"If I make people pay first, won't they leave?"**

The clip's counterpoint is that one-year retention in the cited comparison was nearly the same:
- Pay-first: about **27%**
- Free: about **28%**

The lesson presented is therefore:

- Put the price in front of users earlier.
- Let users clearly see what the product does and what it costs.
- Do not assume that hiding the paywall until later automatically improves long-term retention.
- Measure revenue per download and retention together rather than optimizing only for free sign-ups or installs.

The tutorial frames this as a high-leverage pricing experiment: **one change to the monetization flow can significantly change revenue without necessarily producing a comparable drop in retention.**

---

## SOT Maintenance Rules for Future Tutorials

When new tutorial clips or engineering lessons are added:
- Convert the useful lesson into a **reusable rule, acceptance criterion, release check, experiment, or warning**.
- Merge UI/UX material, including onboarding and empty-state guidance, into **UI / UX Design**.
- Merge SEO, web performance, development, or website-launch material into **Website / SEO / Technical Launch Checklist** or an appropriate technical subsection.
- Merge pricing, subscriptions, conversion, revenue, offer-framing, paywall, or A/B-test material into **Monetization / App Pricing** and classify tactics as **EXPERIMENT** unless they are platform/compliance rules.
- Merge positioning, landing-page messaging, launch-content, viral-growth, or general acquisition material into **Product Messaging / Launch Growth**.
- Merge App Store localization, screenshots, ASO, keyword research, or acquisition material into **App Store Growth / Organic Acquisition**.
- Merge app-idea, public-dataset, or public-API discovery material into **App Ideation / Public Data & APIs**.
- Merge accessibility/compliance material into **Legal / Accessibility**.
- Merge coding agents, repositories, prompts, backend security, cost guardrails, external API/open-source due diligence, or engineering harnesses into **Development / AI Coding Workflows**.
- Add new top-level sections only when the subject belongs to a genuinely different build domain.
- Do not organize the SOT by video number, creator, or a specific project. Source-specific claims may be retained as evidence/context, but the operational rule must remain project-neutral.
- If a tutorial conflicts with official platform/security/accessibility guidance, official guidance wins.
- Separate **universal release requirements** from **experiments/hypotheses**. A conversion or retention tactic should never become a mandatory engineering rule without evidence.

---

## Master Build Audit — release summary

Use this at the end of each project audit after reviewing the detailed sections above.

| Domain | Status | Evidence / blockers |
|---|---|---|
| Core UX / decision friction | ⬜ | |
| Audience / positioning clarity | ⬜ | |
| Empty-state / first-value activation | ⬜ | |
| System handoff / in-context flow quality | ⬜ | |
| Familiar interaction patterns | ⬜ | |
| Responsive/mobile behavior | ⬜ | |
| Accessibility | ⬜ | |
| Website technical SEO | ⬜ | |
| SEO audit tooling / agent-assisted verification | ⬜ | |
| Domain / DNS / email-deliverability setup | ⬜ | |
| Frontend quality metrics | ⬜ | |
| Performance / Lighthouse | ⬜ | |
| Authentication / authorization | ⬜ | |
| Data integrity / sensitive fields | ⬜ | |
| API / caching / database performance | ⬜ | |
| Infrastructure spend / abuse guardrails | ⬜ | |
| Privacy / retention / deletion | ⬜ | |
| Cancellation / unsubscribe / dark-pattern review | ⬜ | |
| Child/age-related compliance (if applicable) | ⬜ | |
| Reliability / retries / failure handling | ⬜ | |
| Tests / CI / regression coverage | ⬜ | |
| Agent model/provider routing & fallback safety | ⬜ | |
| Release-build verification | ⬜ | |
| App Store / platform compliance | ⬜ | |
| Billing / subscriptions / entitlements | ⬜ | |
| Billing grace / retry / cancellation retention settings | ⬜ | |
| Legal links / policies / support | ⬜ | |
| Analytics / attribution / consent | ⬜ | |
| Growth / store assets / localization | ⬜ | |
| Launch-content / acquisition experiments | ⬜ | |
| Market / storefront prioritization | ⬜ | |
| Monetization experiments | ⬜ | |
| A/B experiment integrity / conversion testing | ⬜ | |
| Production-readiness review | ⬜ | |
| Build-vs-buy / external dependency due diligence | ⬜ | |

### Release decision

```md
Release status: PASS / PASS WITH ACCEPTED RISKS / BLOCKED
Blocking items:
- ...

Accepted risks / deferred work:
- ...

Post-release metrics to watch:
- ...
```

---

## Agent Audit Prompt

Use this with the SOT when handing a project to an auditing agent:

```text
Audit this project against the Ultimate Build Source of Truth.

Do not make code changes yet.

Inspect the repository, configuration, architecture, database/schema,
deployment setup, and runtime behavior where access permits.

For every relevant SOT requirement:

1. Determine whether it applies.
2. Mark it VERIFIED, PARTIAL, MISSING, RUNTIME CHECK, or N/A.
3. Give concrete evidence.
4. Assign severity to deficiencies.
5. Explain the smallest appropriate remediation.

Do not infer implementation simply because the framework or platform supports it.

Do not implement optional features solely to satisfy the checklist.

N/A requires a short reason.
VERIFIED requires evidence.

If runtime verification is required and you cannot perform it, explicitly mark
RUNTIME CHECK rather than guessing.

At the end provide:

- release status
- P0 blockers
- P1 findings
- quick wins
- accepted/N/A items
- runtime checks still needed
- recommended repair order

Do not change anything until the audit is complete.
```

---

## Agent Remediation Prompt

After the audit is reviewed and approved:

```text
Using the approved SOT audit, fix the unresolved findings in this order:

1. P0 release blockers
2. P1 security/privacy/data/payment/reliability issues
3. accessibility and core UX failures
4. performance and production-readiness issues
5. P2 maintainability/quality improvements
6. P3 optional polish

Preserve existing intended product behavior unless the SOT finding explicitly
requires a behavior change.

Do not implement items marked N/A.

Do not implement EXPERIMENT items unless explicitly approved.

After repairs:

- run all applicable checks
- inspect the diff
- rerun the SOT audit
- provide before/after evidence
- list any remaining risks
```

---

## Final Principle

The purpose of this SOT is **not to make every product contain every possible feature**.

The purpose is to prevent teams and coding agents from forgetting entire classes of important work.

A high-quality audit should be able to say:

> This requirement applies, and here is the evidence that we satisfy it.

or:

> This requirement does not apply, and here is why.

or:

> This requirement applies and we currently fail it.

**Build deliberately. Verify what matters. Measure experiments. Ship only what you can defend.**

