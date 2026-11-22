# /dink page — handoff for the next chat

Written 20 November 2026 at the end of the long redesign session. Branch: `aero`.
Read `AGENTS.md` first (site rules), then this file. The user is Alexander (Q888). He writes Russian
and English, often by voice. Answer in the language he uses, briefly, conclusion first. He is an artist,
not a programmer: explain in simple words, show a short plan, and wait for "делай" before changing things.

## What the page is

`/dink/` is the public page of **Digital Ink**, his iPad app and artwork. It was rebuilt from scratch in this
session. Version **3.2**, minimum **iPadOS 26**, **iPad only**, app is **free**; only two optional online features
(AI description, memory reconstruction) cost a few credits because they use paid AI services.
App Store: https://apps.apple.com/us/app/digital-ink/id6757157376

The page goes live together with the 3.2 App Store release, so everything shown (including Ink transfer
between iPads) is meant to be true by then. Do not add claims the app does not make.

## Files

| File | Role |
|---|---|
| `src/components/DigitalInkPage.astro` | The whole page: markup, CSS, one script block (about 2,300 lines, long but organised by sections) |
| `src/components/InkClip.astro` | One looping muted screen recording with a small Play/Pause button |
| `src/components/InkMarquee.astro` | A band of huge type that slides sideways while scrolling |
| `src/pages/dink.astro` | Route, SEO, structured data (`displayFonts` loads Bricolage Grotesque + Instrument Serif like the landing) |
| `public/videos/dink/` | `transformation`, `ink-bio-a`, `draw-mushroom` (each .mp4, .webm, `-poster.webp`) |
| `public/images/dink/` | `gallery.webp`, `reconstructed-memory.webp`, `emotional-palette.webp` |
| Claude doc "Digital Ink page — copy and layout v1" | Interview-based copy. **Out of date** vs the page structure (see below), the page is the source of truth now |

Original recordings and screenshots are in `~/Downloads/Dink Project files` and `~/Downloads/Digital ink `.
`ffmpeg` is installed (Homebrew). `sharp` is in the project for image work.

## Structure, top to bottom

1. **Hero (light fog, grey).** Canvas field of squares that come and go, draws a tiny mushroom/flower pixel by
   pixel and erases it (HUD "Ink in home 587 / Drawn n" counts spend and return). Giant headline
   "Every pixel has a past." with `mix-blend-mode: difference`. Click/hover affects the field.
2. **Light zone** (warm grey `--paper`): statement that fills with ink word by word on scroll; chapter
   01 Beginning (cropped transformation loop); "Where an Ink lives" typographic band that slides sideways.
3. **Slow pixel dissolve into dusk** (`data-ink-dissolve="in"`), about 1.5 screens of scrolling.
4. **Dusk zone** (the app's colours): 02 Memory, marquee, 03 Canvas, 04 Connections (type + two squares and a
   line, no media), 05 School (type only, the word "glow" glows), 06 Gallery, About. Screens sit on cream mats.
5. **Dissolve back to light**, then the **finale** in landing style: "Digital Ink for iPad", App Store button,
   privacy text, "Under the hood" (collapsed), 116-Pixel Archive note (future project, no link exists), footer.

Every headline has a highlighted word (`<mark class="ink-chip">`); paragraphs are behind "Read the story"
(`<details class="ink-more">`).

## Decisions the user made (do not undo)

- Style: soft Dusk (plum/amber, serif italics) with big contrasty type, like the reference
  booleanSequence.niceunderground.xyz in spirit only. **Never copy its code or text.**
- Only `/dink` changes; landing and shared tokens stay untouched. No Lenis; GSAP is not used (own small code).
- **Each screenshot/clip appears exactly once.** Connections and School have no media. No "education level"
  squares. All clips autoplay muted and loop (~10 s). Transformation clip is cropped to the tile row.
- Light until Memory, dusk from Memory, light finale. The user disliked the early rainbow field, the early
  gradient transition and many small repeated pictures.
- Tone: confident, do not over-explain the artist. The "more time building than drawing" line is NOT public.
- Year at Chateau Chapiteau: summer 2025 (CV says 2023-2024, he said the CV is fine).
- 116-Pixel Archive stays at the very end as a small note; no link (none exists on the site).
- Privacy text is a draft that must match the app; he will check `/privacy` when uploading the version.

## Technical rules and traps already met

- Contract: `docs/WEBSITE_TECHNICAL_CONTRACT.md` (protected systems, accessibility, mobile-first at 375 px,
  text at least 16 px, touch targets at least 44 px, no scroll-jacking). `npm run build` is the main check.
- **Content must be visible without JS and with reduced motion.** Hiding only happens behind `html.ink-js`.
  Reduced motion: no field animation, no letter reveal, clips wait for Play, dissolve is instant.
- Scroll effects run through one scheduler (`createScheduler`) that reads first, writes second and eases values.
  Transforms are written directly on the moving element. **Do not** drive big containers with CSS variables
  per scroll frame (that restyles whole chapters and made the page jerky). Avoid full-page `mix-blend-mode`
  and `backdrop-filter` on many elements (removed on purpose; blend remains only on the hero headline/HUD).
- Reveal uses the CSS `translate` property so it can coexist with parallax `transform`.
- The cursor companion (soft square) is cream with a dark ring, no blend, fine pointers only.
- In the in-app preview pane, animations and `requestAnimationFrame` are throttled when the pane is not active,
  so first screenshots can look unfinished. Hover or scroll first, then screenshot. fps could not be measured there.
- Astro scoped CSS: use `:global()` for classes added by JS, and `:where()` for resets so they do not beat classes.
- Cross-component styling: classes used inside `InkClip` (e.g. `.ink-frame`) are styled with `.ink-page :global()`.

## Not verified yet (do these first)

1. Smoothness on a real device: the user said scrolling felt "angular" (jerky parallax). The last change
   (shared scheduler, easing, no blend/backdrop-filter on fixed elements) is built but **not yet judged by him**.
2. `prefers-reduced-motion: reduce` in a real browser.
3. Safari on iPad/iPhone/Mac (the page uses `color-mix`, `translate`, `text-wrap: balance`, `details`, `dialog`).
4. Keyboard use, focus order and screen reader pass on the whole page.
5. A fresh-eyes audit by a separate reviewer (design, accessibility, speed) was offered but not run.

## Likely small fixes still open

- Memory: bio clip is readable but still small text inside the app UI; consider an even bigger frame.
- The hero first moments depend on timing of font loading; check a slow connection.
- The Claude doc should be refreshed to match the page, or retired.
- `Read the story` text for About still contains "I am not sure who else needs it"; the user may want it softer.
- After the App Store release: replace nothing is required, but check the privacy text and that Ink transfer
  is really live.

## State of git

Changes are **not committed**: new `InkMarquee.astro`, rewritten `DigitalInkPage.astro` and `InkClip.astro`,
re-cut videos, re-cropped `gallery.webp`, many unused media files deleted (originals remain in Downloads).
`InkPixels.astro` was deleted. The user commits himself (or says "commit"). Last verified: `npm run build`,
0 errors, indexing and CV checks pass.

## Paste-ready prompt for the new chat

> Работаем над страницей /dink в репозитории q888-website, ветка `aero`. Сначала прочитай `AGENTS.md` и
> `docs/_handoff/DINK_PAGE_HANDOFF.md`, потом посмотри `src/components/DigitalInkPage.astro`. Мы исправляем
> небольшие ошибки, ничего не переделываем заново. Перед каждым изменением коротко скажи, что собираешься
> сделать, и жди моего «делай». Начни с проверки плавности прокрутки (параллакс раньше шёл рывками),
> потом режим «уменьшить движение» и Safari. Отвечай по-русски, просто и коротко.
