# Eden Super-Magical Map - Cursor Implementation Handoff

## 📦 DELIVERABLES CHECKLIST

You have received:

### 1. **Design Specifications** ✅
- `Eden_Map_Specs.md` - Complete asset specs, layer naming, responsive breakpoints, data structure

### 2. **Story Data** ✅
- `eden-stories.json` - All 13 locations with full stories, coordinates, colors, emojis

### 3. **Component Templates** ✅
- `story-drawer.html` - Reusable drawer component with CSS and vanilla JS controller

### 4. **Research Notes** ✅
- `Eden_Map_Hotspots.md` - Location mapping, hotspot positioning, export guide

### 5. **Source Image** ✅
- `Edinburgh_Magic.jpg` - The original hand-drawn map artwork

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Asset Preparation (Cursor + Figma)
**Estimated: 30-45 min**

1. **Export Background Map**
   - Open Figma frame: "Frame/Background"
   - Export as WebP at 2560×1920px, quality 85
   - Save as: `eden-map-background.webp`
   - Target file size: <800KB

2. **Create & Export SVG Overlay**
   - Create 13 `<g>` groups for each hotspot
   - Each group contains:
     - `<circle class="hotspot-trigger">` (cx, cy, r from JSON)
     - `<circle class="hotspot-ring">` (visual decoration)
   - Use `data-location-id` attributes
   - Export clean SVG: `eden-map-hotspots.svg`

3. **Verify Layer Names**
   - Match Figma layer structure exactly to spec
   - Naming format: `Hotspots/[Location-Name]`
   - This aids future iterations

### Phase 2: HTML Structure (Cursor)
**Estimated: 20-30 min**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eden Super-Magical Map</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Fullscreen Map Container -->
    <div class="map-container">
        <!-- Background Image -->
        <img src="eden-map-background.webp" alt="Eden Map" class="map-background">
        
        <!-- SVG Hotspot Overlay -->
        <svg class="map-overlay" viewBox="0 0 2560 1920">
            <!-- Injected from eden-map-hotspots.svg -->
        </svg>
    </div>

    <!-- Story Drawer Component (from story-drawer.html) -->
    <div class="story-drawer" id="storyDrawer">
        <!-- Component structure here -->
    </div>
    <!-- Load stories via fetch('/eden-stories.json') in app.js (do NOT script-include JSON) -->
    <script src="app.js"></script>
</body>
</html>
```

### Phase 3: CSS Styling (Cursor)
**Estimated: 20-30 min**


**Critical alignment note:** `object-fit: contain` alone is not enough if your SVG fills the full viewport. Use an **inner wrapper** with a fixed aspect ratio so the image and SVG share the exact same box. Example:

```css
.map-container{position:relative;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:#FCF8F9;}
.map-inner{position:relative;width:100%;height:100%;max-width:100vw;max-height:100vh;aspect-ratio:2560/1920;}
.map-background,.map-overlay{position:absolute;inset:0;width:100%;height:100%;}
.map-background{object-fit:contain;}
.map-overlay{pointer-events:none;}
```

In the SVG, set `pointer-events: all` on hotspot shapes/groups so they remain clickable.


Create `styles.css`:

```css
/* Map Container */
.map-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #FCF8F9;
}

.map-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
}

/* SVG Overlay */
.map-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* Hotspot Styling */
.hotspot-trigger {
    cursor: pointer;
    pointer-events: all;
    opacity: 0;
    transition: all 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hotspot-ring {
    opacity: 0.2;
    stroke: currentColor;
    fill: none;
    transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hotspot-trigger:hover + .hotspot-ring {
    opacity: 0.4;
    r: 90;
}

.hotspot-trigger:focus-visible {
    outline: 2px solid #208C8D;
    outline-offset: 6px;
}

/* Responsive */
@media (max-width: 768px) {
    .map-container {
        height: calc(100vh - 0px);
    }
}
```

### Phase 4: JavaScript Controller (Cursor)
**Estimated: 30-45 min**

Create `app.js`:

```javascript
// Fetch stories data
const storiesData = /* load eden-stories.json */;

// Initialize drawer controller
class MapController {
    constructor(storiesData) {
        this.stories = storiesData.locations;
        this.drawer = document.getElementById('storyDrawer');
        this.overlay = document.querySelector('.map-overlay');
        this.currentLocation = null;

        this.initHotspots();
        this.initDrawer();
        this.handleResponsive();
    }

    initHotspots() {
        // Get all hotspot triggers from SVG
        const triggers = this.overlay.querySelectorAll('.hotspot-trigger');
        
        triggers.forEach(trigger => {
            const locationId = trigger.parentElement.dataset.locationId;
            
            trigger.addEventListener('click', () => this.openStory(locationId));
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openStory(locationId);
                }
            });
        });
    }

    initDrawer() {
        // Mount drawer controller
        this.drawer.controller = new StoryDrawer(this.drawer, this.stories);
    }

    openStory(locationId) {
        this.drawer.controller.open(locationId);
        this.currentLocation = locationId;
    }

    handleResponsive() {
        const mq = window.matchMedia('(max-width: 768px)');
        mq.addEventListener('change', (e) => {
            if (e.matches) {
                // Mobile adjustments
                this.drawer.style.height = this.drawer.classList.contains('open') 
                    ? '100vh' 
                    : '0';
            }
        });
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    fetch('eden-stories.json')
        .then(r => r.json())
        .then(data => new MapController(data))
        .catch(err => console.error('Failed to load stories:', err));
});
```

### Phase 5: Integration & Testing (Cursor)
**Estimated: 20-30 min**

**Checklist:**
- [ ] Hotspots align with map features
- [ ] Drawer opens smoothly on click
- [ ] Story content loads correctly
- [ ] Close button works
- [ ] Keyboard navigation (Escape to close, Tab to hotspots)
- [ ] Mobile responsive (fullscreen drawer on <768px)
- [ ] Performance: no lag when dragging map or opening drawer
- [ ] Accessibility: ARIA labels, color contrast, focus states

---

## 🎨 DESIGN SYSTEM REFERENCE

### Colors (from spec)
```
Primary:        #208C8D (Teal-500)
Primary Hover:  #247480 (Teal-600)
Primary Active: #134252 (Teal-700)

Background:     #FCF8F9 (Cream-50)
Surface:        #FFFFDD (Cream-100)
Text:           #134252 (Slate-900)
Text Secondary: #627078 (Slate-500)
Error:          #C0152F (Red-500)
```

### Typography
```
Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Title (h2):  18px, weight 600, letter-spacing -0.01em
Body:        14px, weight 400, line-height 1.6
Accent:      12px, weight 600, text-transform uppercase, letter-spacing 0.05em
```

### Spacing
```
Header:      20px padding
Content:     20px padding, 12px between paragraphs
Footer:      16px padding
Gaps:        8px small, 12px medium, 16px large
```

---

## 📍 HOTSPOT COORDINATES

All coordinates are in 2560×1920px space. Figma will handle scaling.

| ID | Name | CX | CY | R |
|----|------|-----|-----|---|
| castle-chicken-legs | Castle | 1280 | 480 | 60 |
| edinburgh-castle | Edinburgh Castle | 1280 | 384 | 60 |
| troll-market | Troll Market | 512 | 960 | 60 |
| earthy | Earthy | 768 | 1056 | 60 |
| ocean-terminal | Ocean Terminal | 1920 | 864 | 60 |
| the-grit | The GRIT | 1792 | 1344 | 60 |
| coffee-company | Coffee Company | 1280 | 1728 | 60 |
| bottomless-lake | Bottomless Lake | 640 | 1440 | 60 |
| hidden-doors | Hidden Doors | 384 | 576 | 60 |
| star-bank | Star Bank | 2048 | 1056 | 60 |
| laverock-bank | Laverock Bank | 2048 | 1152 | 60 |
| house-moves | House Moves | 1536 | 768 | 60 |
| enlightened-palm | Enlightened Palm | 2176 | 960 | 60 |

---

## 🔧 QUICK REFERENCE: KEY FUNCTIONS

### Open Story Drawer
```javascript
mapController.openStory('castle-chicken-legs');
// OR
drawer.controller.open('edinburgh-castle');
```

### Close Drawer
```javascript
drawer.controller.close();
```

### Navigate Between Stories
```javascript
drawer.controller.updateNavDots();
```

### Update Hotspot on Hover
```css
/* Use SVG data attributes to target specific hotspots */
g[data-location-id="castle-chicken-legs"] .hotspot-ring {
    opacity: 0.5;
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before shipping:

- [ ] Background map WebP is <800KB
- [ ] SVG hotspots load without layout shift
- [ ] All 13 locations have stories populated
- [ ] Drawer animations smooth (60fps)
- [ ] Mobile touch targets are ≥44×44px
- [ ] Images optimized (no LCP issues)
- [ ] Meta tags for social sharing
- [ ] 404 handling for missing assets
- [ ] Error boundaries for JSON fetch failures
- [ ] Lighthouse score >90 (Performance, Accessibility)

---

## 📝 NOTES FOR FUTURE ITERATIONS

1. **Adding New Hotspots:** 
   - Add location object to `eden-stories.json`
   - Create new `<g>` in SVG with correct coordinates
   - Increment hotspot count in drawer nav

2. **Changing Colors:**
   - Update hex codes in JSON `color` field
   - CSS uses CSS variables for easy theming
   - Update accent border in drawer header dynamically

3. **Extended Stories:**
   - Store full stories in separate markdown files
   - Load with fetch, compile to HTML
   - Maintain JSON structure for drawer compatibility

4. **Analytics:**
   - Track which hotspots are clicked most
   - Measure time spent reading stories
   - Use for future content prioritization

5. **Accessibility:**
   - Consider adding audio narration for stories
   - Implement skip-to-content link
   - Test with screen readers (NVDA, JAWS)

---

## ❓ TROUBLESHOOTING

**Q: SVG hotspots not clickable?**  
A: Ensure `.hotspot-trigger` circles have `pointer-events: all` and no parent has `pointer-events: none`

**Q: Drawer animation stuttering?**  
A: Check that `height` transition doesn't conflict with content-based height. Use `will-change: height` on `.story-drawer` for optimization.

**Q: Stories not loading?**  
A: Verify `eden-stories.json` is in same directory or use absolute path in fetch()

**Q: Hotspots misaligned on mobile?**  
A: SVG `viewBox="0 0 2560 1920"` should scale responsively. If not, check parent container width/height ratio.

---

## 📞 HANDOFF COMPLETE

**Files provided:**
- Eden_Map_Specs.md (specifications)
- eden-stories.json (story data)
- story-drawer.html (component template)
- Eden_Map_Hotspots.md (positioning guide)
- Edinburgh_Magic.jpg (source artwork)

**Ready for implementation.** Start with Phase 1 assets, then follow roadmap sequentially. Each phase is self-contained and can be reviewed/iterated independently.

Good luck! 🌟
