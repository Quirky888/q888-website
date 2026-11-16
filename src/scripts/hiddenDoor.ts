// Homepage "hidden door" behaviour: the scroll-opened door, the 8 → ∞ wordmark,
// mycelium threads, the square-bubble cursor, the Earth / Cosmos switch and the Edinburgh clock.
// Every piece is optional: a missing element is skipped, so the script is safe on any page.

const THEME_KEY = "q888-theme";
const MAX_TIPS = 150;

interface Tip {
  x: number;
  y: number;
  angle: number;
  life: number;
}

let controller: AbortController | null = null;
let frameId = 0;
let timers: number[] = [];
let observer: IntersectionObserver | null = null;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Writes scroll progress (0 closed → 1 open) to --p on the hero. */
function initDoor(signal: AbortSignal) {
  const hero = document.querySelector<HTMLElement>("[data-door-hero]");
  if (!hero || reducedMotion()) return;

  let queued = false;
  const update = () => {
    queued = false;
    const span = hero.offsetHeight - window.innerHeight;
    const scrolled = -hero.getBoundingClientRect().top;
    // The door is fully open at 82% of the pinned distance, leaving a beat on the whole artwork.
    const progress = span > 0 ? Math.min(1, Math.max(0, scrolled / (span * 0.82))) : 0;
    hero.style.setProperty("--p", progress.toFixed(4));
  };
  const request = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", request, { passive: true, signal });
  window.addEventListener("resize", request, { signal });
  update();
}

function initWordmark(signal: AbortSignal) {
  const wordmark = document.querySelector<HTMLElement>("[data-door-wordmark]");
  if (!wordmark) return;

  wordmark.addEventListener("pointerenter", () => wordmark.classList.add("is-infinite"), { signal });
  wordmark.addEventListener("pointerleave", () => wordmark.classList.remove("is-infinite"), { signal });

  if (reducedMotion()) return;
  // Now and then the 8s lie down on their own, so touch visitors meet the ∞ too.
  timers.push(
    window.setInterval(() => {
      if (wordmark.matches(":hover")) return;
      wordmark.classList.add("is-infinite");
      timers.push(
        window.setTimeout(() => {
          if (!wordmark.matches(":hover")) wordmark.classList.remove("is-infinite");
        }, 2600),
      );
    }, 7000),
  );
}

/** Thin threads grow up from the bottom edge and lean towards the pointer. */
function initThreads(signal: AbortSignal) {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-door-threads]");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  const tips: Tip[] = [];
  let width = 0;
  let height = 0;
  let pointerX = -1;
  let pointerY = -1;
  let visible = true;
  let frame = 0;

  const resize = () => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const spawn = (x: number, y: number, angle: number) => {
    if (tips.length < MAX_TIPS) tips.push({ x, y, angle, life: 160 + Math.random() * 260 });
  };
  const seed = () => spawn(Math.random() * width, height + 4, -Math.PI / 2 + (Math.random() - 0.5));

  const step = () => {
    // Fade old growth every second frame so the web keeps breathing instead of filling in.
    if (++frame % 2 === 0) {
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, width, height);
    }
    context.globalCompositeOperation = "source-over";
    context.lineWidth = 0.8;
    context.strokeStyle = getComputedStyle(document.body).getPropertyValue("--door-thread");
    context.beginPath();

    for (let i = tips.length - 1; i >= 0; i--) {
      const tip = tips[i];
      tip.angle += (Math.random() - 0.5) * 0.42;
      if (pointerX >= 0) {
        const wanted = Math.atan2(pointerY - tip.y, pointerX - tip.x);
        tip.angle += Math.atan2(Math.sin(wanted - tip.angle), Math.cos(wanted - tip.angle)) * 0.035;
      }
      const nextX = tip.x + Math.cos(tip.angle) * 1.7;
      const nextY = tip.y + Math.sin(tip.angle) * 1.7;
      context.moveTo(tip.x, tip.y);
      context.lineTo(nextX, nextY);
      tip.x = nextX;
      tip.y = nextY;

      if (Math.random() < 0.012) spawn(tip.x, tip.y, tip.angle + (Math.random() < 0.5 ? 0.7 : -0.7));
      const outside = nextX < -20 || nextX > width + 20 || nextY < -20 || nextY > height + 20;
      if (--tip.life < 0 || outside) tips.splice(i, 1);
    }
    context.stroke();
    if (tips.length < 26) seed();
  };

  resize();
  window.addEventListener("resize", resize, { signal });
  for (let i = 0; i < 14; i++) seed();

  if (reducedMotion()) {
    // One still web instead of an animation.
    for (let i = 0; i < 240; i++) step();
    return;
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      const box = canvas.getBoundingClientRect();
      pointerX = event.clientX - box.left;
      pointerY = event.clientY - box.top;
    },
    { passive: true, signal },
  );

  // Rendering stops while the hero is off screen.
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  observer.observe(canvas);

  const loop = () => {
    if (visible) step();
    frameId = window.requestAnimationFrame(loop);
  };
  loop();
}

/** A soft square that follows the pointer and swells over links: Square Bubbles as a cursor. */
function initBubble(signal: AbortSignal) {
  const bubble = document.querySelector<HTMLElement>("[data-door-bubble]");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!bubble || !finePointer || reducedMotion()) return;

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let following = 0;

  const follow = () => {
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    bubble.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    // Stop the loop once the bubble has caught up; the next pointer move restarts it.
    following =
      Math.abs(targetX - x) + Math.abs(targetY - y) > 0.3 ? window.requestAnimationFrame(follow) : 0;
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      bubble.classList.add("is-visible");
      const target = event.target instanceof Element ? event.target : null;
      bubble.classList.toggle("is-large", !!target?.closest("a, button, [data-door-wordmark]"));
      if (!following) following = window.requestAnimationFrame(follow);
    },
    // Capture phase: a component that stops pointer events from bubbling cannot freeze the bubble.
    { passive: true, capture: true, signal },
  );

  // RISK: "pointerleave" on document does not fire reliably when the pointer exits the window,
  // which left the bubble parked at the edge. These three signals cover the real exits.
  const hide = () => bubble.classList.remove("is-visible", "is-large");
  document.documentElement.addEventListener("mouseleave", hide, { signal });
  document.addEventListener(
    "pointerout",
    (event) => {
      if (!event.relatedTarget) hide();
    },
    { signal },
  );
  window.addEventListener("blur", hide, { signal });
  signal.addEventListener("abort", () => window.cancelAnimationFrame(following));
}

function initThemeSwitch(signal: AbortSignal) {
  const button = document.querySelector<HTMLButtonElement>("[data-door-theme]");
  if (!button) return;

  const root = document.documentElement;
  const sync = () => button.setAttribute("aria-pressed", String(root.dataset.qTheme === "cosmos"));

  button.addEventListener(
    "click",
    () => {
      const next = root.dataset.qTheme === "cosmos" ? "earth" : "cosmos";
      root.dataset.qTheme = next;
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // Private windows may refuse storage; the switch still works for this visit.
      }
      sync();
    },
    { signal },
  );
  sync();
}

function initClock() {
  const clock = document.querySelector<HTMLElement>("[data-door-clock]");
  if (!clock) return;

  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  });
  const tick = () => {
    clock.textContent = format.format(new Date());
  };
  tick();
  timers.push(window.setInterval(tick, 15000));
}

export function initHiddenDoor() {
  if (controller) return;
  controller = new AbortController();
  const { signal } = controller;

  initDoor(signal);
  initWordmark(signal);
  initThreads(signal);
  initBubble(signal);
  initThemeSwitch(signal);
  initClock();
}

export function destroyHiddenDoor() {
  controller?.abort();
  controller = null;
  window.cancelAnimationFrame(frameId);
  frameId = 0;
  timers.forEach((id) => {
    window.clearInterval(id);
    window.clearTimeout(id);
  });
  timers = [];
  observer?.disconnect();
  observer = null;
}
