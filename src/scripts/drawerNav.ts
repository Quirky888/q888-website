import gsap from "gsap";
import { setSystemOverride, clearSystemOverride } from "./systemMetaState";

type DrawerId = "digital-ink" | "edinburgh-map";
type Direction = "left" | "right";

let activeDrawer: DrawerId | null = null;
let triggerElement: HTMLElement | null = null;
let focusTrapCleanup: (() => void) | null = null;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getDrawerRoot(): HTMLElement | null {
  return document.querySelector("[data-drawer]");
}

function getDrawerPanel(id: DrawerId): HTMLElement | null {
  return document.querySelector(`[data-drawer-panel="${id}"]`);
}

function lockScroll() {
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  document.body.style.overflow = "";
}

function trapFocus(panel: HTMLElement) {
  const focusable = panel.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    if (focusable.length === 0) return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  panel.addEventListener("keydown", handler);
  first?.focus();

  return () => panel.removeEventListener("keydown", handler);
}

export function openDrawer(id: DrawerId, direction: Direction) {
  const root = getDrawerRoot();
  const panel = getDrawerPanel(id);
  if (!root || !panel) return;

  activeDrawer = id;
  lockScroll();
  setSystemOverride({ system_status: "ENGAGED" });

  root.setAttribute("aria-hidden", "false");
  panel.classList.add("is-active");

  const xFrom = direction === "left" ? "-100%" : "100%";

  if (prefersReducedMotion()) {
    gsap.set(panel, { x: 0, opacity: 1 });
  } else {
    gsap.fromTo(
      panel,
      { x: xFrom, opacity: 0.85 },
      { x: 0, opacity: 1, duration: 0.55, ease: "power1.inOut" }
    );
  }

  focusTrapCleanup = trapFocus(panel);
}

export function closeDrawer(direction: Direction) {
  const root = getDrawerRoot();
  if (!activeDrawer || !root) return;

  const panel = getDrawerPanel(activeDrawer);
  if (!panel) return;

  const xTo = direction === "left" ? "-100%" : "100%";

  const cleanup = () => {
    panel.classList.remove("is-active");
    root.setAttribute("aria-hidden", "true");
    unlockScroll();
    clearSystemOverride();
    focusTrapCleanup?.();
    focusTrapCleanup = null;
    triggerElement?.focus();
    triggerElement = null;
    activeDrawer = null;
  };

  if (prefersReducedMotion()) {
    gsap.set(panel, { x: xTo, opacity: 0 });
    cleanup();
  } else {
    gsap.to(panel, {
      x: xTo,
      opacity: 0.85,
      duration: 0.55,
      ease: "power1.inOut",
      onComplete: cleanup,
    });
  }
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === "Escape" && activeDrawer) {
    const panel = getDrawerPanel(activeDrawer);
    const direction = panel?.dataset.direction as Direction || "left";
    closeDrawer(direction);
  }
}

export function initProjectDrawer() {
  const triggers = document.querySelectorAll<HTMLElement>("[data-drawer-trigger]");
  const closeButtons = document.querySelectorAll<HTMLElement>("[data-drawer-close]");

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const id = trigger.dataset.drawerTrigger as DrawerId;
      const direction = trigger.dataset.navDirection as Direction || "left";
      triggerElement = trigger;
      openDrawer(id, direction);
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const id = trigger.dataset.drawerTrigger as DrawerId;
        const direction = trigger.dataset.navDirection as Direction || "left";
        triggerElement = trigger;
        openDrawer(id, direction);
      }
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!activeDrawer) return;
      const panel = getDrawerPanel(activeDrawer);
      const direction = panel?.dataset.direction as Direction || "left";
      closeDrawer(direction);
    });
  });

  document.addEventListener("keydown", handleEscape);
}
