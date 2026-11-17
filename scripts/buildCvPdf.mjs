// Regenerates the Earth version PDF of the artist CV from the running dev server.
// Usage: start `npm run dev`, then `npm run cv:pdf` (optionally `npm run cv:pdf -- http://localhost:4322`).
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDF_PATH, RECORD_PATH, extractEarthCvText, fingerprint } from "./earthCvFingerprint.mjs";

const origin = (process.argv[2] ?? "http://localhost:4321").replace(/\/$/, "");
const pageUrl = `${origin}/bureaucracy/`;

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const chrome = chromeCandidates.find((path) => existsSync(path));
if (!chrome) {
  console.error("No Chrome found. Install Google Chrome or set CHROME_PATH to its executable.");
  process.exit(1);
}

let html;
try {
  html = await (await fetch(pageUrl)).text();
} catch {
  console.error(`Could not reach ${pageUrl}. Start the site with \`npm run dev\` first.`);
  process.exit(1);
}

const text = extractEarthCvText(html);
if (!text) {
  console.error(`No Earth version section (id="earth") found at ${pageUrl}.`);
  process.exit(1);
}

// A throwaway profile keeps this run away from the user's own Chrome data.
const profile = mkdtempSync(join(tmpdir(), "q888-cv-pdf-"));
try {
  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${profile}`,
    "--no-pdf-header-footer",
    "--virtual-time-budget=8000",
    `--print-to-pdf=${PDF_PATH}`,
    `${pageUrl}#earth`,
  ], { stdio: "ignore" });
} finally {
  rmSync(profile, { recursive: true, force: true });
}

writeFileSync(
  RECORD_PATH,
  `${JSON.stringify({ fingerprint: fingerprint(text), generatedAt: new Date().toISOString() }, null, 2)}\n`,
);
console.log(`Earth CV PDF written to ${PDF_PATH}. Check it, then commit it together with ${RECORD_PATH}.`);
