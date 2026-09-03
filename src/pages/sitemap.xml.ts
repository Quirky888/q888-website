import { getCollection } from "astro:content";
import { SITE_URL } from "../lib/siteIdentity";

export const prerender = true;

const staticRoutes = [
  "/",
  "/aero/",
  "/afterlife/",
  "/bureaucracy/",
  "/constitution/",
  "/copyright/",
  "/dink/",
  "/dyno/",
  "/map/",
  "/narmail/",
  "/overpriced/",
  "/president/",
  "/privacy/",
  "/prototype/",
  "/qbag/",
  "/research/",
];

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const stickers = await getCollection("stickers");
  const stickerRoutes = stickers
    .map(({ data }) => `/overpriced/${data.slug}/`)
    .sort();
  const routes = [...new Set([...staticRoutes, ...stickerRoutes])];

  // CHOICE: Only canonical HTML pages belong here. Redirect aliases and PDFs stay out.
  const body = routes
    .map((route) => `  <url><loc>${escapeXml(new URL(route, SITE_URL).href)}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
