let observer: IntersectionObserver | null = null;

const animatedElementSelector = "[data-viewport-animation]";

export function initViewportAnimations() {
  observer?.disconnect();

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(animatedElementSelector),
  );
  if (elements.length === 0) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) =>
      element.classList.toggle("is-animation-visible", !reducedMotion.matches),
    );
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          "is-animation-visible",
          entry.isIntersecting,
        );
      });
    },
    {
      // CHOICE: Wake the effect shortly before it enters, so it never starts late.
      rootMargin: "160px 0px",
    },
  );

  elements.forEach((element) => observer!.observe(element));
}

export function destroyViewportAnimations() {
  observer?.disconnect();
  observer = null;

  document
    .querySelectorAll<HTMLElement>(animatedElementSelector)
    .forEach((element) => element.classList.remove("is-animation-visible"));
}
