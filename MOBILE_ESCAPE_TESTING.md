# Mobile Escape Mechanisms - Quick Testing Guide

## 🚀 Quick Test (2 minutes)

### Test 1: Edinburgh Map Drawer Escape
1. Open site on mobile
2. Navigate to Projects → Edinburgh Magical Map
3. Tap a glowing hotspot
4. **Try ALL escape methods:**
   - ✅ Tap X button (top right) → drawer closes
   - ✅ Swipe down from top → drawer closes
   - ✅ Tap on map (outside drawer) → drawer closes
   - ✅ Tap floating home button (bottom right) → returns home

### Test 2: Floating Home Button
1. On mobile, look for floating black circle (bottom right)
2. ✅ Button visible on all pages
3. ✅ Tap button → returns to home
4. ✅ Button has visual feedback (shrinks on press)

### Test 3: Navigation Menu
1. Tap hamburger menu (top right)
2. Tap any link
3. ✅ Menu closes automatically
4. ✅ Navigates to section

---

## 📋 Detailed Test Scenarios

### Scenario A: User Opens Edinburgh Map Location

**Steps:**
1. Mobile portrait mode
2. Open Edinburgh Map project
3. Tap a hotspot (e.g., Arthur's Seat)
4. Drawer slides up from bottom

**Test Escape Methods:**

#### Method 1: Close Button
- **Action:** Tap X button (top right of drawer)
- **Expected:** Drawer closes smoothly
- **Visual Check:** Button is 48x48px, dark background, clearly visible
- **Console:** `[Edinburgh Map] Closing drawer`

#### Method 2: Swipe Down
- **Action:** Swipe down from top of drawer
- **Expected:** Drawer follows finger, closes if >100px or fast swipe
- **Visual Check:** Drawer moves with finger, handle visible at top
- **Console:** `[Edinburgh Map] Closing drawer`

#### Method 3: Tap Outside
- **Action:** Tap on map area (not on drawer)
- **Expected:** Drawer closes
- **Console:** `[Edinburgh Map] Closing drawer`

#### Method 4: Floating Home Button
- **Action:** Tap black floating button (bottom right)
- **Expected:** Returns to home page
- **Visual Check:** Button visible, shrinks on press

---

### Scenario B: User Opens Project Drawer (Digital Ink)

**Steps:**
1. Mobile portrait mode
2. Tap "Digital Ink" project card
3. Drawer slides in from left

**Test Escape Methods:**

#### Method 1: Back Button
- **Action:** Tap "Back to Projects" (top left)
- **Expected:** Drawer closes, returns to projects
- **Console:** No specific log (normal behavior)

#### Method 2: Click Outside
- **Action:** Tap on dark backdrop (not on drawer content)
- **Expected:** Drawer closes
- **Console:** No specific log

#### Method 3: Floating Home Button
- **Action:** Tap floating home button
- **Expected:** Returns to home
- **Visual Check:** Button accessible even with drawer open

---

### Scenario C: User Opens Navigation Menu

**Steps:**
1. Mobile portrait mode
2. Tap hamburger menu (top right)
3. Menu drops down

**Test Escape Methods:**

#### Method 1: Select Link
- **Action:** Tap any navigation link
- **Expected:** Menu closes, navigates to section
- **Visual Check:** Menu closes smoothly

#### Method 2: Tap Hamburger Again
- **Action:** Tap hamburger icon
- **Expected:** Menu closes
- **Visual Check:** Icon animates

#### Method 3: Floating Home Button
- **Action:** Tap floating home button
- **Expected:** Returns to home (menu may stay open)

---

## 🎯 Critical Checks

### Close Button Visibility (Edinburgh Map)
```javascript
const closeBtn = document.querySelector('[data-eden-close]');
console.log('Size:', closeBtn.offsetWidth, 'x', closeBtn.offsetHeight);
// Expected: 48 x 48 (or 60 x 60 in portrait)

console.log('Background:', getComputedStyle(closeBtn).background);
// Expected: rgba(0, 0, 0, 0.1) or darker

console.log('Z-index:', getComputedStyle(closeBtn).zIndex);
// Expected: 100 or higher
```

### Floating Home Button
```javascript
const homeBtn = document.querySelector('.mobile-home-btn');
console.log('Visible:', homeBtn ? 'Yes' : 'No');
console.log('Display:', getComputedStyle(homeBtn.parentElement).display);
// Expected: 'flex' on mobile, 'none' on desktop

console.log('Size:', homeBtn.offsetWidth, 'x', homeBtn.offsetHeight);
// Expected: 56 x 56 (or 60 x 60 in portrait)

console.log('Z-index:', getComputedStyle(homeBtn.parentElement).zIndex);
// Expected: 9999
```

### Swipe Handle
```javascript
const handle = document.querySelector('.eden-drawer-handle');
console.log('Handle visible:', handle ? 'Yes' : 'No');
console.log('Display:', getComputedStyle(handle).display);
// Expected: 'block' on mobile, 'none' on desktop
```

---

## 🐛 Troubleshooting

### Issue: Close button not visible
**Check:**
```javascript
const btn = document.querySelector('[data-eden-close]');
console.log('Exists:', btn ? 'Yes' : 'No');
console.log('Opacity:', getComputedStyle(btn).opacity);
console.log('Display:', getComputedStyle(btn).display);
console.log('Visibility:', getComputedStyle(btn).visibility);
```

### Issue: Swipe not working
**Check:**
```javascript
const drawer = document.querySelector('[data-eden-drawer]');
console.log('Drawer exists:', drawer ? 'Yes' : 'No');
// Try swiping - check console for errors
```

### Issue: Floating home button not visible
**Check:**
```javascript
const nav = document.querySelector('[data-mobile-escape-nav]');
console.log('Nav exists:', nav ? 'Yes' : 'No');
console.log('Display:', getComputedStyle(nav).display);
console.log('Viewport width:', window.innerWidth);
// Should show 'flex' if width < 768px
```

### Issue: Click outside not working
**Check:**
```javascript
// Open drawer, then:
console.log('Active drawer:', document.querySelector('.drawer-panel.is-active'));
// Tap outside - should close
```

---

## ✅ Success Criteria

### Must Pass All:
- [ ] Close button visible (dark background, 48x48px+)
- [ ] Swipe down closes drawer (>100px or fast)
- [ ] Tap outside closes drawer
- [ ] Floating home button visible on mobile
- [ ] Floating home button works from any state
- [ ] Navigation menu closes after link selection
- [ ] No user can get "trapped"
- [ ] All touch targets ≥48px
- [ ] Visual feedback on all interactions

---

## 📱 Device Testing Matrix

### Priority 1 (Must Test)
- [ ] iPhone 14 Pro (393x852) - Portrait
- [ ] iPhone SE (375x667) - Portrait
- [ ] Samsung Galaxy S21 (360x800) - Portrait

### Test Each Device:
1. Edinburgh map drawer (all 4 escape methods)
2. Project drawer (all 3 escape methods)
3. Navigation menu (all 3 escape methods)
4. Floating home button (from every state)

---

## 🎨 Visual Checks

### Edinburgh Map Drawer
- [ ] Handle visible at top (gray bar)
- [ ] Close button has dark background
- [ ] Close button shrinks on press
- [ ] Drawer follows finger during swipe
- [ ] Smooth animations

### Floating Home Button
- [ ] Black circle with home icon
- [ ] Bottom right corner
- [ ] Shadow visible
- [ ] Shrinks on press
- [ ] Always on top (z-index 9999)

### Navigation Menu
- [ ] Closes smoothly after link tap
- [ ] No visual glitches

---

## 🔄 Regression Testing

After fixes, verify nothing broke:
- [ ] Desktop navigation still works
- [ ] Desktop drawers still work
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] Screen reader announces close buttons
- [ ] No console errors
- [ ] No horizontal scroll

---

## 📊 Performance Check

### Swipe Gesture Responsiveness
- Drawer should follow finger immediately
- No lag or jank
- Smooth animation on release

### Button Press Feedback
- Visual feedback within 100ms
- No delay on touch

---

## 🆘 Emergency Test

**Worst Case Scenario:**
1. Open Edinburgh map
2. Tap hotspot (drawer opens)
3. Scroll down in drawer
4. Try to close

**Must have at least 3 working escape methods:**
- ✅ Close button
- ✅ Swipe down
- ✅ Floating home button

**If user can't escape, it's a CRITICAL BUG.**

---

## 📧 Report Template

```
Device: [iPhone 14 Pro / Samsung S21 / etc.]
OS: [iOS 17 / Android 13 / etc.]
Browser: [Safari / Chrome / etc.]

Edinburgh Map Drawer:
- Close button: ✅ / ❌
- Swipe down: ✅ / ❌
- Tap outside: ✅ / ❌
- Floating home: ✅ / ❌

Project Drawer:
- Back button: ✅ / ❌
- Click outside: ✅ / ❌
- Floating home: ✅ / ❌

Navigation Menu:
- Auto-close: ✅ / ❌
- Floating home: ✅ / ❌

Floating Home Button:
- Visible: ✅ / ❌
- Works: ✅ / ❌
- Size: [width] x [height]

Issues:
[Describe any problems]

Console Errors:
[Copy any errors]
```

---

## Contact

Email: hello@q888.space
Check console for `[Edinburgh Map]` and `[Q888]` logs
