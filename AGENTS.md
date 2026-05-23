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
- **Kotiki-Nar chatbot:** AI-powered via `netlify/functions/nar-chat.ts`. To test locally, run `npm run dev:netlify` and add `OPENAI_API_KEY` to `.env`. `npm run dev` alone does not run the function.
