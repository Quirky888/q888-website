// Runs after `astro build`. Warns (never fails the build) when the Earth version of the
// artist CV has changed since the downloadable PDF was last generated.
import { existsSync, readFileSync } from "node:fs";
import { PDF_PATH, RECORD_PATH, extractEarthCvText, fingerprint } from "./earthCvFingerprint.mjs";

const builtPage = "dist/bureaucracy/index.html";
const remedy = "Run `npm run dev`, then `npm run cv:pdf`, and commit the new PDF.";

if (!existsSync(builtPage)) {
  console.warn(`Earth CV check skipped: ${builtPage} was not built.`);
  process.exit(0);
}

const text = extractEarthCvText(readFileSync(builtPage, "utf8"));
if (!text) {
  console.warn("Earth CV check: the Earth version section is missing from /bureaucracy/.");
  process.exit(0);
}

const record = existsSync(RECORD_PATH) ? JSON.parse(readFileSync(RECORD_PATH, "utf8")) : null;
if (!existsSync(PDF_PATH) || !record) {
  console.warn(`\n⚠ Earth CV PDF has no record of being generated. ${remedy}\n`);
} else if (record.fingerprint !== fingerprint(text)) {
  console.warn(
    `\n⚠ Earth CV PDF is out of date: the Earth version of /bureaucracy/ changed after ${record.generatedAt}.\n  ${remedy}\n`,
  );
} else {
  console.log("Earth CV PDF matches the Earth version of /bureaucracy/.");
}
