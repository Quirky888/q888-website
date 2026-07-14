import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const knowledgeDirectory = resolve(projectRoot, "src/content/knowledge");
const projectsDirectory = resolve(projectRoot, "src/content/projects");
const stickersDirectory = resolve(projectRoot, "src/content/stickers");
const mapPath = resolve(projectRoot, "public/eden-stories.json");
const outputPath = resolve(
  projectRoot,
  "netlify/functions/_generated/chat-context.json",
);

const MAX_KNOWLEDGE_DOCUMENTS = 100;
const MAX_DOCUMENT_CHARACTERS = 20_000;
const MAX_TOTAL_KNOWLEDGE_CHARACTERS = 160_000;
const VALID_AUDIENCES = new Set(["nar", "investor"]);

const supplementalProjects = [
  {
    slug: "digital-ink",
    title: "Digital Ink",
    descriptor:
      "A system for meaning, scarcity, and traceable digital creation.",
    system: "SYS: INK",
    panelTitle: "Digital Ink",
    panelDescription:
      "What if digital art had memory? What if every brushstroke carried weight, history, and emotional resonance? Digital Ink challenges the disposable nature of infinite digital tools by introducing constraint-based creativity, the Symbolic Smart Pixel Protocol (SSPP), Apple Vision + GPT-4o poetic transformation, and 1,000 Smart Inks on iPadOS.",
    panelSpecs: [
      { label: "PLATFORM", value: "iPadOS (iPad-only)" },
      { label: "STATUS", value: "AVAILABLE NOW" },
      { label: "ROLE", value: "Concept · Product Design · UX · SwiftUI" },
      { label: "YEAR", value: "2025–2026" },
    ],
  },
  {
    slug: "edinburgh-map",
    title: "Edinburgh Magical Map",
    descriptor: "A mythic cartography of place, memory, and hidden doors.",
    system: "SYS: MAP",
    panelTitle: "Edinburgh Magical Map",
    panelDescription:
      "Welcome to Edinburgh — where magic retired but still drinks in public. A mythic cartography showing 15 secret locations and their hidden history and lore, including Castle on Chicken Legs, Real Edinburgh Castle hidden under Arthur's Seat, Troll Market, Star Bank, and Star House.",
    panelSpecs: [
      { label: "LAYER", value: "EDINBURGH CITY / UNDERWORLD OVERLAY" },
      { label: "ACCESS", value: "COUNCIL-GATED" },
      { label: "STATUS", value: "ACTIVE (REDACTED)" },
    ],
  },
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath, extension)));
    } else if (entry.isFile() && extname(entry.name) === extension) {
      files.push(entryPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function readJsonDirectory(directory) {
  const files = await listFiles(directory, ".json");
  return Promise.all(files.map(readJson));
}

function parseKnowledgeDocument(path, source) {
  const match = source.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/,
  );

  if (!match) {
    throw new Error(
      "Knowledge document " +
        relative(projectRoot, path) +
        " needs JSON frontmatter between --- markers.",
    );
  }

  let metadata;
  try {
    metadata = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(
      "Knowledge document " +
        relative(projectRoot, path) +
        " has invalid JSON frontmatter: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  const body = match[2].trim();
  const id = relative(knowledgeDirectory, path)
    .replace(/\.md$/, "")
    .split("\\")
    .join("/");

  if (typeof metadata.title !== "string" || !metadata.title.trim()) {
    throw new Error("Knowledge document " + id + " needs a title.");
  }
  if (
    typeof metadata.route !== "string" ||
    !/^\/[a-z0-9-/]*$/.test(metadata.route)
  ) {
    throw new Error("Knowledge document " + id + " has an invalid route.");
  }
  if (
    !Array.isArray(metadata.keywords) ||
    metadata.keywords.length === 0 ||
    metadata.keywords.some(
      (keyword) => typeof keyword !== "string" || !keyword.trim(),
    )
  ) {
    throw new Error("Knowledge document " + id + " needs keywords.");
  }
  if (
    !Array.isArray(metadata.audiences) ||
    metadata.audiences.length === 0 ||
    metadata.audiences.some((audience) => !VALID_AUDIENCES.has(audience))
  ) {
    throw new Error(
      "Knowledge document " + id + " has an invalid audience.",
    );
  }
  if (
    metadata.priority !== undefined &&
    !Number.isInteger(metadata.priority)
  ) {
    throw new Error(
      "Knowledge document " + id + " priority must be an integer.",
    );
  }
  if (!body.startsWith("# ")) {
    throw new Error(
      "Knowledge document " + id + " needs a single H1 heading.",
    );
  }
  if (body.length > MAX_DOCUMENT_CHARACTERS) {
    throw new Error(
      "Knowledge document " +
        id +
        " exceeds " +
        MAX_DOCUMENT_CHARACTERS +
        " characters.",
    );
  }

  return {
    id,
    title: metadata.title.trim(),
    route: metadata.route,
    keywords: metadata.keywords.map((keyword) => keyword.trim()),
    audiences: metadata.audiences,
    priority: metadata.priority ?? 0,
    body,
  };
}

async function buildKnowledgeDocuments() {
  const files = await listFiles(knowledgeDirectory, ".md");
  if (files.length > MAX_KNOWLEDGE_DOCUMENTS) {
    throw new Error(
      "Knowledge collection exceeds " +
        MAX_KNOWLEDGE_DOCUMENTS +
        " documents.",
    );
  }

  const documents = await Promise.all(
    files.map(async (path) =>
      parseKnowledgeDocument(path, await readFile(path, "utf8")),
    ),
  );
  const routeOwners = new Map();
  for (const document of documents) {
    const existingOwner = routeOwners.get(document.route);
    if (existingOwner) {
      throw new Error(
        "Knowledge documents " +
          existingOwner +
          " and " +
          document.id +
          " both use route " +
          document.route +
          ".",
      );
    }
    routeOwners.set(document.route, document.id);
  }

  const totalCharacters = documents.reduce(
    (total, document) => total + document.body.length,
    0,
  );

  if (totalCharacters > MAX_TOTAL_KNOWLEDGE_CHARACTERS) {
    throw new Error(
      "Knowledge collection exceeds " +
        MAX_TOTAL_KNOWLEDGE_CHARACTERS +
        " characters.",
    );
  }

  return documents.sort(
    (a, b) => b.priority - a.priority || a.id.localeCompare(b.id),
  );
}

function toProject(project) {
  return {
    slug: project.slug,
    title: project.cardTitle,
    descriptor: project.cardDescriptor,
    system: project.cardSystem,
    panelTitle: project.panelTitle,
    panelDescription: project.panelDescription,
    panelSpecs: project.panelSpecs,
  };
}

function toSticker(sticker) {
  return {
    id: sticker.id,
    title: sticker.title,
    tagline: sticker.tagline,
    ask: sticker.ask,
    availableCount: sticker.availableCount,
    editionTotal: sticker.editionTotal,
    status: sticker.status,
    provenance: sticker.provenance,
    description: sticker.description,
  };
}

async function buildChatContext() {
  const [projectEntries, stickerEntries, mapData, knowledgeDocuments] =
    await Promise.all([
      readJsonDirectory(projectsDirectory),
      readJsonDirectory(stickersDirectory),
      readJson(mapPath),
      buildKnowledgeDocuments(),
    ]);

  const projects = projectEntries
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toProject)
    .concat(supplementalProjects);
  const stickers = stickerEntries
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toSticker);
  const mapLocations = mapData.locations.map((location) => ({
    id: location.id,
    name: location.name,
    emoji: location.emoji,
    short: location.short,
    long: location.long,
  }));

  return {
    version: 1,
    projects,
    stickers,
    mapLocations,
    knowledgeDocuments,
  };
}

const chatContext = await buildChatContext();
const output = JSON.stringify(chatContext, null, 2) + "\n";

await mkdir(dirname(outputPath), { recursive: true });

let currentOutput = "";
try {
  currentOutput = await readFile(outputPath, "utf8");
} catch {
  // The first build creates the generated context.
}

if (currentOutput !== output) {
  await writeFile(outputPath, output, "utf8");
  console.log("Built trusted chatbot context.");
} else {
  console.log("Trusted chatbot context is up to date.");
}

console.log(
  "Chat context: " +
    chatContext.projects.length +
    " projects, " +
    chatContext.stickers.length +
    " stickers, " +
    chatContext.mapLocations.length +
    " map locations, " +
    chatContext.knowledgeDocuments.length +
    " knowledge document(s).",
);
