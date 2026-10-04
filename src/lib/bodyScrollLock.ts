/** Preserve the page width and the exact declarations owned by this lock. */
export function lockBodyScroll(): () => void {
  const style = document.body.style;
  const properties = ["overflow-x", "overflow-y", "padding-right"];
  const previous = properties.map((property) => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }));
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const padding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
  if (scrollbarWidth > 0) style.setProperty("padding-right", `${padding + scrollbarWidth}px`);
  style.setProperty("overflow", "hidden");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    style.removeProperty("overflow");
    for (const { property, value, priority } of previous) {
      if (value) style.setProperty(property, value, priority);
      else style.removeProperty(property);
    }
  };
}
