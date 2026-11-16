// Canonical routes for the Infocigan project collection. Slugs without an entry fall back to "/<slug>/".
export const projectRoutes: Record<string, string> = {
  "overpriced-stickers": "/overpriced/",
  "q-bag": "/qbag/",
  "nar-mail-express": "/narmail/",
  "afterlife-contracts": "/afterlife/",
  "president-of-the-galaxy": "/president/",
  "dyno-milk": "/dyno/",
  "aero-sticker": "/aero/",
};

export function projectHref(slug: string): string {
  return projectRoutes[slug] || `/${slug}/`;
}
