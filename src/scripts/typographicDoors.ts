type DoorKind = "murmur" | "signal" | "trail" | "portal";
type AutoMode = "murmur" | "signal";

const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const compactViewportQuery = window.matchMedia("(max-width: 768px)");

// DNA: five possible doors wake per visit, but only one or two may move by
// themselves. "Artist CV" remains a reliable first specimen; the other trail,
// portal and murmurs vary so the page never presents its whole secret at once.
const autoPlan: AutoMode[] = ["murmur", "signal"];
let pageRoot: HTMLElement | null = null;
let allDoorElements: HTMLElement[] = [];
let awakeDoors: HTMLElement[] = [];
let activeElements: HTMLElement[] = [];
let currentDoor: HTMLElement | null = null;
let autoTimer: number | null = null;
let hideTimer: number | null = null;
let metricTimer: number | null = null;
let autoPlanIndex = 0;
let lastActivity = Date.now();
let listenerCleanup: Array<() => void> = [];
const effectTimers = new Set<number>();
const revealedDoorIds = new Set<string>();

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function randomDelay(minimum: number, maximum: number) {
  return Math.round(minimum + Math.random() * (maximum - minimum));
}

function getDoorKind(element: HTMLElement) {
  return (element.dataset.doorKind ?? "murmur") as DoorKind;
}

function getGlyphs(element: HTMLElement) {
  return Array.from(
    element.querySelectorAll<HTMLElement>("[data-door-glyph]"),
  );
}

function getRevealGlyphs(element: HTMLElement) {
  return Array.from(
    element.querySelectorAll<HTMLElement>("[data-door-reveal-glyph]"),
  );
}

function getMorphGlyphs(element: HTMLElement) {
  return [...getGlyphs(element), ...getRevealGlyphs(element)];
}

function normalizeDoorText(element: HTMLElement) {
  const words = Array.from(
    element.querySelectorAll<HTMLElement>(":scope > .q888-door__word"),
  );

  words.forEach((word) => {
    getGlyphs(word).forEach((glyph) => {
      const ink = glyph.querySelector<HTMLElement>(".q888-door__ink");
      if (ink) ink.textContent = ink.textContent?.trim() ?? "";
      Array.from(glyph.childNodes)
        .filter(
          (node) =>
            node.nodeType === Node.TEXT_NODE && !node.textContent?.trim(),
        )
        .forEach((node) => node.remove());
    });
    Array.from(word.childNodes)
      .filter(
        (node) => node.nodeType === Node.TEXT_NODE && !node.textContent?.trim(),
      )
      .forEach((node) => node.remove());
  });

  Array.from(element.childNodes)
    .filter(
      (node) => node.nodeType === Node.TEXT_NODE && !node.textContent?.trim(),
    )
    .forEach((node) => node.remove());
  words.slice(1).forEach((word) => {
    element.insertBefore(document.createTextNode(" "), word);
  });
}

function stableNumber(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

function selectAwakeDoors(triggers: HTMLElement[]) {
  const selected: HTMLElement[] = [];
  const usedZones = new Set<string>();

  const add = (door: HTMLElement | undefined) => {
    if (!door || selected.includes(door)) return;
    selected.push(door);
    const zone = door.dataset.doorZone;
    if (zone) usedZones.add(zone);
  };

  add(triggers.find((door) => door.dataset.doorPinned === "true"));

  add(
    shuffled(
      triggers.filter(
        (door) =>
          getDoorKind(door) === "signal" &&
          door.dataset.doorPinned !== "true" &&
          !usedZones.has(door.dataset.doorZone ?? ""),
      ),
    )[0],
  );

  add(
    shuffled(
      triggers.filter(
        (door) =>
          getDoorKind(door) === "portal" &&
          !usedZones.has(door.dataset.doorZone ?? ""),
      ),
    )[0] ??
      shuffled(triggers.filter((door) => getDoorKind(door) === "portal"))[0],
  );

  shuffled(
    triggers.filter((door) => getDoorKind(door) === "murmur"),
  ).forEach((door) => {
    if (selected.length >= 5) return;
    if (usedZones.has(door.dataset.doorZone ?? "")) return;
    add(door);
  });

  if (selected.length < 5) {
    shuffled(triggers)
      .filter((door) => !selected.includes(door))
      .slice(0, 5 - selected.length)
      .forEach(add);
  }

  return selected.slice(0, 5);
}

function clearAutoTimer() {
  if (autoTimer !== null) {
    window.clearTimeout(autoTimer);
    autoTimer = null;
  }
}

function clearHideTimer() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function clearEffectTimers() {
  effectTimers.forEach((timer) => window.clearTimeout(timer));
  effectTimers.clear();
}

function later(callback: () => void, delay: number) {
  const timer = window.setTimeout(() => {
    effectTimers.delete(timer);
    callback();
  }, delay);
  effectTimers.add(timer);
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 64 &&
    rect.top < window.innerHeight - 40 &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

function clearVisualState() {
  activeElements.forEach((element) => {
    element.classList.remove("is-active");
    getMorphGlyphs(element).forEach((glyph) =>
      glyph.classList.remove("is-door-family", "is-door-weight"),
    );
  });
  activeElements = [];
  if (currentDoor?.dataset.doorKind === "signal") {
    currentDoor.setAttribute("aria-pressed", "false");
  }
  currentDoor = null;
}

function stopCurrentImmediately() {
  clearHideTimer();
  clearEffectTimers();
  clearVisualState();
}

function scheduleAuto(firstAppearance = false) {
  clearAutoTimer();
  const maxAppearances = compactViewportQuery.matches ? 1 : 2;
  if (
    reducedMotionQuery.matches ||
    document.hidden ||
    autoPlanIndex >= maxAppearances ||
    !awakeDoors.length
  ) {
    return;
  }

  const delay = firstAppearance
    ? randomDelay(14_000, 22_000)
    : randomDelay(28_000, 45_000);
  autoTimer = window.setTimeout(attemptAuto, delay);
}

function scheduleRetry() {
  clearAutoTimer();
  autoTimer = window.setTimeout(attemptAuto, randomDelay(5_000, 8_000));
}

function animateOrganicCluster(element: HTMLElement, baseDelay = 0) {
  const glyphs = getGlyphs(element);
  if (!glyphs.length) return;

  const seed = stableNumber(element.dataset.doorId ?? element.textContent ?? "q");
  const clusterLength = Math.min(
    glyphs.length,
    Math.max(2, Math.min(5, Math.ceil(glyphs.length * 0.34))),
  );
  const start = seed % Math.max(1, glyphs.length - clusterLength + 1);
  const cluster = glyphs.slice(start, start + clusterLength);
  const familyIndex = Math.floor(cluster.length / 2);

  cluster.forEach((glyph, index) => {
    later(() => glyph.classList.add("is-door-weight"), baseDelay + index * 54);
  });

  later(
    () => cluster[familyIndex]?.classList.add("is-door-family"),
    baseDelay + 150 + familyIndex * 54,
  );
}

function animateRevealCluster(element: HTMLElement, baseDelay = 90) {
  const glyphs = getRevealGlyphs(element);
  if (!glyphs.length) return;

  const seed = stableNumber(`${element.dataset.doorId ?? "q"}:reveal`);
  const clusterLength = Math.min(
    glyphs.length,
    Math.max(2, Math.min(5, Math.ceil(glyphs.length * 0.34))),
  );
  const start = seed % Math.max(1, glyphs.length - clusterLength + 1);
  const cluster = glyphs.slice(start, start + clusterLength);
  const familyIndex = Math.floor(cluster.length / 2);

  cluster.forEach((glyph, index) => {
    later(() => glyph.classList.add("is-door-weight"), baseDelay + index * 54);
  });

  later(
    () => cluster[familyIndex]?.classList.add("is-door-family"),
    baseDelay + 150 + familyIndex * 54,
  );
}

function animateTrailWord(element: HTMLElement, baseDelay: number) {
  const glyphs = getGlyphs(element);
  if (!glyphs.length) return;

  if (element.dataset.doorStrength === "spill") {
    const edge = stableNumber(element.dataset.doorId ?? "q") % glyphs.length;
    later(() => glyphs[edge]?.classList.add("is-door-weight"), baseDelay);
    return;
  }

  glyphs.forEach((glyph, index) => {
    later(() => glyph.classList.add("is-door-weight"), baseDelay + index * 22);
  });

  const seed = stableNumber(element.dataset.doorId ?? element.textContent ?? "q");
  const familyGlyph = glyphs[seed % glyphs.length];
  later(
    () => familyGlyph?.classList.add("is-door-family"),
    baseDelay + 135,
  );
}

function getSignalElements(trigger: HTMLElement) {
  const group = trigger.dataset.doorGroup;
  if (!group) return [trigger];

  const members = allDoorElements.filter(
    (element) =>
      element.dataset.doorGroup === group &&
      getDoorKind(element) === "trail",
  );
  return [trigger, ...members];
}

function beginDissolve(scheduleNext = true) {
  clearHideTimer();
  clearEffectTimers();

  const glyphs = activeElements
    .flatMap(getMorphGlyphs)
    .filter(
      (glyph) =>
        glyph.classList.contains("is-door-family") ||
        glyph.classList.contains("is-door-weight"),
    )
    .reverse();

  glyphs.forEach((glyph, index) => {
    later(() => glyph.classList.remove("is-door-family"), index * 14);
    later(() => glyph.classList.remove("is-door-weight"), 90 + index * 14);
  });

  const finishAfter = Math.min(620, 160 + glyphs.length * 14);
  later(() => {
    clearVisualState();
    if (scheduleNext) scheduleAuto(false);
  }, finishAfter);
}

function getDuration(kind: DoorKind) {
  if (kind === "signal") return 3_800;
  if (kind === "portal") return 3_000;
  return 2_700;
}

function activate(element: HTMLElement, holdForFocus = false) {
  if (!element.classList.contains("is-awake")) return;

  lastActivity = Date.now();
  clearAutoTimer();

  if (currentDoor === element) {
    clearHideTimer();
  } else {
    stopCurrentImmediately();
    currentDoor = element;
    const kind = getDoorKind(element);
    activeElements =
      kind === "signal" ? getSignalElements(element) : [element];
    activeElements.forEach((activeElement) =>
      activeElement.classList.add("is-active"),
    );

    animateOrganicCluster(element);
    animateRevealCluster(element);
    if (kind === "signal") {
      element.setAttribute("aria-pressed", "true");
      activeElements.slice(1).forEach((member, index) => {
        animateTrailWord(member, 170 + index * 125);
      });
    }

    const doorId = element.dataset.doorId;
    if (doorId) revealedDoorIds.add(doorId);
  }

  if (holdForFocus) return;
  hideTimer = window.setTimeout(
    () => beginDissolve(true),
    getDuration(getDoorKind(element)),
  );
}

function signalIsVisible(trigger: HTMLElement) {
  const visibleMembers = getSignalElements(trigger).filter(isVisible);
  return visibleMembers.length >= Math.min(3, getSignalElements(trigger).length);
}

function attemptAuto() {
  autoTimer = null;
  const maxAppearances = compactViewportQuery.matches ? 1 : 2;
  if (
    reducedMotionQuery.matches ||
    document.hidden ||
    autoPlanIndex >= maxAppearances
  ) {
    return;
  }

  if (currentDoor || Date.now() - lastActivity < 3_500) {
    scheduleRetry();
    return;
  }

  const mode = autoPlan[autoPlanIndex];
  let candidates = awakeDoors.filter(
    (door) =>
      getDoorKind(door) === mode &&
      isVisible(door) &&
      !revealedDoorIds.has(door.dataset.doorId ?? "") &&
      (mode !== "signal" || signalIsVisible(door)),
  );

  if (!candidates.length) {
    candidates = awakeDoors.filter(
      (door) =>
        getDoorKind(door) === "murmur" &&
        isVisible(door) &&
        !revealedDoorIds.has(door.dataset.doorId ?? ""),
    );
  }

  const choice = shuffled(candidates)[0];
  if (!choice) {
    scheduleRetry();
    return;
  }

  autoPlanIndex += 1;
  activate(choice);
}

function navigate(element: HTMLElement) {
  const href = element.dataset.doorHref;
  if (href) window.location.assign(href);
}

function awaken(element: HTMLElement) {
  const kind = getDoorKind(element);
  element.classList.add("is-awake");

  if (kind === "signal") {
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-pressed", "false");
  }

  if (kind === "portal") {
    element.tabIndex = 0;
    element.setAttribute("role", "link");
  }

  const onPointerEnter = () => activate(element);
  const onPointerLeave = () => {
    if (currentDoor !== element) return;
    clearHideTimer();
    hideTimer = window.setTimeout(() => beginDissolve(true), 900);
  };
  const onFocus = () => activate(element, true);
  const onBlur = () => {
    if (currentDoor === element) beginDissolve(true);
  };
  const onClick = () => {
    if (kind === "portal") {
      navigate(element);
      return;
    }
    activate(element);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (kind === "portal" && event.key === "Enter") {
      event.preventDefault();
      navigate(element);
      return;
    }
    if (kind !== "signal") return;
    event.preventDefault();
    activate(element, true);
  };

  element.addEventListener("pointerenter", onPointerEnter);
  element.addEventListener("pointerleave", onPointerLeave);
  element.addEventListener("focus", onFocus);
  element.addEventListener("blur", onBlur);
  element.addEventListener("click", onClick);
  element.addEventListener("keydown", onKeyDown);
  listenerCleanup.push(() => {
    element.removeEventListener("pointerenter", onPointerEnter);
    element.removeEventListener("pointerleave", onPointerLeave);
    element.removeEventListener("focus", onFocus);
    element.removeEventListener("blur", onBlur);
    element.removeEventListener("click", onClick);
    element.removeEventListener("keydown", onKeyDown);
  });
}

function lockGlyphMetrics() {
  if (!pageRoot) return;
  const glyphs = allDoorElements.flatMap(getMorphGlyphs);
  glyphs.forEach((glyph) =>
    glyph.style.removeProperty("--q888-door-glyph-width"),
  );
  const widths = glyphs.map((glyph) => glyph.getBoundingClientRect().width);
  glyphs.forEach((glyph, index) => {
    const width = widths[index];
    if (width > 0) {
      glyph.style.setProperty("--q888-door-glyph-width", `${width.toFixed(3)}px`);
    }
  });
}

function scheduleMetricLock() {
  stopCurrentImmediately();
  if (metricTimer !== null) window.clearTimeout(metricTimer);
  metricTimer = window.setTimeout(() => {
    metricTimer = null;
    lockGlyphMetrics();
  }, 160);
}

function markActivity() {
  lastActivity = Date.now();
}

function handleVisibilityChange() {
  clearAutoTimer();
  if (!document.hidden) {
    lastActivity = Date.now();
    scheduleAuto(false);
  }
}

function handlePreferenceChange() {
  clearAutoTimer();
  stopCurrentImmediately();
  lastActivity = Date.now();
  if (!reducedMotionQuery.matches) scheduleAuto(true);
}

function resetDoor(door: HTMLElement) {
  door.classList.remove("is-awake", "is-active");
  door.removeAttribute("tabindex");
  door.removeAttribute("role");
  door.removeAttribute("aria-pressed");
  getMorphGlyphs(door).forEach((glyph) =>
    glyph.classList.remove("is-door-family", "is-door-weight"),
  );
}

export function initTypographicDoors() {
  const nextRoot = document.querySelector<HTMLElement>(
    "[data-q888-door-root]",
  );
  if (!nextRoot || (pageRoot === nextRoot && awakeDoors.length)) return;

  cleanupTypographicDoors();
  pageRoot = nextRoot;
  autoPlanIndex = 0;
  lastActivity = Date.now();
  revealedDoorIds.clear();

  allDoorElements = Array.from(
    nextRoot.querySelectorAll<HTMLElement>("[data-q888-door]"),
  );
  allDoorElements.forEach(normalizeDoorText);
  allDoorElements.forEach(resetDoor);

  const triggers = allDoorElements.filter(
    (door) => getDoorKind(door) !== "trail",
  );
  awakeDoors = selectAwakeDoors(triggers);
  awakeDoors.forEach(awaken);

  window.requestAnimationFrame(lockGlyphMetrics);
  document.fonts?.ready.then(() => {
    if (pageRoot === nextRoot) lockGlyphMetrics();
  });

  window.addEventListener("scroll", markActivity, { passive: true });
  window.addEventListener("pointermove", markActivity, { passive: true });
  window.addEventListener("touchstart", markActivity, { passive: true });
  window.addEventListener("resize", scheduleMetricLock, { passive: true });
  document.fonts?.addEventListener("loadingdone", scheduleMetricLock);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  reducedMotionQuery.addEventListener("change", handlePreferenceChange);
  compactViewportQuery.addEventListener("change", handlePreferenceChange);
  scheduleAuto(true);
}

export function cleanupTypographicDoors() {
  clearAutoTimer();
  clearHideTimer();
  clearEffectTimers();
  if (metricTimer !== null) {
    window.clearTimeout(metricTimer);
    metricTimer = null;
  }
  clearVisualState();
  listenerCleanup.forEach((cleanup) => cleanup());
  listenerCleanup = [];
  allDoorElements.forEach(resetDoor);
  awakeDoors = [];
  allDoorElements = [];
  pageRoot = null;
  window.removeEventListener("scroll", markActivity);
  window.removeEventListener("pointermove", markActivity);
  window.removeEventListener("touchstart", markActivity);
  window.removeEventListener("resize", scheduleMetricLock);
  document.fonts?.removeEventListener("loadingdone", scheduleMetricLock);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  reducedMotionQuery.removeEventListener("change", handlePreferenceChange);
  compactViewportQuery.removeEventListener("change", handlePreferenceChange);
}
