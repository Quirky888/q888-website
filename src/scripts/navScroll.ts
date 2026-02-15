import { closePortal } from "./infociganPortal";
import { closeDrawerIfOpen } from "./drawerNav";

let initialized = false;

const OVERLAY_CLOSE_DURATION = 700;

function handleScroll(e: Event) {
  const link = e.currentTarget as HTMLAnchorElement;
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
    history.pushState(null, "", href);
  };

  if (hadOverlay) {
    window.setTimeout(scrollAndUpdate, OVERLAY_CLOSE_DURATION);
  } else {
    scrollAndUpdate();
  }
}

function handleTouchEnd(e: TouchEvent) {
  e.preventDefault();
  handleScroll(e);
}

export function initNavScroll() {
  if (initialized) return;
  initialized = true;

  document.querySelectorAll<HTMLAnchorElement>("[data-scroll]").forEach((link) => {
    link.addEventListener("click", handleScroll);
    link.addEventListener("touchend", handleTouchEnd, { passive: false });
  });
}

export function destroyNavScroll() {
  document.querySelectorAll<HTMLAnchorElement>("[data-scroll]").forEach((link) => {
    link.removeEventListener("click", handleScroll);
    link.removeEventListener("touchend", handleTouchEnd);
  });
  initialized = false;
}
