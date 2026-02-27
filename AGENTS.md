# AGENTS.md

## Cursor Cloud specific instructions

This is a static **Astro** site (Q888 portfolio). No backend services, databases, or Docker are needed.

**Quick reference (see `README.md` and `package.json` for full list):**

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves at `localhost:4321`) |
| Build | `npm run build` (outputs to `./dist/`) |
| Preview build | `npm run preview` |

**Caveats:**

- The project has no dedicated lint script. Use `npm run build` as the primary validation check — it runs Astro's type generation and Vite build.
- `astro check` requires `@astrojs/check` which is not listed as a dependency. Do not run it without installing that package first.
- The `.env.example` file exists but is optional — defaults work fine for local dev. Copy it to `.env` if you need to configure `ALLOWED_HOSTS`.
- Production branch is `jan25-stable`. Never push directly to it. See `.cursorrules` for full git/deploy discipline.
- The site is a single continuous scroll (`#landing → #projects → #infocigan → #contact`) — do not introduce multi-page routing unless explicitly requested.
