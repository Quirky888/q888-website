/**
 * graphiteMist.ts
 * Subtle atmospheric mist with a cursor-driven "reveal lens".
 */

let rafId: number | null = null;
let container: HTMLElement | null = null;
let cloudTurbulence: SVGFETurbulenceElement | null = null;
let lensCircle: SVGCircleElement | null = null;
let lensRim: SVGCircleElement | null = null;
let observer: IntersectionObserver | null = null;

let isVisible = false;
let isTouch = false;
let prefersReducedMotion = false;

// Pointer state
let targetX = -1000;
let targetY = -1000;
let currentX = -1000;
let currentY = -1000;
let influence = 0;
let velocity = 0;
let lastTargetX = -1000;
let lastTargetY = -1000;

// Timing
let startTime = 0;

// Config
const LERP_FACTOR = 0.08; // Viscous, heavy lag
const DRIFT_SPEED = 0.00003;
const BASE_RADIUS = 260;
const MAX_RADIUS_BOOST = 60;
const DECAY_RATE = 0.95;

function onPointerMove(e: MouseEvent) {
  if (!container || isTouch || prefersReducedMotion) return;

  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Track even if not intersecting for smooth entry, but only active influence inside
  targetX = x;
  targetY = y;

  if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
    influence = 1;
    
    // Calculate simple velocity for radius modulation
    const dx = targetX - lastTargetX;
    const dy = targetY - lastTargetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    velocity = Math.min(1, velocity + dist * 0.01);
  }
  
  lastTargetX = targetX;
  lastTargetY = targetY;
}

function tick(now: number) {
  rafId = requestAnimationFrame(tick);

  if (!isVisible) return;
  if (!cloudTurbulence || !lensCircle || !lensRim) return;

  const elapsed = (now - startTime) * DRIFT_SPEED;

  if (prefersReducedMotion) {
    cloudTurbulence.setAttribute('baseFrequency', '0.006');
    lensCircle.setAttribute('cx', '-1000');
    lensCircle.setAttribute('cy', '-1000');
    lensRim.setAttribute('cx', '-1000');
    lensRim.setAttribute('cy', '-1000');
    return;
  }

  // Slow drift for the atmosphere
  const cloudFreq = 0.006 + Math.sin(elapsed) * 0.0006;
  cloudTurbulence.setAttribute('baseFrequency', String(cloudFreq));

  // Decay influence and velocity
  influence *= DECAY_RATE;
  velocity *= 0.92;
  if (influence < 0.001) influence = 0;

  // Smooth position tracking (Lerp)
  currentX += (targetX - currentX) * LERP_FACTOR;
  currentY += (targetY - currentY) * LERP_FACTOR;

  // Dynamic radius based on movement
  const dynamicRadius = BASE_RADIUS + (velocity * MAX_RADIUS_BOOST);

  // Update SVG elements
  const cx = String(currentX);
  const cy = String(currentY);
  const r = String(dynamicRadius);

  lensCircle.setAttribute('cx', cx);
  lensCircle.setAttribute('cy', cy);
  lensCircle.setAttribute('r', r);

  lensRim.setAttribute('cx', cx);
  lensRim.setAttribute('cy', cy);
  lensRim.setAttribute('r', r);
}

export function initGraphiteMist() {
  container = document.getElementById('graphite-mist-container');
  cloudTurbulence = document.getElementById('mist-turbulence') as unknown as SVGFETurbulenceElement;
  lensCircle = document.getElementById('lens-circle') as unknown as SVGCircleElement;
  lensRim = document.getElementById('lens-rim') as unknown as SVGCircleElement;

  if (!container || !cloudTurbulence || !lensCircle || !lensRim) return;

  isTouch = window.matchMedia('(pointer: coarse)').matches;
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isTouch && !prefersReducedMotion) {
    window.addEventListener('mousemove', onPointerMove, { passive: true });
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => isVisible = entry.isIntersecting);
  }, { threshold: 0.01 });
  observer.observe(container);

  startTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

export function destroyGraphiteMist() {
  if (rafId) cancelAnimationFrame(rafId);
  window.removeEventListener('mousemove', onPointerMove);
  if (observer) observer.disconnect();
  
  if (lensCircle) {
    lensCircle.setAttribute('cx', '-1000');
    lensCircle.setAttribute('cy', '-1000');
  }
  if (lensRim) {
    lensRim.setAttribute('cx', '-1000');
    lensRim.setAttribute('cy', '-1000');
  }

  container = null;
  cloudTurbulence = null;
  lensCircle = null;
  lensRim = null;
  isVisible = false;
  influence = 0;
}
