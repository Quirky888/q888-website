import { closePortal } from "./infociganPortal";
import { closeDrawerIfOpen } from "./drawerNav";

let initialized = false;
let abortController: AbortController | null = null;

const OVERLAY_CLOSE_DURATION = 700;

function handleScroll(e: Event, link: HTMLAnchorElement) {
  const href = link.getAttribute("href");
  if (!href?.startsWith("#")) return;

  const targetId = href.slice(1);
  const target = document.getElementById(targetId);
  if (!target) return;

  e.preventDefault();

  const hadOverlay =
    !!document.querySelector(".portal-panel.is-active") ||
    !!document.querySelector("[data-drawer-panel].is-active");

  closePortal();
  closeDrawerIfOpen();

  const scrollAndUpdate = () => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", window.location.pathname + window.location.search + href);
  };

  if (hadOverlay) {
    window.setTimeout(scrollAndUpdate, OVERLAY_CLOSE_DURATION);
  } else {
    scrollAndUpdate();
  }
}

function handleClick(e: Event) {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-scroll]");
  if (!link) return;
  handleScroll(e, link);
}

function handleTouchEnd(e: TouchEvent) {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-scroll]");
  if (!link) return;
  e.preventDefault();
  handleScroll(e, link);
}

export function initNavScroll() {
  if (initialized) return;
  initialized = true;
  abortController = new AbortController();
  const { signal } = abortController;

  document.addEventListener("click", handleClick, { capture: true, signal });
  document.addEventListener("touchend", handleTouchEnd, { capture: true, passive: false, signal });
}

export function destroyNavScroll() {
  abortController?.abort();
  abortController = null;
  initialized = false;
}
