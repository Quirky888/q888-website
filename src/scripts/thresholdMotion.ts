import { gsap } from "gsap";
import { createCenterReveal } from "./centerReveal";

export function initThresholdMotion() {
  const wrapper = document.querySelector('[data-threshold="projects"]');
  if (!wrapper) return;

  const overlays = wrapper.querySelectorAll(".threshold-overlay");
  if (overlays.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    gsap.set(overlays, { opacity: 1, filter: "blur(0px)" });
    return;
  }

  createCenterReveal({ trigger: wrapper, targets: overlays });
}
