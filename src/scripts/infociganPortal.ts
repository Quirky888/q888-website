import gsap from "gsap";

type Direction = "left" | "right";

let activePanel: HTMLElement | null = null;
let originDirection: Direction = "right";
let triggerElement: HTMLElement | null = null;
let initialized = false;
let abortController: AbortController | null = null;

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

function setPanelsAriaHidden(active: HTMLElement | null) {
  const panels = document.querySelectorAll<HTMLElement>("[data-portal-panel]");
  panels.forEach((panel) => {
    if (active) {
      panel.setAttribute("aria-hidden", panel === active ? "false" : "true");
    } else {
      panel.setAttribute("aria-hidden", "false");
    }
  });
}

function focusDialog(panel: HTMLElement) {
  const content = panel.querySelector<HTMLElement>(".panel-content");
  if (!content) return;
  try {
    content.focus({ preventScroll: true });
  } catch {
    content.focus();
  }
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

function getPortalRoot(): HTMLElement | null {
  return document.querySelector(".infocigan-portal-system");
}

function getPanel(slug: string): HTMLElement | null {
  return document.querySelector(`[data-portal-panel="${slug}"]`);
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

export function openPortal(slug: string, direction: Direction) {
  const panel = getPanel(slug);
  if (!panel || activePanel === panel) return;

  activePanel = panel;
  originDirection = direction;
  lockScroll();

  const root = getPortalRoot();
  if (root) {
    root.classList.add("has-active-panel");
  }

  panel.classList.add("is-active");
  panel.setAttribute("data-slide-from", direction);
  setPanelsAriaHidden(panel);
  focusDialog(panel);

  const xFrom = direction === "left" ? "-100%" : "100%";

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

export function closePortal() {
  if (!activePanel) return;

  const panel = activePanel;
  const direction = originDirection;
  const xTo = direction === "left" ? "-100%" : "100%";

  const cleanup = () => {
    panel.classList.remove("is-active");
    setPanelsAriaHidden(null);
    unlockScroll();
    restoreFocus(triggerElement);
    triggerElement = null;
    activePanel = null;

    const root = getPortalRoot();
    if (root) {
      root.classList.remove("has-active-panel");
    }

    // Update URL without jumping (temporarily remove ID)
    const section = document.getElementById("infocigan");
    if (section) section.id = "_temp_infocigan";
    history.pushState(null, "", "#infocigan");
    if (section) section.id = "infocigan";
  };

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

function handleKeydown(e: KeyboardEvent) {
  if (!activePanel) return;
  if (e.key === "Escape") {
    closePortal();
    return;
  }
  if (e.key !== "Tab") return;

  const content = activePanel.querySelector<HTMLElement>(".panel-content");
  if (!content) return;

  const focusable = getFocusable(content);
  if (focusable.length === 0) {
    e.preventDefault();
    focusDialog(activePanel);
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement as HTMLElement | null;
  const isShift = e.shiftKey;

  if (isShift && (current === first || current === content)) {
    e.preventDefault();
    last.focus();
  } else if (!isShift && current === last) {
    e.preventDefault();
    first.focus();
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
  const panels = document.querySelectorAll<HTMLElement>("[data-portal-panel]");

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

  panels.forEach((panel) => {
    panel
      .querySelector(".panel-overlay")
      ?.addEventListener("click", () => closePortal(), { signal });
  });

  document.addEventListener("keydown", handleKeydown, { signal });
  window.addEventListener("popstate", checkHash, { signal });

  // Only check hash on load if it's explicitly an infocigan zone hash
  // Don't auto-open panels on initial load unless user explicitly navigated there
  if (window.location.hash.startsWith("#infocigan-zone-")) {
    checkHash();
  }
}

export function destroyInfociganPortal() {
  if (activePanel) {
    activePanel.classList.remove("is-active");
    unlockScroll();
  }
  abortController?.abort();
  abortController = null;
  initialized = false;
  activePanel = null;
  triggerElement = null;
}
