# Mobile Debug Commands - Quick Reference Card

Copy-paste these into browser console for instant diagnostics.

---

## 🔍 INSTANT DIAGNOSTICS

### System Info
```javascript
console.log('=== SYSTEM INFO ===');
console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);
console.log('Orientation:', window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
console.log('Device Pixel Ratio:', window.devicePixelRatio);
console.log('User Agent:', navigator.userAgent);
console.log('Touch Support:', 'ontouchstart' in window);
```

---

## 🧭 NAVIGATION CHECK

### Check Navigation Visibility
```javascript
console.log('=== NAVIGATION CHECK ===');
const nav = document.querySelector('.slim-nav') || document.querySelector('.top-nav');
if (nav) {
  const styles = getComputedStyle(nav);
  console.log('✅ Nav found');
  console.log('Display:', styles.display);
  console.log('Visibility:', styles.visibility);
  console.log('Opacity:', styles.opacity);
  console.log('Z-index:', styles.zIndex);
  console.log('Position:', styles.position);
  console.log('Background:', styles.background);
} else {
  console.log('❌ Nav NOT found');
}
```

### Check Hamburger Menu
```javascript
console.log('=== HAMBURGER MENU CHECK ===');
const toggle = document.querySelector('.mobile-toggle') || document.querySelector('.slim-toggle');
const links = document.querySelector('[data-nav-links]') || document.querySelector('[data-slim-links]');
console.log('Toggle button:', toggle ? '✅ Found' : '❌ Not found');
console.log('Links container:', links ? '✅ Found' : '❌ Not found');
if (toggle) {
  console.log('Aria-expanded:', toggle.getAttribute('aria-expanded'));
  console.log('Touch action:', getComputedStyle(toggle).touchAction);
}
if (links) {
  console.log('Links display:', getComputedStyle(links).display);
  console.log('Links has "open" class:', links.classList.contains('open'));
}
```

---

## 🗺️ EDINBURGH MAP CHECK

### Check Map Initialization
```javascript
console.log('=== EDINBURGH MAP CHECK ===');
const panel = document.querySelector('[data-drawer-panel="edinburgh-map"]');
const section = document.querySelector('[data-eden-map-section]');
const svg = document.querySelector('[data-eden-map-svg]');
const drawer = document.querySelector('[data-eden-drawer]');

console.log('Panel:', panel ? '✅ Found' : '❌ Not found');
if (panel) {
  console.log('Panel classes:', panel.className);
  console.log('Panel is-active:', panel.classList.contains('is-active'));
}

console.log('Section:', section ? '✅ Found' : '❌ Not found');
console.log('SVG:', svg ? '✅ Found' : '❌ Not found');
console.log('Drawer:', drawer ? '✅ Found' : '❌ Not found');

const hotspots = document.querySelectorAll('.eden-hotspot');
console.log('Hotspots count:', hotspots.length);
```

### Check Map Container Dimensions
```javascript
console.log('=== MAP CONTAINER DIMENSIONS ===');
const mapShell = document.querySelector('.eden-map-shell');
const mapInner = document.querySelector('[data-eden-map-inner]');
const mapImage = document.querySelector('.eden-map-image');

if (mapShell) {
  console.log('Map shell:', {
    width: mapShell.offsetWidth,
    height: mapShell.offsetHeight,
    display: getComputedStyle(mapShell).display
  });
}

if (mapInner) {
  console.log('Map inner:', {
    width: mapInner.offsetWidth,
    height: mapInner.offsetHeight,
    opacity: getComputedStyle(mapInner).opacity,
    transform: getComputedStyle(mapInner).transform
  });
}

if (mapImage) {
  console.log('Map image:', {
    naturalWidth: mapImage.naturalWidth,
    naturalHeight: mapImage.naturalHeight,
    displayWidth: mapImage.offsetWidth,
    displayHeight: mapImage.offsetHeight,
    loaded: mapImage.complete
  });
}
```

### Check Hotspot Touch Properties
```javascript
console.log('=== HOTSPOT TOUCH CHECK ===');
const hotspots = document.querySelectorAll('.eden-hotspot');
if (hotspots.length > 0) {
  console.log('Total hotspots:', hotspots.length);
  const firstHotspot = hotspots[0];
  const styles = getComputedStyle(firstHotspot);
  console.log('First hotspot properties:', {
    pointerEvents: styles.pointerEvents,
    cursor: styles.cursor,
    touchAction: styles.touchAction,
    tapHighlight: styles.webkitTapHighlightColor
  });
  
  const trigger = firstHotspot.querySelector('.hotspot-trigger');
  if (trigger) {
    console.log('Trigger properties:', {
      fill: trigger.getAttribute('fill'),
      stroke: trigger.getAttribute('stroke'),
      r: trigger.getAttribute('r'),
      pointerEvents: getComputedStyle(trigger).pointerEvents
    });
  }
} else {
  console.log('❌ No hotspots found');
}
```

### Test Touch Event Binding
```javascript
console.log('=== TOUCH EVENT TEST ===');
let touchCount = 0;
document.querySelectorAll('.eden-hotspot').forEach((hotspot, i) => {
  hotspot.addEventListener('touchstart', () => {
    touchCount++;
    console.log(`✅ Touch detected on hotspot ${i} (total: ${touchCount})`);
  }, { once: true });
});
console.log('Touch listeners added. Try tapping a hotspot.');
```

---

## 🎯 DRAWER CHECK

### Check Drawer State
```javascript
console.log('=== DRAWER STATE CHECK ===');
const drawer = document.querySelector('[data-eden-drawer]');
if (drawer) {
  console.log('Drawer found:', '✅');
  console.log('Is open:', drawer.classList.contains('is-open'));
  console.log('Aria-hidden:', drawer.getAttribute('aria-hidden'));
  const styles = getComputedStyle(drawer);
  console.log('Height:', styles.height);
  console.log('Bottom:', styles.bottom);
  console.log('Z-index:', styles.zIndex);
} else {
  console.log('❌ Drawer not found');
}
```

### Check Drawer Controls
```javascript
console.log('=== DRAWER CONTROLS CHECK ===');
const closeBtn = document.querySelector('[data-eden-close]');
const navDots = document.querySelector('[data-eden-dots]');

console.log('Close button:', closeBtn ? '✅ Found' : '❌ Not found');
if (closeBtn) {
  console.log('Touch action:', getComputedStyle(closeBtn).touchAction);
  console.log('Size:', closeBtn.offsetWidth, 'x', closeBtn.offsetHeight);
}

console.log('Nav dots:', navDots ? '✅ Found' : '❌ Not found');
if (navDots) {
  const dots = navDots.querySelectorAll('.eden-nav-dot');
  console.log('Dot count:', dots.length);
  if (dots.length > 0) {
    const firstDot = dots[0];
    console.log('First dot size:', firstDot.offsetWidth, 'x', firstDot.offsetHeight);
    console.log('First dot touch action:', getComputedStyle(firstDot).touchAction);
  }
}
```

---

## 🚨 ERROR MONITORING

### Enable Verbose Error Logging
```javascript
console.log('=== ENABLING VERBOSE ERROR LOGGING ===');

window.addEventListener('error', (e) => {
  console.error('❌ ERROR:', {
    message: e.message,
    filename: e.filename,
    line: e.lineno,
    column: e.colno,
    error: e.error
  });
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ UNHANDLED PROMISE:', {
    reason: e.reason,
    promise: e.promise
  });
});

console.log('✅ Error logging enabled');
```

### Check for Console Errors
```javascript
console.log('=== CHECKING FOR ERRORS ===');
console.log('Check above for any [Global Error] or [Unhandled Promise Rejection] messages');
```

---

## 📊 PERFORMANCE CHECK

### Check Load Times
```javascript
console.log('=== PERFORMANCE CHECK ===');
const perfData = performance.getEntriesByType('navigation')[0];
if (perfData) {
  console.log('DOM Content Loaded:', Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart), 'ms');
  console.log('Page Load:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
  console.log('DOM Interactive:', Math.round(perfData.domInteractive - perfData.fetchStart), 'ms');
}

const resources = performance.getEntriesByType('resource');
console.log('Total resources loaded:', resources.length);

const images = resources.filter(r => r.initiatorType === 'img');
console.log('Images loaded:', images.length);
images.forEach(img => {
  console.log(`- ${img.name.split('/').pop()}: ${Math.round(img.duration)}ms`);
});
```

---

## 🔄 ORIENTATION CHANGE TEST

### Monitor Orientation Changes
```javascript
console.log('=== ORIENTATION MONITORING ===');
let orientationCount = 0;

const logOrientation = () => {
  orientationCount++;
  console.log(`Orientation change #${orientationCount}:`, {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    angle: window.screen?.orientation?.angle || 'unknown'
  });
};

window.addEventListener('orientationchange', logOrientation);
window.addEventListener('resize', logOrientation);

console.log('✅ Monitoring orientation changes. Rotate your device.');
```

---

## 🧪 INTERACTIVE TESTS

### Test Navigation Toggle
```javascript
console.log('=== TESTING NAVIGATION TOGGLE ===');
const toggle = document.querySelector('.mobile-toggle') || document.querySelector('.slim-toggle');
if (toggle) {
  console.log('Simulating click...');
  toggle.click();
  setTimeout(() => {
    const links = document.querySelector('[data-nav-links]') || document.querySelector('[data-slim-links]');
    console.log('Menu open:', links?.classList.contains('open') ? '✅ Yes' : '❌ No');
  }, 100);
} else {
  console.log('❌ Toggle button not found');
}
```

### Test Hotspot Click
```javascript
console.log('=== TESTING HOTSPOT CLICK ===');
const hotspots = document.querySelectorAll('.eden-hotspot');
if (hotspots.length > 0) {
  console.log('Clicking first hotspot...');
  hotspots[0].click();
  setTimeout(() => {
    const drawer = document.querySelector('[data-eden-drawer]');
    console.log('Drawer opened:', drawer?.classList.contains('is-open') ? '✅ Yes' : '❌ No');
  }, 100);
} else {
  console.log('❌ No hotspots found');
}
```

---

## 🎨 VISUAL DEBUG MODE

### Highlight All Touch Targets
```javascript
console.log('=== VISUAL DEBUG MODE ===');
const style = document.createElement('style');
style.textContent = `
  .mobile-toggle, .slim-toggle,
  .eden-hotspot,
  .eden-drawer-close,
  .eden-nav-dot {
    outline: 2px solid red !important;
    outline-offset: 2px !important;
  }
  .eden-hotspot .hotspot-trigger {
    fill: rgba(255, 0, 0, 0.1) !important;
    stroke: red !important;
    stroke-width: 2 !important;
  }
`;
document.head.appendChild(style);
console.log('✅ Touch targets highlighted in red');
```

### Show Touch Target Sizes
```javascript
console.log('=== TOUCH TARGET SIZES ===');
const elements = [
  ...document.querySelectorAll('.mobile-toggle, .slim-toggle'),
  ...document.querySelectorAll('.eden-hotspot .hotspot-trigger'),
  ...document.querySelectorAll('.eden-drawer-close'),
  ...document.querySelectorAll('.eden-nav-dot')
];

elements.forEach((el, i) => {
  const rect = el.getBoundingClientRect();
  const minSize = 44;
  const status = (rect.width >= minSize && rect.height >= minSize) ? '✅' : '❌';
  console.log(`${status} Element ${i}:`, Math.round(rect.width), 'x', Math.round(rect.height), 'px');
});
```

---

## 🆘 EMERGENCY RESET

### Clear All Event Listeners (Nuclear Option)
```javascript
console.log('=== EMERGENCY RESET ===');
console.log('⚠️ This will reload the page');
setTimeout(() => {
  window.location.reload();
}, 2000);
```

---

## 📋 FULL DIAGNOSTIC REPORT

### Run Complete Diagnostic
```javascript
console.log('========================================');
console.log('   Q888 MOBILE DIAGNOSTIC REPORT');
console.log('========================================');

// System
console.log('\n📱 SYSTEM:');
console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);
console.log('Orientation:', window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
console.log('Touch:', 'ontouchstart' in window ? '✅' : '❌');

// Navigation
console.log('\n🧭 NAVIGATION:');
const nav = document.querySelector('.slim-nav') || document.querySelector('.top-nav');
console.log('Nav:', nav ? '✅ Found' : '❌ Not found');
if (nav) console.log('Z-index:', getComputedStyle(nav).zIndex);

// Map
console.log('\n🗺️ MAP:');
const panel = document.querySelector('[data-drawer-panel="edinburgh-map"]');
const hotspots = document.querySelectorAll('.eden-hotspot');
console.log('Panel:', panel ? '✅ Found' : '❌ Not found');
console.log('Hotspots:', hotspots.length);

// Drawer
console.log('\n🎯 DRAWER:');
const drawer = document.querySelector('[data-eden-drawer]');
console.log('Drawer:', drawer ? '✅ Found' : '❌ Not found');
if (drawer) console.log('Open:', drawer.classList.contains('is-open') ? '✅' : '❌');

console.log('\n========================================');
console.log('   END DIAGNOSTIC REPORT');
console.log('========================================');
```

---

## 💾 SAVE REPORT

### Copy Report to Clipboard
```javascript
const report = `
Q888 Mobile Debug Report
Date: ${new Date().toISOString()}

Viewport: ${window.innerWidth} x ${window.innerHeight}
Orientation: ${window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'}
User Agent: ${navigator.userAgent}

Navigation: ${document.querySelector('.slim-nav') || document.querySelector('.top-nav') ? 'Found' : 'Not found'}
Map Panel: ${document.querySelector('[data-drawer-panel="edinburgh-map"]') ? 'Found' : 'Not found'}
Hotspots: ${document.querySelectorAll('.eden-hotspot').length}
Drawer: ${document.querySelector('[data-eden-drawer]') ? 'Found' : 'Not found'}
`;

navigator.clipboard.writeText(report).then(() => {
  console.log('✅ Report copied to clipboard');
}).catch(() => {
  console.log('Report:\n', report);
});
```
