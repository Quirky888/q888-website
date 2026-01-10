let initialized = false;

function handleClick(e: Event) {
  const link = e.currentTarget as HTMLAnchorElement;
  const href = link.getAttribute("href");
  if (!href?.startsWith("#")) return;

  const targetId = href.slice(1);
  const target = document.getElementById(targetId);
  if (!target) return;

  e.preventDefault();

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
