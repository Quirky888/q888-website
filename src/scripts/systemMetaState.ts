type SectionId = "landing" | "projects" | "infocigan" | "contact";

interface SectionState {
  system_status?: string;
  oracle_mode?: string;
  whisper_protocol?: string;
  market_state?: string;
}

const sectionStates: Record<SectionId, SectionState> = {
  landing: { system_status: "QUIET" },
  projects: { system_status: "OBSERVING" },
  infocigan: { system_status: "UNSTABLE" },
  contact: { system_status: "OPEN" },
};

const defaultState: SectionState = {
  system_status: "QUIET",
  oracle_mode: "ENGAGED",
  whisper_protocol: "ACTIVE",
};

let currentSection: SectionId = "landing";
let override: SectionState | null = null;
let observer: IntersectionObserver | null = null;

function getMetaElements(field: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(`[data-field="${field}"]`);
}

function updateField(field: string, value: string) {
  const elements = getMetaElements(field);
  elements.forEach((el) => {
    if (el.textContent === value) return;
    
    el.classList.add("is-changing");
    
    setTimeout(() => {
      el.textContent = value;
      el.classList.remove("is-changing");
    }, 90);
  });
}

function applyState() {
  const state = override || sectionStates[currentSection] || {};
  const merged = { ...defaultState, ...state };
  
  Object.entries(merged).forEach(([field, value]) => {
    if (value) updateField(field, value);
  });
}

export function setSystemOverride(state: SectionState | null) {
  override = state;
  applyState();
}

export function clearSystemOverride() {
  override = null;
  applyState();
}

function handleIntersection(entries: IntersectionObserverEntry[]) {
  let mostVisible: { id: SectionId; ratio: number } | null = null;
  
  entries.forEach((entry) => {
    const id = (entry.target as HTMLElement).dataset.section as SectionId;
    if (!id) return;
    
    if (entry.isIntersecting) {
      if (!mostVisible || entry.intersectionRatio > mostVisible.ratio) {
        mostVisible = { id, ratio: entry.intersectionRatio };
      }
    }
  });
  
  if (mostVisible && mostVisible.id !== currentSection) {
    currentSection = mostVisible.id;
    if (!override) applyState();
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
