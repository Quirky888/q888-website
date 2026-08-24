import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SITE_ORIGIN = "https://q888.space";

async function collectFiles(directory, extension) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(absolutePath, extension);
      return entry.isFile() && entry.name.endsWith(extension) ? [absolutePath] : [];
    }),
  );

  return nested.flat();
}

function routeForHtml(htmlPath) {
  const relativePath = path.relative(DIST_DIR, htmlPath).split(path.sep).join("/");
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) {
    return `/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `/${relativePath}`;
}

function attributeValue(html, tagPattern, attribute) {
  const tag = html.match(tagPattern)?.[0];
  if (!tag) return null;
  return tag.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function internalOutputExists(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    decodedPath = pathname;
  }

  const relativePath = decodedPath.replace(/^\/+/, "");
  if (!relativePath) return fs.access(path.join(DIST_DIR, "index.html")).then(() => true, () => false);

  const candidates = decodedPath.endsWith("/")
    ? [path.join(DIST_DIR, relativePath, "index.html")]
    : [path.join(DIST_DIR, relativePath), path.join(DIST_DIR, relativePath, "index.html")];

  return Promise.any(candidates.map((candidate) => fs.access(candidate))).then(() => true, () => false);
}

async function main() {
  const htmlPaths = await collectFiles(DIST_DIR, ".html");
  const pages = await Promise.all(
    htmlPaths.map(async (htmlPath) => {
      const html = await fs.readFile(htmlPath, "utf8");
      const route = routeForHtml(htmlPath);
      const robots = attributeValue(html, /<meta\b[^>]*\bname=["']robots["'][^>]*>/i, "content") ?? "";
      const canonical = attributeValue(html, /<link\b[^>]*\brel=["']canonical["'][^>]*>/i, "href");
      const redirect = /<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/i.test(html);
      return { canonical, html, redirect, robots, route };
    }),
  );

  const sitemapPath = path.join(DIST_DIR, "sitemap.xml");
  const sitemap = await fs.readFile(sitemapPath, "utf8");
  const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  const errors = [];

  for (const page of pages) {
    const noindex = /(?:^|,)\s*noindex\b/i.test(page.robots);
    if (!noindex && !page.redirect) {
      if (!page.canonical) {
        errors.push(`${page.route}: indexable page has no canonical URL`);
      } else {
        const expectedCanonical = new URL(page.route, SITE_ORIGIN).href;
        if (page.canonical !== expectedCanonical) {
          errors.push(`${page.route}: canonical is ${page.canonical}; expected ${expectedCanonical}`);
        }
        if (!sitemapUrls.has(page.canonical)) {
          errors.push(`${page.route}: indexable canonical URL is missing from sitemap.xml`);
        }
      }
    }

    // CHOICE: Inline scripts contain HTML template strings that are not rendered links yet.
    // Validate the built document here; runtime UI links remain covered by their own tests.
    const documentHtml = page.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    const hrefs = [...documentHtml.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map((match) => match[1]);
    for (const href of hrefs) {
      if (/^(?:#|mailto:|tel:|javascript:)/i.test(href)) continue;

      let target;
      try {
        target = new URL(href, new URL(page.route, SITE_ORIGIN));
      } catch {
        errors.push(`${page.route}: invalid link URL ${href}`);
        continue;
      }

      if (target.origin !== SITE_ORIGIN) continue;
      if (!(await internalOutputExists(target.pathname))) {
        errors.push(`${page.route}: internal link ${href} has no built output`);
      }
    }
  }

  for (const sitemapUrl of sitemapUrls) {
    const target = new URL(sitemapUrl);
    if (target.origin !== SITE_ORIGIN) {
      errors.push(`sitemap.xml: non-canonical origin ${sitemapUrl}`);
    } else if (!(await internalOutputExists(target.pathname))) {
      errors.push(`sitemap.xml: ${sitemapUrl} has no built output`);
    }
  }

  if (errors.length > 0) {
    console.error("Indexing contract failed:\n");
    for (const error of [...new Set(errors)].sort()) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  const indexableCount = pages.filter((page) => !page.redirect && !/(?:^|,)\s*noindex\b/i.test(page.robots)).length;
  console.log(`Indexing contract passed: ${indexableCount} indexable pages, ${sitemapUrls.size} sitemap URLs, and no broken internal page links.`);
}

main().catch((error) => {
  console.error("Indexing contract could not run:", error);
  process.exitCode = 1;
});
