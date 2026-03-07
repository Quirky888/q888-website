let initialized = false;
let abortController: AbortController | null = null;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function revealImmediately() {
  document.querySelectorAll<HTMLElement>("[data-motion-reveal]").forEach((el) => {
    el.classList.add("q888-reveal", "is-revealed");
  });

  document.querySelectorAll<HTMLElement>("[data-motion-stagger]").forEach((group) => {
    group.classList.add("is-revealed");
    const selector = group.getAttribute("data-motion-children") || "[data-motion-item]";
    const items = Array.from(group.querySelectorAll<HTMLElement>(selector));
    items.forEach((item, index) => {
      item.classList.add("q888-reveal-item", "is-revealed");
      item.style.setProperty("--reveal-index", String(index));
    });
  });
}

export function initRevealMotion() {
  if (initialized) return;
  initialized = true;
  abortController = new AbortController();

  document.documentElement.dataset.motionReady = "1";

  if (prefersReducedMotion()) {
    revealImmediately();
    return;
  }

  const { signal } = abortController;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;

        if (target.hasAttribute("data-motion-stagger")) {
          target.classList.add("is-revealed");
          observer.unobserve(target);
          return;
        }

        target.classList.add("is-revealed");
        observer.unobserve(target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12,
    }
  );

  document.querySelectorAll<HTMLElement>("[data-motion-reveal]").forEach((el) => {
    el.classList.add("q888-reveal");
    observer.observe(el);
  });

  document.querySelectorAll<HTMLElement>("[data-motion-stagger]").forEach((group) => {
    const selector = group.getAttribute("data-motion-children") || "[data-motion-item]";
    const items = Array.from(group.querySelectorAll<HTMLElement>(selector));

    items.forEach((item, index) => {
      item.classList.add("q888-reveal-item");
      item.style.setProperty("--reveal-index", String(index));
    });

    observer.observe(group);
  });

  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
}

export function destroyRevealMotion() {
  abortController?.abort();
  abortController = null;
  initialized = false;
}
