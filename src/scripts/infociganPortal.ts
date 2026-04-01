// GSAP is lazy-loaded on first portal open to keep the initial bundle lean.
// ~57 KB minified; no reason to ship it to users who never open a portal.
type GsapType = typeof import("gsap").default;
let _gsapPromise: Promise<GsapType> | null = null;
function getGsap(): Promise<GsapType> {
  if (!_gsapPromise) {
    _gsapPromise = import("gsap").then((m) => m.default ?? m);
  }
  return _gsapPromise;
}

type Direction = "left" | "right";

let activePanel: HTMLElement | null = null;
let originDirection: Direction = "right";
let triggerElement: HTMLElement | null = null;
let initialized = false;
let abortController: AbortController | null = null;
let isClosing = false;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type ScrollLockState = {
  count: number;
  previousOverflow: string;
  previousPaddingRight: string;
};

function getScrollLockState(): ScrollLockState {
  const win = window as Window & { __q888ScrollLock?: ScrollLockState };
  if (!win.__q888ScrollLock) {
    win.__q888ScrollLock = {
      count: 0,
      previousOverflow: "",
      previousPaddingRight: "",
    };
  }
  return win.__q888ScrollLock;
}

function restoreFocus(el: HTMLElement | null) {
  if (!el) return;
  if (!el.isConnected) return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
}

function getPortalRoot(): HTMLElement | null {
  return document.querySelector(".infocigan-portal-system");
}

function getPanel(slug: string): HTMLElement | null {
  return document.querySelector(`[data-portal-panel="${slug}"]`);
}

function closePanelLocalDrawers(panel: HTMLElement) {
  const stickerDrawer = panel.querySelector<HTMLElement>("[data-sticker-drawer]");
  if (!stickerDrawer || stickerDrawer.classList.contains("hidden")) return;
  stickerDrawer.setAttribute("aria-hidden", "true");
  stickerDrawer.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function lockScroll() {
  const lockState = getScrollLockState();
  if (lockState.count === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    lockState.previousOverflow = document.body.style.overflow;
    lockState.previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  lockState.count += 1;
}

function unlockScroll() {
  const lockState = getScrollLockState();
  if (lockState.count === 0) return;
  lockState.count -= 1;
  if (lockState.count > 0) return;
  document.body.style.overflow = lockState.previousOverflow;
  document.body.style.paddingRight = lockState.previousPaddingRight;
}

function getDirection(element: Element): Direction {
  if (window.innerWidth < 768) return "right";
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  return centerX < window.innerWidth / 2 ? "left" : "right";
}

export async function openPortal(slug: string, direction: Direction) {
  const panel = getPanel(slug);
  if (!panel || activePanel === panel) return;
  const hadActivePanel = Boolean(activePanel);

  if (activePanel && activePanel !== panel) {
    activePanel.classList.remove("is-active");
    const gsap = await getGsap();
    gsap.set(activePanel.querySelector(".panel-content"), { clearProps: "x,opacity" });
    gsap.set(activePanel.querySelector(".panel-overlay"), { clearProps: "opacity" });
  }

  activePanel = panel;
  originDirection = direction;
  if (!hadActivePanel) lockScroll();

  panel.classList.add("is-active");
  panel.setAttribute("data-slide-from", direction);

  const xFrom = direction === "left" ? "-100%" : "100%";
  const gsap = await getGsap();

  if (prefersReducedMotion()) {
    gsap.set(panel.querySelector(".panel-content"), { x: 0, opacity: 1 });
    gsap.set(panel.querySelector(".panel-overlay"), { opacity: 1 });
  } else {
    gsap.fromTo(
      panel.querySelector(".panel-content"),
      { x: xFrom, opacity: 0.85 },
      { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    );
    gsap.fromTo(
      panel.querySelector(".panel-overlay"),
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power1.out" }
    );
  }

  // Update URL without jumping
  history.pushState(null, "", `#infocigan-zone-${slug}`);
}

export async function closePortal() {
  if (!activePanel || isClosing) return;
  isClosing = true;

  const panel = activePanel;
  const direction = originDirection;
  const xTo = direction === "left" ? "-100%" : "100%";

  const cleanup = () => {
    panel.classList.remove("is-active");
    unlockScroll();
    closePanelLocalDrawers(panel);
    restoreFocus(triggerElement);
    triggerElement = null;
    activePanel = null;
    isClosing = false;

    // Update URL without jumping (temporarily remove ID)
    const section = document.getElementById("infocigan");
    if (section) section.id = "_temp_infocigan";
    history.pushState(null, "", "#infocigan");
    if (section) section.id = "infocigan";
  };

  const gsap = await getGsap();

  if (prefersReducedMotion()) {
    gsap.set(panel.querySelector(".panel-content"), { x: xTo, opacity: 0 });
    gsap.set(panel.querySelector(".panel-overlay"), { opacity: 0 });
    cleanup();
  } else {
    gsap.to(panel.querySelector(".panel-overlay"), {
      opacity: 0,
      duration: 0.4,
      ease: "power1.in",
    });
    gsap.to(panel.querySelector(".panel-content"), {
      x: xTo,
      opacity: 0.85,
      duration: 0.6,
      ease: "power2.in",
      onComplete: cleanup,
    });
  }
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && activePanel) {
    closePortal();
  }
}

function checkHash() {
  const hash = window.location.hash;
  if (hash.startsWith("#infocigan-zone-")) {
    const slug = hash.replace("#infocigan-zone-", "");
    const sourceCard = document.querySelector(`[data-infocigan-slug="${slug}"]`) as HTMLElement;
    const direction = sourceCard ? getDirection(sourceCard) : "right";
    openPortal(slug, direction);
  } else if ((hash === "#infocigan" || hash === "") && activePanel) {
    closePortal();
  }
}

export function initInfociganPortal() {
  if (initialized) return;
  initialized = true;

  abortController = new AbortController();
  const { signal } = abortController;

  const cards = document.querySelectorAll<HTMLElement>("[data-infocigan-slug]");
  const backButtons = document.querySelectorAll<HTMLElement>("[data-portal-back]");

  cards.forEach((card) => {
    card.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        const slug = card.getAttribute("data-infocigan-slug");
        if (!slug) return;
        triggerElement = card;
        const direction = getDirection(card);
        openPortal(slug, direction);
      },
      { signal }
    );

    card.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const slug = card.getAttribute("data-infocigan-slug");
          if (!slug) return;
          triggerElement = card;
          const direction = getDirection(card);
          openPortal(slug, direction);
        }
      },
      { signal }
    );
  });

  backButtons.forEach((btn) => {
    btn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        closePortal();
      },
      { signal }
    );
  });

  document.addEventListener("keydown", handleEscape, { signal });
  window.addEventListener("popstate", checkHash, { signal });
  window.addEventListener("hashchange", checkHash, { signal });

  checkHash();
}

export function destroyInfociganPortal() {
  if (activePanel) {
    activePanel.classList.remove("is-active");
    closePanelLocalDrawers(activePanel);
    unlockScroll();
  }
  abortController?.abort();
  abortController = null;
  initialized = false;
  activePanel = null;
  triggerElement = null;
  isClosing = false;
}
