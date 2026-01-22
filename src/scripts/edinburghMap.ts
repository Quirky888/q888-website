type EdenHotspot = {
  cx: number;
  cy: number;
  r?: number;
};

type EdenLocation = {
  id: string;
  order?: number;
  name: string;
  emoji: string;
  color: string;
  short: string;
  long: string;
  hotspot: EdenHotspot;
};

type EdenDesignSystem = {
  colors?: {
    primary?: string;
    primaryHover?: string;
    primaryActive?: string;
    background?: string;
    surface?: string;
    textPrimary?: string;
    textSecondary?: string;
    error?: string;
  };
};

type EdenHotspotDefaults = {
  radius?: number;
  hoverRadius?: number;
  clickRadius?: number;
};

type EdenDrawerDefaults = {
  heightDesktop?: string;
  heightTablet?: string;
  heightMobile?: string;
  animationDuration?: string;
};

type EdenStories = {
  locations: EdenLocation[];
  designSystem?: EdenDesignSystem;
  hotspotDefaults?: EdenHotspotDefaults;
  drawerDefaults?: EdenDrawerDefaults;
};

const SELECTOR_PANEL = '[data-drawer-panel="edinburgh-map"]';
const SELECTOR_SECTION = "[data-eden-map-section]";
const SELECTOR_SVG = "[data-eden-map-svg]";
const SELECTOR_DRAWER = "[data-eden-drawer]";

let initialized = false;
let mapInitialized = false;
let abortController: AbortController | null = null;
let panelObserver: MutationObserver | null = null;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function normalizeColor(value?: string) {
  if (!value) return value;
  return value.replace(/\s+/g, "").replace(/^#21808D$/i, "#21808D").replace(/^#FFFFD$/i, "#FFFFDD");
}

function normalizeDrawerHeight(fallback: string, value?: string) {
  if (!value) return fallback;
  if (value.endsWith("%")) {
    return value.replace("%", "vh");
  }
  return value;
}

function setDesignSystemVars(section: HTMLElement, designSystem?: EdenDesignSystem, drawerDefaults?: EdenDrawerDefaults) {
  const colors = designSystem?.colors;
  if (colors) {
    const map: Record<string, string | undefined> = {
      "--eden-primary": normalizeColor(colors.primary),
      "--eden-primary-hover": normalizeColor(colors.primaryHover),
      "--eden-primary-active": normalizeColor(colors.primaryActive),
      "--eden-bg": normalizeColor(colors.background),
      "--eden-surface": normalizeColor(colors.surface),
      "--eden-text": normalizeColor(colors.textPrimary),
      "--eden-text-muted": normalizeColor(colors.textSecondary),
      "--eden-error": normalizeColor(colors.error),
    };

    Object.entries(map).forEach(([key, value]) => {
      if (value) section.style.setProperty(key, value);
    });
  }

  if (drawerDefaults) {
    section.style.setProperty(
      "--eden-drawer-height-desktop",
      normalizeDrawerHeight("45vh", drawerDefaults.heightDesktop)
    );
    section.style.setProperty(
      "--eden-drawer-height-tablet",
      normalizeDrawerHeight("50vh", drawerDefaults.heightTablet)
    );
    section.style.setProperty(
      "--eden-drawer-height-mobile",
      normalizeDrawerHeight("100vh", drawerDefaults.heightMobile)
    );
    if (drawerDefaults.animationDuration) {
      section.style.setProperty("--eden-drawer-duration", drawerDefaults.animationDuration);
    }
  }
}

class StoryDrawer {
  private drawer: HTMLElement;
  private accentBorder: HTMLElement;
  private emoji: HTMLElement;
  private title: HTMLElement;
  private shortText: HTMLElement;
  private longText: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private navDots: HTMLElement;
  private stories: EdenLocation[];
  private currentIndex = -1;

  constructor(drawer: HTMLElement, stories: EdenLocation[]) {
    this.drawer = drawer;
    this.stories = stories;

    const accent = drawer.querySelector<HTMLElement>("[data-eden-accent]");
    const emoji = drawer.querySelector<HTMLElement>("[data-eden-emoji]");
    const title = drawer.querySelector<HTMLElement>("[data-eden-title]");
    const shortText = drawer.querySelector<HTMLElement>("[data-eden-short]");
    const longText = drawer.querySelector<HTMLElement>("[data-eden-long]");
    const closeBtn = drawer.querySelector<HTMLButtonElement>("[data-eden-close]");
    const navDots = drawer.querySelector<HTMLElement>("[data-eden-dots]");

    if (!accent || !emoji || !title || !shortText || !longText || !closeBtn || !navDots) {
      throw new Error("Eden drawer markup missing required elements.");
    }

    this.accentBorder = accent;
    this.emoji = emoji;
    this.title = title;
    this.shortText = shortText;
    this.longText = longText;
    this.closeBtn = closeBtn;
    this.navDots = navDots;
  }

  bindEvents(signal: AbortSignal) {
    this.closeBtn.addEventListener("click", () => this.close(), { signal });
  }

  open(locationId: string) {
    const location = this.stories.find((story) => story.id === locationId);
    if (!location) return;

    this.currentIndex = this.stories.findIndex((story) => story.id === locationId);

    this.accentBorder.style.backgroundColor = location.color;
    this.emoji.textContent = location.emoji;
    this.title.textContent = location.name;
    this.shortText.textContent = location.short;

    const paragraphs = String(location.long || "")
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    this.longText.innerHTML = paragraphs.map(() => "<p></p>").join("");
    Array.from(this.longText.querySelectorAll("p")).forEach((el, i) => {
      el.textContent = paragraphs[i] || "";
    });

    this.updateNavDots();

    this.drawer.classList.add("is-open");
    this.drawer.setAttribute("aria-hidden", "false");
  }

  close() {
    this.drawer.classList.remove("is-open");
    this.drawer.setAttribute("aria-hidden", "true");
    this.currentIndex = -1;
  }

  isOpen() {
    return this.drawer.classList.contains("is-open");
  }

  updateNavDots() {
    this.navDots.innerHTML = "";
    this.stories.forEach((story, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "eden-nav-dot" + (index === this.currentIndex ? " is-active" : "");
      dot.setAttribute("aria-label", `Open ${story.name}`);
      dot.addEventListener("click", () => this.open(story.id));
      this.navDots.appendChild(dot);
    });
  }
}

function buildHotspots(
  svg: SVGSVGElement,
  stories: EdenLocation[],
  defaults: EdenHotspotDefaults = {}
) {
  const defs = svg.querySelector('defs');
  svg.innerHTML = "";
  if (defs) {
    svg.appendChild(defs);
  }
  const sorted = [...stories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const baseRadius = defaults.radius ?? 60;
  const clickRadius = defaults.clickRadius ?? baseRadius;

  sorted.forEach((location) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", `hotspot-${location.id}`);
    group.setAttribute("data-location-id", location.id);
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.classList.add("eden-hotspot");
    group.style.color = location.color;
    group.style.setProperty("--twinkle-dur", `${(Math.random() * 3.3 + 2.2).toFixed(2)}s`);
    group.style.setProperty("--twinkle-delay", `${-(Math.random() * 5).toFixed(2)}s`);
    group.style.setProperty("--twinkle-strength", (Math.random() * 0.4 + 0.8).toFixed(2));

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = location.name;
    group.appendChild(title);

    const trigger = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    trigger.setAttribute("class", "hotspot-trigger");
    trigger.setAttribute("cx", String(location.hotspot.cx));
    trigger.setAttribute("cy", String(location.hotspot.cy));
    trigger.setAttribute(
      "r",
      String(Math.max((location.hotspot.r ?? baseRadius) * 1.5, clickRadius))
    );
    trigger.setAttribute("fill", "transparent");
    trigger.setAttribute("stroke", "none");
    group.appendChild(trigger);

    const glowCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    glowCircle.setAttribute("class", "hotspot-glow");
    glowCircle.setAttribute("cx", String(location.hotspot.cx));
    glowCircle.setAttribute("cy", String(location.hotspot.cy));
    glowCircle.setAttribute("r", String(location.hotspot.r ?? baseRadius));
    glowCircle.setAttribute("fill", location.color);
    group.appendChild(glowCircle);

    svg.appendChild(group);
  });
}

function bindHotspots(
  svg: SVGSVGElement,
  stories: EdenLocation[],
  drawer: StoryDrawer,
  signal: AbortSignal
) {
  const hotspots = svg.querySelectorAll<SVGGElement>(".eden-hotspot");
  hotspots.forEach((hotspot) => {
    const locationId = hotspot.getAttribute("data-location-id");
    if (!locationId) return;

    const activate = () => drawer.open(locationId);
    hotspot.addEventListener("click", activate, { signal });
    hotspot.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      },
      { signal }
    );
  });

  if (prefersReducedMotion()) {
    return;
  }

  const ringOpacity = (svg.closest(SELECTOR_SECTION) as HTMLElement | null)
    ?.style.getPropertyValue("--eden-ring-opacity")
    ?.trim();

  if (ringOpacity) {
    svg.style.setProperty("--eden-ring-opacity", ringOpacity);
  }
}

function bindClickAway(section: HTMLElement, drawer: StoryDrawer, signal: AbortSignal) {
  section.addEventListener(
    "pointerdown",
    (event) => {
      if (!drawer.isOpen()) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(SELECTOR_DRAWER) || target.closest(".eden-hotspot")) return;
      drawer.close();
    },
    { signal }
  );
}

function bindEscapeKey(drawer: StoryDrawer, signal: AbortSignal) {
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && drawer.isOpen()) {
        drawer.close();
      }
    },
    { signal }
  );
}

async function initMap(section: HTMLElement, signal: AbortSignal) {
  if (mapInitialized) return;
  mapInitialized = true;
  
  const svg = section.querySelector<SVGSVGElement>(SELECTOR_SVG);
  const drawerEl = section.querySelector<HTMLElement>(SELECTOR_DRAWER);
  if (!svg || !drawerEl) {
    mapInitialized = false;
    return;
  }

  try {
    const response = await fetch("/eden-stories.json", { signal });
    if (!response.ok) throw new Error(`Failed to load eden-stories.json (${response.status})`);
    const data = (await response.json()) as EdenStories;
    if (!data?.locations?.length) {
      mapInitialized = false;
      return;
    }

    setDesignSystemVars(section, data.designSystem, data.drawerDefaults);

    const drawer = new StoryDrawer(drawerEl, data.locations);
    drawer.bindEvents(signal);
    buildHotspots(svg, data.locations, data.hotspotDefaults);
    bindHotspots(svg, data.locations, drawer, signal);
    bindClickAway(section, drawer, signal);
    bindEscapeKey(drawer, signal);
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Eden map failed to initialize:", error);
    }
    mapInitialized = false;
  }
}

export function initEdinburghMap() {
  if (initialized) return;
  initialized = true;

  abortController = new AbortController();
  const { signal } = abortController;

  const panel = document.querySelector<HTMLElement>(SELECTOR_PANEL);
  if (!panel) {
    initialized = false;
    return;
  }

  const section = panel.matches(SELECTOR_SECTION)
    ? panel
    : panel.querySelector<HTMLElement>(SELECTOR_SECTION);
  if (!section) {
    initialized = false;
    return;
  }

  const tryInit = () => {
    if (!mapInitialized && panel.classList.contains("is-active")) {
      initMap(section, signal);
    }
  };

  tryInit();

  panelObserver = new MutationObserver(() => tryInit());
  panelObserver.observe(panel, { attributes: true, attributeFilter: ["class"] });

  panel.addEventListener("transitionend", tryInit, { signal });
  panel.addEventListener("click", tryInit, { signal, once: true });
}

export function destroyEdinburghMap() {
  panelObserver?.disconnect();
  panelObserver = null;
  abortController?.abort();
  abortController = null;
  initialized = false;
  mapInitialized = false;
}
