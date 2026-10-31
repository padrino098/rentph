# RentPH UI/UX Improvement Workflow

Status: research and proposed plan; no redesign implemented by this document.
Reviewed: 2026-10-21.

## 1. Product direction

The requested direction combines distinctive/premium presentation with minimal,
professional usability. Serve students and general renters equally on the website
and Capacitor Android app. Keep the existing React/Vite stack.

The design principle is **calm discovery, confident decisions**: attract attention
with relevant property photography and a clear value proposition, then help people
find a suitable rental without visual clutter. Treat "rarity" as a distinctive
brand, not artificial scarcity, luxury-only positioning, or collectible-style tiers.

Keep listing cards concise. Opening a listing must reveal the full decision-making
information. Do not simplify by hiding rent units, mandatory costs, restrictions,
or unavailable features.

Suggested headline to prototype: "Find a place that fits your life."
Supporting copy: "Explore apartments, rooms, and student homes across the Philippines."
These are proposals to test, not approved production copy.

## 2. Evidence from the current product

The audit combines source inspection and a local browser check. It is not a formal
accessibility audit, competitor benchmark, user study, or performance assessment.
Coordinates below are CSS pixels from one local browser session and can vary with
fonts, content, device, and viewport.

| Priority | Finding | Evidence | Proposed response |
| --- | --- | --- | --- |
| P0 | The two intended audiences receive inconsistent positioning. | Student-first hero in [HeroSearch](../src/components/guest/HeroSearch.tsx); vacation/luxury language in [Footer](../src/components/common/Footer.tsx); travel language in [FavoritesView](../src/components/guest/FavoritesView.tsx). | Use a neutral rental identity. Make student-specific tools optional and easy to find. |
| P0 | Navigation competes with browsing and hides destinations horizontally. | Mobile navigation measured 384px visible / 561px content at a requested 390px viewport; role/demo destinations appear in [Navbar](../src/components/common/Navbar.tsx). | Prototype four primary destinations that fit without horizontal scrolling. Move secondary and role-specific tools to More/Profile. |
| P0 | Discovery begins too far down the mobile landing page. | At 390 x 844, the first card began around y=953 in the local check. [HeroSearch](../src/components/guest/HeroSearch.tsx) combines an intro, matcher, four fields, and campus shortcuts. | Shorten the mobile hero, prioritize place/budget/search, disclose advanced filters on demand. |
| P0 | Card controls are small for touch. | Save and compare in [PropertyCard](../src/components/guest/PropertyCard.tsx) measured 26 x 26px on mobile and desktop. | Adopt at least 44 x 44 CSS px targets for standalone actions, without overlapping adjacent targets. |
| P0 | Trust signals need accurate states before visual amplification. | [PropertyDetailView](../src/components/guest/PropertyDetailView.tsx) falls back to 5.0 for missing ratings; [store](../src/services/store.ts) is seeded/local-first. | Show "New" for missing ratings; distinguish sample, host-provided, and genuinely verified information. |
| P1 | Detail actions are far down the mobile page. | The application button began around y=1692 at 390 x 844 for the first apartment. The action panel follows the main content in [PropertyDetailView](../src/components/guest/PropertyDetailView.tsx). | Prototype a compact, safe-area-aware mobile action bar and an early rental-cost summary. |
| P1 | Mobile users have weak access to additional photos. | Secondary gallery grid is hidden below the medium breakpoint in [PropertyDetailView](../src/components/guest/PropertyDetailView.tsx). | Provide an accessible photo count and gallery/carousel with explicit controls, not swipe-only interaction. |
| P1 | Returning to search may lose context. | View changes are centralized state in [App](../src/App.tsx), rather than a demonstrated URL/history contract. | Test and specify browser/Android Back, filter retention, result position, and deep-link behavior before implementation. |
| P2 | Map presentation needs mobile-specific validation. | [InteractiveMapSearch](../src/components/guest/InteractiveMapSearch.tsx) uses a fixed 620px map height. | List-first mobile browsing, explicit map mode, useful height, equivalent list access, and gesture testing. |

Preserve what already works: image-led minimal cards, separate save/compare actions,
full detail sections, filter capabilities, saved listings, and map/list selection.
Existing Plus Jakarta Sans/Playfair typography, slate surfaces, amber accents, and
rounded shapes provide a foundation; a complete visual rebrand is unnecessary.

## 3. Research translated into product decisions

1. **Progressive disclosure:** put the frequent decisions first and advanced ones
   behind obvious controls. Apply it to search options and listing cards, not to
   mandatory costs or critical tenancy conditions. [NN/g guidance][disclosure]
2. **Recognition over recall:** use familiar labels, persistent active-filter
   summaries, and stable navigation. Users should not need to remember which
   listing they opened or reconstruct their search. [NN/g guidance][recognition]
3. **Touch accessibility:** WCAG 2.2 AA target-size minimum is 24 x 24 CSS px,
   with exceptions including spacing. RentPH's proposed 44 x 44 target is a
   stronger product standard, also reflected in the enhanced AAA criterion.
   A 26px control is not automatically an AA violation. [Minimum][target-min],
   [enhanced][target-enhanced]
4. **Readable contrast:** target at least 4.5:1 for normal text and 3:1 for
   qualifying large text; test actual foreground/background combinations.
   Muted styling must not make prices, location, or rules hard to read.
   [WCAG contrast guidance][contrast]
5. **Fast and stable presentation:** target field p75 LCP <=2.5s, INP <=200ms,
   and CLS <=0.1, segmented by mobile and desktop. These are targets, not
   current measured results. A local Lighthouse run cannot certify field p75.
   Assess Android WebView performance separately. [web.dev thresholds][vitals]

These sources support the principles, not a guaranteed engagement or conversion
increase for RentPH. Layout proposals still need validation with actual renters.

## 4. Proposed user journey and screen hierarchy

### Primary journey

Explore -> Search/filter -> Results -> Listing details -> Contact/apply
                                      |
                                      +-> Save -> Compare -> Reopen details

Allow browsing before authentication. Preserve the listing and entered work if
authentication becomes necessary for a supported action.

### Website

- Header: RentPH, Explore, Saved, Applications, account. Keep hosting/admin
  destinations role-appropriate; demo persona tools belong outside production UI.
- Compact hero: one headline, one supporting sentence, location and budget search.
- Optional "Near a campus" entry and advanced filters, without forcing an audience
  selection before users can browse.
- Results: count, sort, active filters, list/map toggle, consistent image-led grid.
- Details: gallery, title/location, price basis and costs, availability/conditions,
  description, amenities, rooms/beds when relevant, landlord, contact/application.

### Android and mobile web

- Prototype a four-item navigation bar: Explore, Saved, Applications, Profile.
  Check placement and browser behavior on both surfaces; do not assume native
  navigation or a new framework is required.
- Keep compare available from cards/detail and through Saved/More, not as a
  permanently competing fifth primary destination.
- Use a short hero/search area and bring the start of real results into the
  first 844px-high viewport at 390px width with ordinary default content.
- Keep two-column cards where readable; switch to one column for narrow widths
  or enlarged text rather than shrinking type to preserve density.
- Detail action bar: price with its basis and one primary supported action.
  Reserve room for navigation, keyboard, Android system bars, and safe areas;
  never cover content, focus, or form errors.

### Card versus detail information

| Card: quick shortlist | Detail: informed decision |
| --- | --- |
| Cover photo and property name | Full gallery, description, property type |
| City | Exact address and approximate/route distance with method explained |
| Honest rating or "New" | Rating source and review count, when supported |
| Rent and price basis | Per-bed/per-room/per-unit basis, deposit, mandatory fees, estimated utilities |
| Save, optional compare | Availability, gender/occupancy restrictions, rules, amenities, room/bed matrix |
| Entire main card area opens details | Landlord/contact, application requirements and next steps |

Retain the minimal-card work already completed. Add a compact price-basis qualifier
only where required for an honest comparison. Do not restore dense metadata rows.

## 5. Distinctive but restrained visual system

- Retain the RentPH wordmark and amber accent; use deep slate for readable text,
  warm/light neutral surfaces, and emerald only for meaningful status.
- Use the existing serif sparingly for a short headline; use the existing sans
  family for controls, prices, and reading. Avoid giant mobile display text.
- Proposed sizes: 16px body/form controls, 14px secondary content, 12px minimum
  routine metadata. These are design targets, not WCAG font-size requirements.
- Use a small 4/8px spacing scale, consistent 12-16px radii, thin borders, and
  restrained shadows. Define semantic tokens in [index.css](../src/index.css)
  rather than introducing another styling framework.
- Give cards stable image proportions and two-line names. Use accurate photos
  for real listings; clearly identify sample imagery/data in demo contexts.
- Use one strong primary action per section. Avoid badge stacks, excessive pills,
  gradients, autoplay, countdowns, and unsupported "verified" or "only one left."
- Keep motion brief and purposeful; respect reduced-motion preferences.
- Include focus, pressed, disabled, loading, error, empty, and offline states,
  not just a polished success screen.

## 6. Execution workflow and approval gates

Phases are sequential except that performance baselining can run during prototypes.
Do not begin a broad redesign without approval of the screen direction.

| Phase | Work and deliverables | Exit gate |
| --- | --- | --- |
| 0. Baseline | Capture representative web/mobile/native screens; inventory content and real versus demo capabilities; record search/detail/save/application tasks. | Evidence and constraints recorded; no invented metrics or capabilities. |
| 1. Architecture and copy | Prototype inclusive hero/search, four-item mobile navigation, neutral saved-listing language, secondary compare placement, and reliable Back behavior. | User approves mobile and desktop wireframes and navigation. |
| 2. Visual prototype | Apply existing-brand tokens to Explore/results, one apartment detail, one dorm detail, and Saved; include loading/error states. | User approves both viewport directions, typography, and card/detail information split. |
| 3. Discovery implementation | Update shared navigation/search/results surfaces and touch targets; retain filters, sorting, favorites, compare, map, and role permissions. | Search/filter/state-retention regression checks pass on web and Android. |
| 4. Detail and decision implementation | Improve gallery, accurate costs/status, mobile CTA, landlord/contact and application handoff; handle unsupported actions honestly. | Real photos or labelled samples; truthful ratings; supported actions work; detail information remains accessible. |
| 5. Accessibility and performance | Keyboard/TalkBack, contrast/reflow, safe areas, modal focus, image sizing/loading, bundle/map loading where measured. | Acceptance checks below pass; unresolved issues are documented, not silently bypassed. |
| 6. Usability and iteration | Test with students and general renters, compare against baseline, fix observed blockers; stage rollout when production exists. | Approve based on task success and clarity, not aesthetic preference or clicks alone. |

Suggested first implementation slice: Phase 1 plus larger standalone action
targets and truthful rating labels. Avoid rewriting the whole application at once.

## 7. Validation and measurable acceptance

### Functional and presentation checks

- Check 360, 390, 768, and 1440px viewports plus the actual Android emulator/device.
  Include 200% text zoom and reflow around 320 CSS px.
- Primary navigation requires no horizontal scrolling; the page has no unintended
  horizontal overflow. Optional category strips may scroll if clearly discoverable.
- At 390 x 844, target the first result starting within the initial viewport;
  validate readable content rather than reducing text sizes to hit a coordinate.
- Standalone controls meet the 44 x 44 CSS px project target; icons may remain
  smaller. Verify spacing and prevent expanded hit areas from overlapping.
- Card selection opens the right detail; save/compare never trigger navigation.
  Check Explore, Saved, split list, and map selection consistently.
- Back returns to the prior results and preserves filters, sort, and intended
  scroll position. Test browser Back and Android system Back explicitly.
- Every photo is reachable on mobile with labelled controls; gallery/modals can
  close by keyboard/system navigation, restoring focus to the trigger.
- Monthly costs and deposits remain discoverable; estimates and missing values
  are labelled. Never invent ratings, reviews, verification, or availability.
- Sticky actions do not obscure content, focused controls, errors, or the keyboard.
- Keyboard, visible focus, TalkBack labels, status announcements, contrast, and
  reduced-motion checks pass. Do not claim WCAG conformance from this checklist.
- Run `npm run lint` and `npm run build` after code changes. Build/install through
  the [Android workflow](./android-app.md) and verify the native app, not just Chrome.
- If tooling fails, report the limitation explicitly; do not substitute a
  screenshot for a functional check.

### Small formative study

Recruit an initial 6-8 willing participants across both audience groups; this is
qualitative problem discovery, not statistically reliable conversion evidence.
Ask each participant to:

1. Find a suitable listing in their area/budget; students may choose a campus.
2. Save two listings and compare their relevant differences.
3. Open a listing and explain rent basis, deposit, estimated utilities, and rules.
4. Find all photos and the appropriate contact/application action.
5. Return to their previous results without reconstructing the search.

Record completion without assistance, time on task, mis-taps, confusing labels,
cost comprehension, and a short confidence rating. Proposed formative gate:
at least 80% complete the core search-to-detail task unassisted, with zero
unresolved critical misunderstandings about payment or rental costs. Fix blockers
and retest; a small sample does not establish production success rates.

### Production measurement, only when supported

With privacy-aware, consent-appropriate analytics, measure search-to-detail rate,
saved-listing reuse, qualified inquiries/applications, task abandonment, and field
performance separately for mobile/desktop and each renter journey. Establish
baselines before setting uplift goals. Exclude demo/test activity; do not send
addresses, messages, application contents, tokens, or personal data in event payloads.
Do not implement new third-party tracking as part of a visual refresh.

## 8. Dependencies and limits

Listings, booking/payment, messaging, and rental lifecycle APIs are not established
as production-ready by this audit. Frontend polish cannot make seeded data or
simulated actions real. Verify current capabilities before implementing any flow.
Avoid new verification badges, scheduling, live chat, or personalized recommendations
unless their data and services exist and their scope is separately approved.

The reusable [RentPH UI/UX skill](../.github/skills/rentph-ui-ux/SKILL.md) packages
this workflow for future design work. It is a project-authored skill, not a
downloaded or externally certified design package.

## Sources

Sources consulted directly during this review. Recommendations above adapt their
principles to RentPH; they do not reproduce another marketplace's design.

[disclosure]: https://www.nngroup.com/articles/progressive-disclosure/
[recognition]: https://www.nngroup.com/articles/recognition-and-recall/
[target-min]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
[target-enhanced]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
[contrast]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
[vitals]: https://web.dev/articles/defining-core-web-vitals-thresholds
