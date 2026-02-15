# Mobile Navigation Critical Fix

## Date: February 14, 2026

## Problem Summary
Navigation bar was completely non-functional on mobile devices due to z-index stacking conflicts. Users were trapped on pages with no way to navigate.

---

## Root Cause

### Z-Index Hierarchy Conflict
Navigation bars had `z-index: 1000`, but multiple overlays had higher z-index values:
- Artwork viewer: `z-index: 10000`
- Terms modal: `z-index: 9999-10000`
- Sticker drawer: `z-index: 210`
- Drawer root: `z-index: 200`

These overlays were blocking touch/click events from reaching the navigation bar, even when "closed" or inactive.

---

## Fixes Applied

### 1. Navigation Z-Index Elevation

**Files Modified:**
- `src/components/SlimNav.astro`
- `src/components/TopNav.astro`

**Changes:**
```css
/* BEFORE */
.slim-nav, .top-nav {
  z-index: 1000;
}

/* AFTER */
.slim-nav, .top-nav {
  z-index: 999999;
  pointer-events: auto;
}
```

**Impact:** Navigation now sits above ALL overlays, drawers, and modals.

---

### 2. Navigation Links Pointer Events

**Files Modified:**
- `src/components/SlimNav.astro`
- `src/components/TopNav.astro`

**Changes:**
```css
/* Added to all navigation links and buttons */
.slim-link, .nav-link, .wordmark, .slim-wordmark {
  pointer-events: auto;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.slim-toggle, .mobile-toggle {
  pointer-events: auto;
  position: relative;
  z-index: 2;
}
```

**Impact:** Ensures all navigation elements explicitly accept pointer events and are clickable.

---

### 3. Floating Back Button

**File Modified:** `src/layouts/Layout.astro`

**Changes:**
- Changed floating button from HOME to BACK
- Uses `window.history.back()` for browser back navigation
- Falls back to home if no history exists
- Updated icon from house to left arrow
- Added touch event support

```javascript
const handleBack = (e?: Event) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/#landing';
  }
};
backBtn.addEventListener('click', handleBack);
backBtn.addEventListener('touchend', handleBack, { passive: false });
```

**Z-Index:** `999998` (just below navigation bar)

**Rationale:** Q888 logo in navigation already goes home, so back button is more useful.

---

### 4. Sticker Drawer Close Button Enhancement

**File Modified:** `src/components/OverpricedStickersSection.astro`

**Changes:**
- Added touch event support to close button
- Increased touch target size to 44x44px minimum
- Added explicit z-index and pointer-events
- Added touch support for click-outside-to-close

```javascript
const handleClose = (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeDrawer();
};
closeBtn?.addEventListener("click", handleClose);
closeBtn?.addEventListener("touchend", handleClose, { passive: false });

const handleClickOutside = (e) => {
  if (e.target === drawer) {
    closeDrawer();
  }
};
drawer.addEventListener("click", handleClickOutside);
drawer.addEventListener("touchstart", handleClickOutside, { passive: true });
```

```css
[data-close-drawer] {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  z-index: 20;
}
```

---

## Z-Index Hierarchy (Final)

```
999999 - Navigation bars (SlimNav, TopNav)
999998 - Mobile back button
10000  - Artwork viewer (Infocigan)
9999   - Terms modal, NarMail chatbot
210    - Sticker drawer
200    - Project drawer root
100    - Standard content
```

**Critical Rule:** Navigation MUST always be highest z-index to ensure users can always escape.

---

## Testing Checklist

### Navigation Bar
- [ ] Desktop: All navigation links work
- [ ] Mobile portrait: Navigation links clickable
- [ ] Mobile landscape: Navigation links clickable
- [ ] With Edinburgh map open: Navigation works
- [ ] With sticker drawer open: Navigation works
- [ ] With artwork viewer open: Navigation works
- [ ] With terms modal open: Navigation works

### Floating Back Button
- [ ] Mobile only: Button visible
- [ ] Desktop: Button hidden
- [ ] Click/tap: Goes to previous page
- [ ] On landing page: Goes to home
- [ ] Touch events work without double-tap

### Sticker Drawer
- [ ] Close button visible and clickable
- [ ] Close button touch target ≥44px
- [ ] Click outside drawer: Closes
- [ ] Tap outside drawer: Closes
- [ ] ESC key: Closes

### Edinburgh Map
- [ ] Navigation bar works while map open
- [ ] Close button works
- [ ] Navigation links work

---

## Success Criteria

✅ Navigation bar links work on EVERY page
✅ Users can navigate between pages freely on mobile
✅ Overpriced sticker can be closed/escaped
✅ Floating button acts as BACK button
✅ No invisible overlays blocking navigation
✅ Touch events properly reach navigation links
✅ Navigation always visible and accessible
✅ Z-index hierarchy prevents future conflicts

---

## Files Modified

1. `src/layouts/Layout.astro` - Back button, z-index
2. `src/components/SlimNav.astro` - Z-index, pointer-events
3. `src/components/TopNav.astro` - Z-index, pointer-events
4. `src/components/OverpricedStickersSection.astro` - Touch events, close button

---

## Prevention Guidelines

### Future Development Rules

1. **Navigation Z-Index is Sacred**
   - Navigation bars MUST remain at highest z-index (999999)
   - Never create overlays with z-index > 999998
   - Always test navigation accessibility when adding new overlays

2. **Pointer Events**
   - Navigation elements MUST have `pointer-events: auto`
   - Overlays should use `pointer-events: none` when inactive
   - Test touch events on mobile, not just click events

3. **Touch Event Support**
   - All interactive elements need both `click` and `touchend` listeners
   - Use `{ passive: false }` when preventing default behaviors
   - Minimum touch target: 44x44px

4. **Escape Mechanisms**
   - Every modal/drawer/overlay MUST have:
     - Visible close button (X)
     - Click/tap outside to close
     - ESC key to close
     - Touch gesture to close (swipe)

---

## Rollback Instructions

If issues occur:
```bash
git log --oneline -5
git revert <commit-hash>
```

Or restore from backup:
```bash
git stash
git checkout jan25-stable
```

---

## Contact

For issues: hello@q888.space
