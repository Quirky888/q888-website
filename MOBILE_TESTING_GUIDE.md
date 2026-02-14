# Mobile Testing Guide - Quick Reference

## 🚀 Quick Start

1. **Build and run the site:**
   ```bash
   npm run dev
   ```

2. **Access from mobile device:**
   - Find your local IP: `ifconfig | grep "inet "` (Mac/Linux) or `ipconfig` (Windows)
   - On mobile, navigate to: `http://YOUR_IP:4321`

3. **Open browser console on mobile:**
   - **iOS Safari:** Settings → Safari → Advanced → Web Inspector → Connect device via USB
   - **Chrome Android:** chrome://inspect on desktop → Connect device via USB

---

## 📱 Critical Test Scenarios

### Test 1: Navigation Visibility (2 minutes)

**Portrait Mode:**
1. Open site on mobile in portrait
2. ✅ Navigation bar should be visible at top
3. ✅ Tap hamburger menu → menu opens
4. ✅ Tap link → menu closes, navigates correctly

**Landscape Mode:**
1. Rotate to landscape
2. ✅ Navigation bar still visible
3. ✅ Menu still functional

**Console Check:**
```
[Q888] Page loaded
[Q888] Viewport: 393 x 852
```

---

### Test 2: Edinburgh Map - Portrait Loading (3 minutes)

**Steps:**
1. Navigate to Projects section
2. Tap "Edinburgh Magical Map" project
3. Wait for drawer to open
4. **In Portrait Mode:**
   - ✅ Map image loads and displays
   - ✅ Colored glowing hotspots visible
   - ✅ Map fills the container properly

**Console Check:**
```
[Edinburgh Map] Initializing...
[Edinburgh Map] Screen: 393 x 852
[Edinburgh Map] Orientation: portrait
[Edinburgh Map] Panel found
[Edinburgh Map] Panel is active, initializing map...
[Edinburgh Map] Map initialized successfully with X locations
```

---

### Test 3: Location Touch Interaction (3 minutes)

**Steps:**
1. With map open in portrait mode
2. Tap on a glowing hotspot
3. ✅ Drawer slides up from bottom
4. ✅ Location name, emoji, and description appear
5. ✅ No page crash or freeze

**Console Check:**
```
[Edinburgh Map] Opening drawer for location: arthur-seat
[Edinburgh Map] Drawer opened successfully
```

**Test Close:**
1. Tap X button in drawer
2. ✅ Drawer closes smoothly

**Console Check:**
```
[Edinburgh Map] Closing drawer
```

**Test Navigation Dots:**
1. Open a location
2. Tap different dots at bottom of drawer
3. ✅ Content switches between locations

---

### Test 4: Orientation Change (2 minutes)

**Steps:**
1. Open Edinburgh Map in portrait
2. Rotate device to landscape
3. ✅ Map reloads/adjusts correctly
4. ✅ No crash or blank screen
5. Rotate back to portrait
6. ✅ Map still works

**Console Check:**
```
[Edinburgh Map] Resize/orientation change detected
[Edinburgh Map] New dimensions: 852 x 393
[Edinburgh Map] New orientation: landscape
[Edinburgh Map] Map refreshed after orientation change
```

---

## 🐛 Common Issues & Solutions

### Issue: Navigation not visible
**Check:**
```javascript
console.log('Nav element:', document.querySelector('.slim-nav'));
console.log('Nav z-index:', getComputedStyle(document.querySelector('.slim-nav')).zIndex);
```
**Expected:** Element exists, z-index = 1000

---

### Issue: Map not loading in portrait
**Check:**
```javascript
console.log('Panel:', document.querySelector('[data-drawer-panel="edinburgh-map"]'));
console.log('Panel classes:', document.querySelector('[data-drawer-panel="edinburgh-map"]').className);
console.log('SVG:', document.querySelector('[data-eden-map-svg]'));
console.log('Hotspots:', document.querySelectorAll('.eden-hotspot').length);
```
**Expected:** Panel has class `is-active`, SVG exists, hotspots > 0

---

### Issue: Touch not working on hotspots
**Check:**
```javascript
document.querySelectorAll('.eden-hotspot').forEach((el, i) => {
  console.log(`Hotspot ${i}:`, {
    pointerEvents: getComputedStyle(el).pointerEvents,
    cursor: getComputedStyle(el).cursor,
    touchAction: getComputedStyle(el).touchAction
  });
});
```
**Expected:** pointerEvents = 'auto', touchAction = 'manipulation'

---

### Issue: Page crashes on touch
**Check console for:**
```
[Global Error] ...
[Unhandled Promise Rejection] ...
```
**Action:** Screenshot error, check edinburghMap.ts line numbers

---

## 📊 Device Test Matrix

### Priority 1 (Must Test)
- [ ] iPhone 14 Pro (393x852) - Portrait
- [ ] iPhone 14 Pro (393x852) - Landscape
- [ ] iPhone SE (375x667) - Portrait
- [ ] Samsung Galaxy S21 (360x800) - Portrait

### Priority 2 (Should Test)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] iPad (768x1024)
- [ ] Google Pixel 7 (412x915)

### Priority 3 (Nice to Test)
- [ ] Various Android devices
- [ ] Tablet landscape modes
- [ ] Older iOS devices (iOS 14+)

---

## 🔍 Browser DevTools Mobile Emulation

**Chrome DevTools:**
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Select device: iPhone 14 Pro
3. Test in both portrait and landscape
4. Check "Show media queries" to see breakpoints

**Responsive Breakpoints:**
- Mobile: 0-767px
- Tablet: 768-1023px
- Desktop: 1024px+

**Portrait Detection:**
```css
@media (orientation: portrait) and (max-width: 768px) {
  /* Portrait mobile styles */
}
```

---

## 📝 Test Report Template

```
Date: ___________
Device: ___________
OS: ___________
Browser: ___________

Navigation Visibility: ✅ / ❌
Navigation Touch: ✅ / ❌
Map Loads (Portrait): ✅ / ❌
Map Loads (Landscape): ✅ / ❌
Hotspot Touch: ✅ / ❌
Drawer Opens: ✅ / ❌
Drawer Closes: ✅ / ❌
Orientation Change: ✅ / ❌
Console Errors: ✅ None / ❌ See below

Errors:
___________

Notes:
___________
```

---

## 🎯 Success Criteria

All must pass:
- ✅ Navigation visible on all devices/orientations
- ✅ Map loads in portrait mode
- ✅ Touch events work without crashes
- ✅ Orientation changes handled smoothly
- ✅ No console errors
- ✅ All touch targets ≥ 44x44px
- ✅ No horizontal scroll

---

## 🆘 Emergency Rollback

If critical issues found:
```bash
git stash
git checkout jan25-stable
npm run dev
```

Then report issues with:
- Device/OS/Browser
- Console logs
- Screenshots/screen recording

---

## 📧 Support

Issues? Check console for debug logs with prefixes:
- `[Q888]` - Global/page-level
- `[Edinburgh Map]` - Map-specific
- `[Global Error]` - JavaScript errors

Email: hello@q888.space
