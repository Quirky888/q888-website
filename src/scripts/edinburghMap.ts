import Panzoom from "@panzoom/panzoom";

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
let panzoomInstance: ReturnType<typeof Panzoom> | null = null;
let lastInnerWidth = window.innerWidth;

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
  private touchStartY = 0;
  private touchStartTime = 0;

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
    const closeHandler = (e?: Event) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.close();
    };
    this.closeBtn.addEventListener("click", closeHandler, { signal });
    this.closeBtn.addEventListener("touchend", closeHandler, { signal, passive: false });

    this.drawer.addEventListener("touchstart", (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    }, { signal, passive: true });

    this.drawer.addEventListener("touchmove", (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - this.touchStartY;
      
      if (deltaY > 0 && deltaY < 100) {
        this.drawer.style.transform = `translateY(${deltaY}px)`;
      }
    }, { signal, passive: true });

    this.drawer.addEventListener("touchend", (e) => {
      const touchY = e.changedTouches[0].clientY;
      const deltaY = touchY - this.touchStartY;
      const deltaTime = Date.now() - this.touchStartTime;
      const velocity = deltaY / deltaTime;

      this.drawer.style.transform = '';

      if (deltaY > 100 || velocity > 0.5) {
        this.close();
      }
    }, { signal, passive: true });
  }

  open(locationId: string) {
    console.log('[Edinburgh Map] Opening drawer for location:', locationId);
    const location = this.stories.find((story) => story.id === locationId);
    if (!location) {
      console.warn('[Edinburgh Map] Location not found:', locationId);
      return;
    }

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
    console.log('[Edinburgh Map] Drawer opened successfully');
  }

  close() {
    console.log('[Edinburgh Map] Closing drawer');
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
      const openStory = (e?: Event) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.open(story.id);
      };
      dot.addEventListener("click", openStory);
      dot.addEventListener("touchend", openStory, { passive: false });
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
    group.classList.add("eden-hotspot", "panzoom-exclude");
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

    // Add Inner Orbit Ring
    const innerRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    innerRing.setAttribute("class", "hotspot-ring-inner");
    innerRing.setAttribute("cx", String(location.hotspot.cx));
    innerRing.setAttribute("cy", String(location.hotspot.cy));
    innerRing.setAttribute("r", String((location.hotspot.r ?? baseRadius) * 1.5));
    group.appendChild(innerRing);

    // Add Outer Orbit Ring
    const outerRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    outerRing.setAttribute("class", "hotspot-ring-outer");
    outerRing.setAttribute("cx", String(location.hotspot.cx));
    outerRing.setAttribute("cy", String(location.hotspot.cy));
    outerRing.setAttribute("r", String((location.hotspot.r ?? baseRadius) * 2.2));
    group.appendChild(outerRing);

    // Add Tooltip Label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "hotspot-label");
    label.setAttribute("x", String(location.hotspot.cx));
    label.setAttribute("y", String(location.hotspot.cy - (location.hotspot.r ?? baseRadius) * 3.5));
    label.setAttribute("text-anchor", "middle");
    label.textContent = location.name;
    group.appendChild(label);

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

    const activate = (e?: Event) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      drawer.open(locationId);
    };

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
  const handleClickAway = (event: Event) => {
    if (!drawer.isOpen()) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(SELECTOR_DRAWER) || target.closest(".eden-hotspot")) return;
    drawer.close();
  };

  section.addEventListener("click", handleClickAway, { signal });
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

async function initMap(section: HTMLElement, signal: AbortSignal, panel: HTMLElement) {
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

    console.log('[Edinburgh Map] Map initialized successfully with', data.locations.length, 'locations');

    const mapContainer = section.querySelector<HTMLElement>(".eden-map-container");
    const mapShell = section.querySelector<HTMLElement>(".eden-map-shell");
    const mapImage = section.querySelector<HTMLImageElement>(".eden-map-image");
    const loadingEl = section.querySelector<HTMLElement>("[data-eden-map-loading]");
    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    console.log('[Panzoom] mapContainer:', mapContainer ? 'Found' : 'Not found');
    console.log('[Panzoom] mapShell:', mapShell ? 'Found' : 'Not found');
    console.log('[Panzoom] mapImage:', mapImage ? 'Found' : 'Not found');
    console.log('[Panzoom] loadingEl:', loadingEl ? 'Found' : 'Not found');
    console.log('[Panzoom] isMobile:', isMobile());
    console.log('[Panzoom] Window width:', window.innerWidth);

    const hideLoading = () => {
      if (loadingEl) {
        loadingEl.classList.add("hidden");
      }
    };

    let touchCount = 0;
    if (mapContainer) {
      mapContainer.addEventListener(
        "touchstart",
        (e) => {
          touchCount = e.touches.length;
        },
        { capture: true, passive: true, signal }
      );
    }

    const initPanzoomIfMobile = () => {
      if (!isMobile() || !mapContainer || !mapShell) return;
      if (!panel.classList.contains("is-active")) return;
      if (panzoomInstance) {
        panzoomInstance.destroy();
        panzoomInstance = null;
      }
      console.log('[Panzoom] Starting initialization...');
      try {
        panzoomInstance = Panzoom(mapContainer, {
          maxScale: 3,
          minScale: 1,
          startScale: 1,
          contain: "inside",
          cursor: "move",
          pinchAndPan: true,
          animate: false,
          duration: 0,
          excludeClass: "panzoom-exclude",
          panOnlyWhenZoomed: true,
          disableZoom: false,
          touchAction: "pan-y",
          handleStartEvent: (e: Event) => {
            if ("touches" in e && touchCount < 2) return;
            e.preventDefault();
            e.stopPropagation();
          },
        });
        console.log('[Panzoom] Instance created successfully');
        try {
          mapShell.addEventListener("wheel", panzoomInstance.zoomWithWheel, {
            passive: false,
            signal,
          });
          console.log('[Panzoom] Event listener attached');
        } catch (wheelError) {
          console.error('[Panzoom] Wheel listener failed:', wheelError);
        }
      } catch (error) {
        console.error('[Panzoom] Initialization failed:', error);
        hideLoading();
      }
    };

    const onImageReady = () => {
      console.log('[Edinburgh Map] Image loaded, hiding loading indicator');
      hideLoading();
      initPanzoomIfMobile();
    };

    if (mapImage && loadingEl) {
      if (mapImage.complete && mapImage.naturalHeight > 0) {
        console.log('[Edinburgh Map] Image already loaded');
        onImageReady();
      } else {
        console.log('[Edinburgh Map] Waiting for image load');
        mapImage.addEventListener("load", onImageReady, { once: true, signal });
        mapImage.addEventListener(
          "error",
          () => {
            console.warn('[Edinburgh Map] Image failed to load, hiding loading indicator');
            hideLoading();
          },
          { once: true, signal }
        );
      }
    } else {
      console.warn('[Edinburgh Map] mapImage or loadingEl not found, skipping load wait');
      hideLoading();
      initPanzoomIfMobile();
    }

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (!panzoomInstance) return;
      if (window.innerWidth === lastInnerWidth) return;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        try {
          panzoomInstance?.reset({ animate: false });
          lastInnerWidth = window.innerWidth;
        } catch (e) {
          console.error('[Panzoom] Reset failed:', e);
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize, { signal });
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

  console.log('[Edinburgh Map] Initializing...');
  console.log('[Edinburgh Map] Screen:', window.innerWidth, 'x', window.innerHeight);
  console.log('[Edinburgh Map] Orientation:', window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');

  const panel = document.querySelector<HTMLElement>(SELECTOR_PANEL);
  if (!panel) {
    console.warn('[Edinburgh Map] Panel not found');
    initialized = false;
    return;
  }
  console.log('[Edinburgh Map] Panel found');

  const section = panel.matches(SELECTOR_SECTION)
    ? panel
    : panel.querySelector<HTMLElement>(SELECTOR_SECTION);
  if (!section) {
    initialized = false;
    return;
  }

  const tryInit = () => {
    if (panel.classList.contains("is-active")) {
      if (!mapInitialized) {
        abortController?.abort();
        abortController = new AbortController();
        const { signal } = abortController;
        console.log('[Edinburgh Map] Panel is active, initializing map...');
        initMap(section, signal, panel);
      }
    } else {
      abortController?.abort();
      abortController = null;
      if (panzoomInstance) {
        panzoomInstance.destroy();
        panzoomInstance = null;
        console.log('[Panzoom] Destroyed on panel close');
      }
      if (window.matchMedia("(max-width: 768px)").matches) {
        const loadingEl = section?.querySelector<HTMLElement>("[data-eden-map-loading]");
        if (loadingEl) loadingEl.classList.remove("hidden");
      }
      mapInitialized = false;
    }
  };

  tryInit();

  panelObserver = new MutationObserver(() => tryInit());
  panelObserver.observe(panel, { attributes: true, attributeFilter: ["class"] });

  panel.addEventListener("transitionend", tryInit);
  panel.addEventListener("click", tryInit, { once: true });
}

export function destroyEdinburghMap() {
  panzoomInstance?.destroy();
  panzoomInstance = null;
  panelObserver?.disconnect();
  panelObserver = null;
  abortController?.abort();
  abortController = null;
  initialized = false;
  mapInitialized = false;
}
