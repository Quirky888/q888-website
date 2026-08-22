import {
  getVisitorIdentityRegion,
  type VisitorIdentityRegion,
} from "./visitorGeo";

const INTERNATIONAL_NAME = "Alexander Sestakovs";
const LATVIAN_NAME = "Aleksandrs Šestakovs";
const KNOWN_NAME_FORMS = [
  "Aleksandrs Šestakovs",
  "Aleksandrs Sestakovs",
  "Alexander Sestakovs",
];

let currentRun = 0;

function getDevelopmentRegionOverride(): VisitorIdentityRegion | null {
  if (!import.meta.env.DEV) return null;
  const value = new URLSearchParams(window.location.search).get("identity-region");
  return value === "latvia" || value === "russia" || value === "international"
    ? value
    : null;
}

function replaceKnownNames(value: string, displayName: string) {
  return KNOWN_NAME_FORMS.reduce(
    (updatedValue, knownName) => updatedValue.replaceAll(knownName, displayName),
    value,
  );
}

function localizeVisibleText(displayName: string) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, noscript, textarea")) {
        return NodeFilter.FILTER_REJECT;
      }
      return KNOWN_NAME_FORMS.some((name) => node.textContent?.includes(name))
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const matchingNodes: Text[] = [];
  while (walker.nextNode()) matchingNodes.push(walker.currentNode as Text);

  matchingNodes.forEach((node) => {
    node.textContent = replaceKnownNames(node.textContent ?? "", displayName);
  });
}

function localizeDocumentMetadata(displayName: string) {
  document.title = replaceKnownNames(document.title, displayName);
  document
    .querySelectorAll<HTMLMetaElement>('meta[content*="Alexander Sestakovs"], meta[content*="Aleksandrs Sestakovs"], meta[content*="Aleksandrs Šestakovs"]')
    .forEach((meta) => {
      meta.content = replaceKnownNames(meta.content, displayName);
    });
}

function applyIdentityRegion(region: VisitorIdentityRegion) {
  const displayName = region === "latvia" ? LATVIAN_NAME : INTERNATIONAL_NAME;

  document.documentElement.dataset.visitorIdentityRegion = region;
  localizeVisibleText(displayName);
  localizeDocumentMetadata(displayName);

  document.querySelectorAll<HTMLElement>("[data-artist-name]").forEach((element) => {
    element.textContent = displayName;
  });
}

export function initLocalizedArtistName() {
  const run = ++currentRun;
  const developmentOverride = getDevelopmentRegionOverride();

  // LEARN: international spelling is the resilient default when IP lookup is unavailable.
  applyIdentityRegion("international");

  if (developmentOverride) {
    applyIdentityRegion(developmentOverride);
    return;
  }

  getVisitorIdentityRegion().then((region) => {
    if (run !== currentRun) return;
    applyIdentityRegion(region);
  });
}

export function cleanupLocalizedArtistName() {
  currentRun += 1;
}
