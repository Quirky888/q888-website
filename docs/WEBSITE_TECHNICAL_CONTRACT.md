# Q888 website technical contract

This owns current website requirements. Read the sections relevant to the task;
agent workflow and rule ownership live in `AGENTS.md`. Requirements describe
intended behaviour, not a claim that every existing implementation passes.

## Architecture

- Preserve the static Astro + TypeScript architecture and established component,
  content-collection, styling, and browser-script conventions. Netlify Functions
  provide the optional chatbots. No database or Docker is needed.
- Prefer existing utilities and native browser APIs to new dependencies. Keep
  internal names, state transitions, and error handling understandable.
- Reuse content collections, `src/lib/siteIdentity.ts`, and the indexing checker
  where relevant before introducing another metadata or routing system.
- Preserve stable selectors and avoid brittle DOM assumptions. Do not add debug
  UI, production console logs, or temporary markers unless requested.
- Internal governance stays in repository documentation. `/constitution/` is an
  artwork route, not the home of these rules. Governance must not be copied into
  public pages or `src/content/knowledge/`.

## Protected systems

- Preserve the landing design, hero hierarchy, global typography, fonts,
  navigation paradigm, and shared background behaviour unless the current task
  explicitly authorises changing the affected system.
- `src/styles/tokens.css` is protected; modify it only when explicitly authorised.
- Preserve the purpose and behaviour of `thresholdMotion.ts`, `drawerNav.ts`,
  `edinburghMap.ts`, and `navScroll.ts`. Do not replace, strip, or refactor them
  merely to minimise JavaScript. Requested repairs to those systems may change
  the relevant logic while preserving unrelated behaviour.
- Preserve `Layout.astro` structure unless a requested change requires modifying
  it; prefer a small supporting change over a structural rewrite.
- A request already authorising a protected change does not need another approval
  solely because that system is protected. Other changes remain outside scope.

## Website defaults

These describe the shared surface. A named project overlay or an explicit task
may replace them within its scope, while engineering requirements remain active.

- Landing: near-white fog, subtle grain, primary sans typography, and monospace
  metadata. Use generous whitespace, soft thin borders, and existing tokens.
- Preserve the Q888 / Projects / Infocigan / Contact toolbar, persistent top and
  bottom SystemMeta styling, and directional reveals where already used.
  Section metadata may change; its default animation is a subtle crossfade.
- Prefer quiet, specific human language. Contact prioritises practical clarity;
  Infocigan may use dry humour and mythic language. Artistic projects may carry
  stronger expression through their overlay.
- Infocigan defaults to a portal of artifacts with contact-first participation.
  Do not add a cart, checkout, filters, or another commerce flow unless requested.
  Clear prices, purchase information, invitations, and honest financial ambition
  are legitimate. Avoid deceptive urgency, manipulation, and unsupported promises
  of future value or guaranteed returns.
- Shared motion is restrained: opacity settling, occasional metadata flicker,
  or slow drift. Avoid attention-demanding loops, bouncy transitions, and loud
  parallax by default. Never introduce scroll-jacking.
- Reuse CSS variables from `tokens.css` and `global.css` for shared colours,
  spacing, and typography. Prefer mobile-first CSS and logical properties;
  avoid inline styles unless necessary. Group related styles coherently.

### Overpriced Stickers background permission

`OverpricedStickersSection.astro` may use fog-family transparency, glass effects,
faint grid overlays, and edge-to-edge presentation. Match the Infocigan
`--bg-fog` family; cards may inherit the parent fog, and the ticker uses fog-glass
with blur. This permission is local to the component. It does not authorise
changes to shared tokens, landing backgrounds, or global navigation, and does
not waive the container and scrollbar requirements below.

## Routing and indexing

- The homepage remains a continuous scroll:
  `#landing → #projects → #infocigan → #contact`.
- A newly created main page, section, or core artistic product receives a short,
  dedicated top-level route in `src/pages/`. Existing drawers can supplement
  these routes. Small supporting UI does not automatically require a new page.
- Do not introduce a client-side router or redesign navigation to add a route.
- Creating, renaming, or materially updating a public page requires aligned
  canonical URLs, `index,follow` robots directives, internal links, and entries
  in `src/pages/sitemap.xml.ts`.
- Intentional redirects and `noindex` pages stay out of the sitemap. Preserve
  declared project exceptions such as `/ai/`; a dedicated route need not be
  indexed when its approved purpose requires otherwise.
- `scripts/checkIndexing.mjs` validates built output as part of `npm run build`.
  Do not assume correct source metadata proves correct generated output.

## Responsiveness

The UI must remain consistent across monitor sizes and browser zoom, including
systems with non-overlay scrollbars.

1. Use one container contract per section: full-width outer section, centred
   max-width inner container, and consistent horizontal padding. Avoid competing
   container systems within a section unless explicitly requested.
2. Inside drawers, portals, or scrolling containers, avoid viewport breakout
   maths such as `width: 100vw`, `left: 50%`, and `margin-left: -50vw`.
   Compute full bleed from container padding instead.
3. Scroll lock must compensate for scrollbar width and restore prior inline
   styles exactly. Add compensation to existing body padding rather than
   replacing that padding. Opening and closing an overlay must not nudge the
   layout horizontally.
4. Align text and media with a shared grid rhythm, consistent breakpoints,
   maximum widths, column spans, and gaps. Paired media share a grid parent.
5. Use normal-flow grid or flex for primary alignment. Absolute positioning is
   for effects and overlays, not alignment-critical content.

The Overpriced background permission does not permit fragile viewport maths
inside scrolling containers.

## Accessibility

- Design mobile-first at 375px portrait. Avoid fixed widths above 360px without
  a max-width and centred wrapper. Body text is at least 16px; headings should
  scale fluidly. Interactive touch targets are at least 44 × 44px.
- Preserve semantic text, keyboard operation, visible focus, usable exits, and
  accessibility of practical information even when the surface is mythic.
- Respect `prefers-reduced-motion`: navigation becomes instant and disabled
  animations leave no residual transforms. Preserve visitor agency and privacy.

## Performance

- Minimise unnecessary JavaScript while preserving intentional interactions.
  Avoid heavy libraries when a native API meets the need.
- Lazy-load images below the fold. Give hero images `fetchpriority="high"`.
- Use `Image` from `astro:assets` for new image elements. Do not convert existing
  `img` elements merely as an incidental refactor.
- Optimise large images locally before committing; do not rely on build-time
  processing to rescue oversized assets.

## Chatbots

- Local function testing uses `npm run dev:netlify` with `OPENAI_API_KEY` in
  `.env`; `npm run dev` alone serves Astro without Netlify Functions.
- Keep secrets out of source, logs, and Digital DNA. Consult `.env.example`
  for required variable names without exposing local secret values.
- Public chatbot knowledge lives in `src/content/knowledge/`. Follow its existing
  JSON-frontmatter format and validation. `scripts/buildChatKnowledge.mjs`
  builds the server context; never edit generated context as its source.
- Internal agent governance and historical instructions are not chatbot content.

## Validation

- Run `npm run build` as primary repository validation. It builds knowledge,
  runs `astro check`, builds production output, and checks indexing.
- Add targeted behaviour checks when required by the change. A build alone
  cannot prove interaction, function, accessibility, or layout correctness.
- Preserve the existing verification requirement for **every PR**:
  - all nine desktop combinations: widths approximately 1280, 1440, and 1728px,
    each at 80%, 100%, and 125% browser zoom;
  - mobile portrait widths approximately 375 and 430px;
  - no horizontal scroll, aligned text and image edges, and no overlay
    open/close width shift.
- After a layout change, also test the four homepage anchor links on mobile.
- Report missing tools, failed checks, and untested combinations explicitly.
  Do not silently reduce this matrix or claim viewport checks from a build.
  Changing its scope requires an explicit user decision.

## Git and deployment

- `jan25-stable` is the production branch deployed by Netlify. Never commit or
  push directly to it or force-push it. Do not use legacy `main` as the base.
- For new branch work, start from `jan25-stable` with a `codex/` branch unless
  the user specifies otherwise. Continue an existing suitable task branch when
  applicable; preserve uncommitted work and do not reset it to change bases.
- Use conventional commits and batch related small edits into meaningful
  commits. `[skip ci]` is for documentation-only commits when appropriate;
  configuration changes can affect behaviour and require relevant checks.
- A merge/push to production triggers deployment. Identify that effect before
  publication, establish a recovery path, and obtain approval when it has not
  already been given. Existing authorisation remains valid within its scope.
- Keep destructive, financial, secret-exposing, or difficult-to-reverse actions
  within explicit authorisation, platform permissions, and a recovery path.
