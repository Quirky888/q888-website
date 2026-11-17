// Shared by buildCvPdf.mjs and checkEarthCv.mjs.
// The fingerprint is a hash of the readable text of the Earth version of /bureaucracy/,
// so it changes when a project, exhibition or sentence changes — not when styling does.
import { createHash } from "node:crypto";

export const PDF_PATH = "public/docs/Q888_Artist_CV_Earth.pdf";
export const RECORD_PATH = "scripts/earth-cv-pdf.json";

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

/** Returns the visible text of the Earth CV section, or null if the page has none. */
export function extractEarthCvText(html) {
  // Start after the opening tag: dev and production write different attributes on it.
  const marker = html.indexOf('id="earth"');
  if (marker === -1) return null;
  const start = html.indexOf(">", marker) + 1;
  const footer = html.indexOf("earth-cv-foot", start);
  const end = footer === -1 ? -1 : html.indexOf("</footer>", footer);
  if (end === -1) return null;

  return html
    .slice(start, end)
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

export function fingerprint(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
