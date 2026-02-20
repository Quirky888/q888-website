type SectionId = "landing" | "projects" | "infocigan" | "contact";

interface SectionState {
  system_status: string;
  oracle_mode: string;
  whisper_protocol: string;
  coords: string;
}

const EDINBURGH_COORDS = "55.9439712N 3.1621543W";

const sectionStates: Record<SectionId, SectionState> = {
  landing: {
    system_status: "QUIET",
    oracle_mode: "ENGAGED",
    whisper_protocol: "ACTIVE",
    coords: "55.9439712N 3.1621543W",
  },
  projects: {
    system_status: "OBSERVING",
    oracle_mode: "ENGAGED",
    whisper_protocol: "ACTIVE",
    coords: "55.9439712N 3.1621543W",
  },
  infocigan: {
    system_status: "MARKET",
    oracle_mode: "INVEST ",
    whisper_protocol: "DRIFT   ",
    coords: "55.9439712N 3.1621543W",
  },
  contact: {
    system_status: "OPEN",
    oracle_mode: "ENGAGED",
    whisper_protocol: "INACTIVE",
    coords: "55.9439712N 3.1621543W",
  },
};

let currentSection: SectionId = "landing";
let override: Partial<SectionState> | null = null;
let userCoords: string | null = null;
let observer: IntersectionObserver | null = null;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getMetaElements(field: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(`[data-field="${field}"]`);
}

function crossfadeValue(el: HTMLElement, newValue: string) {
  if (el.textContent === newValue) return;

  if (prefersReducedMotion()) {
    el.textContent = newValue;
    return;
  }

  if (el.tagName === "HOTFX-SPLIT-FLAP") {
    el.textContent = newValue;
    return;
  }

  el.style.transition = "opacity 70ms linear";
  el.style.opacity = "0";

  setTimeout(() => {
    el.textContent = newValue;
    el.style.opacity = "1";
  }, 70);
}

function applyState() {
  const base = sectionStates[currentSection];
  const coords =
    override?.coords ??
    (currentSection === "projects" ? EDINBURGH_COORDS : (userCoords ?? EDINBURGH_COORDS));
  const state = override ? { ...base, ...override } : base;
  const resolved = { ...state, coords };

  Object.entries(resolved).forEach(([field, value]) => {
    getMetaElements(field).forEach((el) => crossfadeValue(el, value));
  });
}

export function setUserCoords(coords: string | null) {
  userCoords = coords;
  applyState();
}

export function setSystemOverride(state: Partial<SectionState> | null) {
  override = state === null ? null : (override ? { ...override, ...state } : state);
  applyState();
}

export function clearSystemOverride() {
  override = null;
  applyState();
}

function handleIntersection(entries: IntersectionObserverEntry[]) {
  let mostVisible: { id: SectionId; ratio: number } | null = null;

  for (const entry of entries) {
    const id = (entry.target as HTMLElement).dataset.section as SectionId;
    if (!id) continue;

    if (entry.isIntersecting) {
      if (!mostVisible || entry.intersectionRatio > mostVisible.ratio) {
        mostVisible = { id, ratio: entry.intersectionRatio };
      }
    }
  }

  if (mostVisible && mostVisible.id !== currentSection) {
    currentSection = mostVisible.id;
    applyState();
  }
}

export function initSystemMetaState() {
  if (observer) {
    observer.disconnect();
  }

  const sections = document.querySelectorAll<HTMLElement>("[data-section]");
  if (sections.length === 0) return;

  observer = new IntersectionObserver(handleIntersection, {
    threshold: [0.1, 0.3, 0.5, 0.7],
    rootMargin: "-10% 0px -10% 0px",
  });

  sections.forEach((section) => observer!.observe(section));

  applyState();
}

export function destroySystemMetaState() {
  observer?.disconnect();
  observer = null;
}
