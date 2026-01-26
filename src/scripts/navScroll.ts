let initialized = false;

function handleClick(e: Event) {
  const link = e.currentTarget as HTMLAnchorElement;
  const href = link.getAttribute("href");
  if (!href?.startsWith("#")) return;

  const targetId = href.slice(1);
  const target = document.getElementById(targetId);
  if (!target) return;

  e.preventDefault();

  // Close any open portal panels before navigating to non-infocigan sections
  const activePanel = document.querySelector(".portal-panel.is-active");
  if (activePanel && !href.startsWith("#infocigan")) {
    // Manually close portal
    activePanel.classList.remove("is-active");
    const portalSystem = document.querySelector(".infocigan-portal-system");
    if (portalSystem) {
      const panels = portalSystem.querySelectorAll(".portal-panel");
      panels.forEach((panel) => {
        panel.setAttribute("aria-hidden", "true");
      });
    }
    // Unlock scroll
    if (window.__q888ScrollLock) {
      const lockState = window.__q888ScrollLock;
      if (lockState.count > 0) {
        document.body.style.overflow = lockState.previousOverflow;
        document.body.style.paddingRight = lockState.previousPaddingRight;
        lockState.count = 0;
      }
    }
    // Update URL to remove infocigan zone hash
    if (window.location.hash.startsWith("#infocigan-zone-")) {
      history.pushState(null, "", "#infocigan");
    }
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  history.pushState(null, "", href);
}

export function initNavScroll() {
  if (initialized) return;
  initialized = true;

  document.querySelectorAll<HTMLAnchorElement>("[data-scroll]").forEach((link) => {
    link.addEventListener("click", handleClick);
  });
}

export function destroyNavScroll() {
  document.querySelectorAll<HTMLAnchorElement>("[data-scroll]").forEach((link) => {
    link.removeEventListener("click", handleClick);
  });
  initialized = false;
}
