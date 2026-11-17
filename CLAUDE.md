## q888.space — context for Claude (from ChatGPT history, 2026-11)

Read `AGENTS.md` first; it holds the site rules. Astro + Tailwind, deployed on Netlify (`netlify.toml`); Cloudflare is used for chatbot interaction. Dev server: `npm run dev` (port 4321 or the next free one).

- Purpose: artist portfolio of Q888 for recruiters, collaborators and the art world — show a creative mind, not a shop.
- Design: calm, system-like futuristic gallery, fog background, strong typography, mono system-meta lines. All sections reuse the Landing page layout contract; don't change design tokens or protected reveal/scroll logic unless asked.
- Key pages: /dink (Digital Ink), /map (Edinburgh Magical Map), /president (President of the Galaxy), /copyright (Overpriced Knight), /overpriced (stickers), /narmail, /qbag, /aero, /bureaucracy (artistic CV), /narrative-reset, /privacy (must match the Digital Ink app), /research.
- Infocigan zone is intentionally unstable, playful "market" with gold/investment vibe; it gets new cards often, so layouts must scale.
- Work style: small diffs, verify on the live site/repo before claiming, short simple-language summary of what changed.
