export function initThresholdMotion() {
  const wrapper = document.querySelector('[data-threshold="projects"]');
  if (!wrapper) return;

  const overlays = wrapper.querySelectorAll(".threshold-overlay");
  if (overlays.length === 0) return;

  overlays.forEach((el) => {
    (el as HTMLElement).style.opacity = "1";
    (el as HTMLElement).style.filter = "none";
  });
}
