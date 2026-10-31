---
name: rentph-ui-ux
description: "Use when researching, auditing, planning, designing, implementing, or validating RentPH UI/UX, responsive layouts, listing cards, property details, rental search, navigation, accessibility, or distinctive premium/minimal presentation on the website and Capacitor Android app."
---

# RentPH UI/UX

## Purpose and scope

Improve rental discovery and decision-making for both students and general renters.
The approved direction is distinctive/premium plus minimal/professional, not
luxury-only or visually busy. Keep React/Vite, Tailwind, existing components, and
the Capacitor Android wrapper unless a migration is separately requested.

Read the [research and workflow plan](../../../docs/ui-ux-workflow-plan.md) for
baseline findings, phased work, source links, and acceptance criteria. Revalidate
the current code/runtime: the plan records an audit, not an always-current spec.
Use this skill on demand; it does not mandate a redesign for unrelated tasks.

## Workflow

### 1. Establish the task

- Distinguish research/planning, prototype, and implementation requests. A plan
  request does not authorize UI changes.
- Identify the renter's task and relevant surfaces: Explore/results, Saved,
  map/split list, details, authentication, application/contact, web and Android.
- For a broad redesign, confirm the direction and approve a small mobile/desktop
  prototype before changing every screen. Avoid unnecessary preference questions
  for a bounded request already covered by the approved direction.

### 2. Inspect and record evidence

- Inspect the relevant components and existing shared patterns before editing.
  Preserve unrelated worktree changes.
- Check the browser and, when in scope, the installed Android app. Record viewport,
  rendered sizes, navigation, content hierarchy, states, and reproducible friction.
- Separate code evidence, observed runtime behavior, hypotheses, and user feedback.
  Do not invent user research, accessibility conformance, or performance scores.
- Verify feature/data readiness. Seeded/local storage, demo payments, and mocked
  messages are not evidence of live services, accurate availability, or verification.
- For external research, use public authoritative sources. Never upload private
  source code, screenshots containing personal data, or credentials to third parties.

### 3. Design around the renter's decision

- Order the journey: discover -> narrow results -> shortlist -> understand
  costs/conditions -> contact/apply. Support return to the previous search.
- Keep cards minimal: photo, title, city, honest rating/New, rent and meaningful
  price basis. Save/compare must remain independent of opening the card.
- Put full address, gallery, description, amenities, occupancy restrictions,
  availability, rules, deposit/fees, and next steps in the detail experience.
  Critical costs and restrictions must be discoverable before commitment.
- Use neutral rental language; offer campus-specific tools without excluding
  other renters or forcing a student/general selection.
- Keep primary navigation compact and familiar. Place secondary compare,
  host/admin, and demo controls appropriately; preserve actual role permissions.
- Disclose advanced search options on demand. Preserve active filters, sort,
  selected listing, and intended scroll position across view changes.
- Prefer supported actions over ambitious-looking placeholders. Show explicit
  unsupported/error states rather than success-shaped fallbacks.

### 4. Apply the visual system

- Reuse the RentPH wordmark, existing sans/serif families, slate neutrals, amber
  accent, restrained emerald status color, rounded surfaces, and image-led cards.
- Use a short expressive headline, readable body text, consistent spacing, and
  one strong primary action. Distinctiveness should come from brand, relevant
  photography, and composition, not visual noise.
- Prefer semantic tokens in existing CSS over a new framework or component library.
- Avoid dense badge stacks, fake scarcity, fabricated reviews, unsupported verified
  badges, countdowns, autoplay, and decorative motion that delays browsing.
- Treat all proposed copy, tokens, and layouts as testable design decisions,
  not proven conversion improvements.

### 5. Implement in bounded slices, only when authorized

- Start with shared foundations and highest-impact task friction; reuse helpers
  and components across Explore, Saved, and split views.
- Preserve existing search, filters, sorting, map selection, save/compare,
  authentication, application, and contact behavior.
- Handle loading, empty, offline, validation, error, focus, pressed, and disabled
  states. Do not add broad catches or silent fallback data.
- Keep type safety. Do not add dependencies, analytics vendors, routing frameworks,
  or backend features merely for a visual refresh.
- Update directly related documentation. Summarize intentional behavior changes.

### 6. Validate the exact outcome

- Check 360, 390, 768, and 1440 CSS px widths plus the actual target device.
  Include enlarged text and reflow; do not shrink fonts to hide layout problems.
- Standalone touch targets should be at least 44 x 44 CSS px, without overlapping.
  This is RentPH's product target; WCAG 2.2 AA's 24px minimum includes exceptions.
- Check text contrast: 4.5:1 normal, 3:1 qualifying large text. Test actual colors.
  Include visible focus, logical keyboard order, dialog focus/return, labelled
  controls, non-color status cues, TalkBack, and reduced-motion behavior.
- Verify card opening, independent save/compare, correct details, full gallery,
  cost/rule comprehension, retained search state, and browser/Android Back.
- Ensure mobile actions and navigation respect safe areas, system bars, keyboards,
  and focused elements; never cover content or errors.
- Measure performance before optimizing. Field targets at p75: LCP <=2.5s,
  INP <=200ms, CLS <=0.1. Lab results are not field results; validate WebView separately.
- Run the existing `npm run lint` and `npm run build` for code changes.
  For Android delivery, follow the project's Android build/install workflow and
  verify the installed app, not only the localhost website.
- Use existing test tooling; add tooling only when the task requires it. Report
  failures, untested areas, and unresolved assumptions honestly.

## Expected output

For research/plans: evidence, prioritized friction, proposed information hierarchy
and visual direction, bounded phases, dependencies, approval gates, source links,
and measurable checks. Do not change application UI in a planning-only request.

For implementation: complete the authorized slice, validate behavior on relevant
surfaces, and report changes, checks, and remaining limitations. Do not claim that
an attractive screenshot proves usability, accessibility, or increased engagement.
