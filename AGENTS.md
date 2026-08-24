# AGENTS.md

## Cursor Cloud specific instructions

This is a static **Astro** site (Q888 portfolio). No backend services, databases, or Docker are needed.

**Quick reference (see `README.md` and `package.json` for full list):**

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves at `localhost:4321`) |
| Dev with Kotiki-Nar AI | `npm run dev:netlify` (runs Astro + Netlify Functions; requires `OPENAI_API_KEY` in `.env`) |
| Build | `npm run build` (outputs to `./dist/`) |
| Preview build | `npm run preview` |

**Caveats:**

- **Validation & Build:** Use `npm run build` as the primary validation check. This single command executes both Astro's type checker (`astro check`) and the Vite production build. Do not attempt to install `@astrojs/check` manually; it is already configured in `devDependencies`.
- Production branch is `jan25-stable`. Never push directly to it. See `.cursorrules` for full git/deploy discipline.
- The site main sections are on a single continuous scroll (`#landing → #projects → #infocigan → #contact`). However, primary Infocigan entities (like /overpriced, /qbag, /narmail, /afterlife, /president) are assigned dedicated top-level URLs in `src/pages/`. Any newly created main page, section, or core product must be assigned its own dedicated, short top-level URL route in `src/pages/`.
- **Indexing contract:** When creating, renaming, or materially updating a public page, keep its canonical URL, `index,follow` robots directive, internal links, and `src/pages/sitemap.xml.ts` entry aligned. `npm run build` runs `scripts/checkIndexing.mjs` and must pass; intentional redirects and `noindex` pages stay out of the sitemap.
- **Kotiki-Nar chatbot:** AI-powered via `netlify/functions/nar-chat.ts`. To test locally, run `npm run dev:netlify` and add `OPENAI_API_KEY` to `.env`. `npm run dev` alone does not run the function.


<!-- Q888_DIGITAL_DNA_START -->

# Q888 Agent Entry Point

Before meaningful work, read:

1. `digital-dna/core.md`
2. `digital-dna/expression-lenses.md`
3. `digital-dna/profile.json`
4. any relevant file in `digital-dna/projects/`
5. the project’s own technical documentation and existing source code

## Two independent controls

Always distinguish:

- **WORKING_MODE** — how the task is performed;
- **EXPRESSION_LENS** — how visibly Q888 appears in the result.

Do not use a restrained technical process as an excuse to suppress an explicitly artistic surface.

Default values:

```text
WORKING_MODE: LEARN
EXPRESSION_LENS: HUMAN_CODE
```

## Canonical rules

- Build functional, readable, testable, and reversible software.
- Preserve intentional strangeness; clarify accidental confusion; reduce genuine risk.
- Keep internal code names understandable even when the visible experience is mythic.
- Give concise, reviewable rationale rather than claiming to reveal hidden chain-of-thought.
- Never silently modify the canonical Digital DNA.
- Before destructive, publishing, financial, secret-exposing, or difficult-to-reverse actions, establish a recovery path and request approval when appropriate.
- After concrete human feedback, an observation may be added to `digital-dna/feedback-log.md`.

<!-- Q888_DIGITAL_DNA_END -->
