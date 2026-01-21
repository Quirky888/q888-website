# Eden Super-Magical Map - Interactive Prototype Specs

## PROJECT OVERVIEW
Fullscreen interactive webpage featuring the Edinburgh Magic map with clickable hotspots and a story drawer component. All assets export-ready for Cursor implementation.

---

## 1. DESIGN SYSTEM & COLORS

### Primary Palette (from Design System)
- **Primary Accent**: `#21808D` (Teal-500)
- **Hover State**: `#247480` (Teal-600)
- **Dark Shadow**: `#134252` (Teal-700)
- **Error/Magic**: `#C0152F` (Red-500)
- **Success**: `#208C8D` (Teal-500)
- **Background**: `#FCF8F9` (Cream-50)
- **Surface**: `#FFFFDD` (Cream-100)
- **Text Primary**: `#134252` (Slate-900)
- **Text Secondary**: `#627078` (Slate-500)

### Per-Location Accent Colors (for story drawer)
1. **Castle on Chicken Legs** → `#8B5A8E` (Purple)
2. **Real Edinburgh Castle** → `#6B4226` (Brown)
3. **Troll Market** → `#2D9CB2` (Teal-light)
4. **Earthy** → `#D4A574` (Tan/Ochre)
5. **Ocean Terminal** → `#1F7A8C` (Deep Blue)
6. **The GRIT** → `#8B7355` (Dark Brown)
7. **aaARrrrrrrr Coffee** → `#3D2817` (Dark Brown)
8. **Bottomless Lake** → `#4A5859` (Dark Slate)
9. **Hidden Doors** → `#5E5278` (Dark Purple)
10. **Star Bank** → `#FFD700` (Gold)
11. **Laverock Bank** → `#C0C0C0` (Silver)
12. **The House** → `#8B4789` (Magenta)
13. **Enlightened Palm** → `#2D5016` (Forest Green)

---

## 2. ASSET SPECIFICATIONS

### 2.1 Background Map Image


**Important (alignment):** Use a **contain + letterbox** strategy in the webpage so the entire image remains visible and hotspot coordinates stay aligned. Implement an inner wrapper with `aspect-ratio: 2560 / 1920` and center it in the viewport; render both the map image and SVG overlay inside that wrapper.
**Format**: WebP (optimized)  
**Dimensions**: 2560 × 1920px (4:3 aspect ratio — matches the 2560×1920 coordinate space)  
**Color Space**: sRGB  
**Quality**: 85% (balance between quality and file size)  
**File Size Target**: <800KB  
**Naming**: `eden-map-background.webp`

**Export Settings (in Figma)**:
- Frame size: 2560 × 1920px
- Scale: 1x
- Format: WebP
- Quality: 85
- No stroke expansion

### 2.2 SVG Overlay (Hotspots)
**Format**: SVG  
**Dimensions**: 2560 × 1920px (matches background)  
**Viewbox**: "0 0 2560 1920"  
**File Naming**: `eden-map-hotspots.svg`

**SVG Layer Structure** (clean hierarchy for Cursor):
```
<svg viewBox="0 0 2560 1920">
  <!-- Hotspot Group 1: Castle -->
  <g id="hotspot-castle-chicken-legs" data-location="Castle on Chicken Legs">
    <circle class="hotspot-trigger" cx="..." cy="..." r="60" />
    <!-- Optional: decorative ring element -->
    <circle class="hotspot-ring" cx="..." cy="..." r="80" opacity="0.2" />
  </g>
  
  <!-- Hotspot Group 2: Edinburgh Castle -->
  <g id="hotspot-edinburgh-castle" data-location="Real Edinburgh Castle">
    <circle class="hotspot-trigger" cx="..." cy="..." r="60" />
    <circle class="hotspot-ring" cx="..." cy="..." r="80" opacity="0.2" />
  </g>
  
  <!-- [Repeat for all 12+ hotspots] -->
</svg>
```

**CSS Classes in SVG**:
- `.hotspot-trigger`: clickable area (invisible, `pointer-events: all`)
- `.hotspot-ring`: decorative animation ring (hover effect)

### 2.3 Story Drawer Component
**Format**: HTML/CSS/JS (component structure in prototype)  
**Purpose**: Slides up from bottom, displays story per hotspot  
**Dimensions**: Full width × ~45% viewport height (when open)  
**Naming in Figma**: `Component/StoryDrawer`

**Sub-components**:
- **Drawer Header**: Title + close button
- **Drawer Content**: Story text (scrollable if long)
- **Drawer Footer**: Optional CTA or navigation to next location

---

## 3. HOTSPOT POSITIONING GUIDE

When creating hotspots in Figma, reference these visual zones on the Edinburgh Magic map:

| # | Location | Visual Quadrant | Approx Position |
|---|----------|-----------------|-----------------|
| 1 | Castle on Chicken Legs | Center-Top | 50%, 25% |
| 2 | Real Edinburgh Castle | Upper-Center | 50%, 20% |
| 3 | Troll Market | Left-Center | 20%, 50% |
| 4 | Earthy | Center-Left | 30%, 55% |
| 5 | Ocean Terminal | Right | 75%, 45% |
| 6 | The GRIT | Lower-Right | 70%, 70% |
| 7 | aaARrrrrrrr Coffee | Center (Hidden) | 50%, 90% |
| 8 | Bottomless Lake | Lower-Left | 25%, 75% |
| 9 | Hidden Doors | Left-Top | 15%, 30% |
| 10 | Star Bank | Right-Center | 80%, 55% |
| 11 | Laverock Bank | Right-Center | 80%, 60% |
| 12 | The House | Floating | Variable |
| 13 | Enlightened Palm | Right | 85%, 50% |

---

## 4. LAYER NAMING CONVENTION (for Figma)

Use this exact naming for Cursor implementation clarity:

### Artboards/Frames
```
Frame/Background
Frame/SVGOverlay
Frame/StoryDrawer
Frame/All (fullscreen mockup)
```

### Background Layer
```
Background/MapImage
Background/Base
```

### Hotspot Layers (SVG Container)
```
Hotspots/SVGOverlay
  ├─ Hotspots/Castle-ChickenLegs
  ├─ Hotspots/EdinburghCastle
  ├─ Hotspots/TrollMarket
  ├─ Hotspots/Earthy
  ├─ Hotspots/OceanTerminal
  ├─ Hotspots/TheGrit
  ├─ Hotspots/aaARrrrrCoffee
  ├─ Hotspots/BottomlessLake
  ├─ Hotspots/HiddenDoors
  ├─ Hotspots/StarBank
  ├─ Hotspots/LaverockBank
  ├─ Hotspots/HouseThatMoves
  └─ Hotspots/EnlightenedPalm
```

### Drawer Component Layers
```
Component/StoryDrawer
  ├─ StoryDrawer/Header
  │   ├─ Header/Title (text)
  │   ├─ Header/Accent-Bar (colored stripe)
  │   └─ Header/CloseButton (icon/button)
  ├─ StoryDrawer/Content
  │   ├─ Content/ShortStory (heading + 1-2 lines)
  │   └─ Content/LongStory (full text, scrollable)
  └─ StoryDrawer/Footer
      └─ Footer/NavigationDots (location indicator)
```

---

## 5. RESPONSIVE BEHAVIOR

### Desktop (1920+)
- Fullscreen map with fixed hotspots
- Drawer opens at bottom, 45% viewport height
- Hotspots show subtle hover rings

### Tablet (768-1920)
- Map scales proportionally
- Drawer height: 50% viewport
- Hotspots increase radius for touch targets (r="80")

### Mobile (<768)
- Full-width map, vertical scroll if needed
- Drawer opens fullscreen (100% height, scrollable)
- Hotspots become large touch zones (r="100")

---

## 6. STORY DRAWER DATA STRUCTURE

Each hotspot must map to this JSON structure (for Cursor):

```json
{
  "locations": [
    {
      "id": "castle-chicken-legs",
      "name": "Castle on Chicken Legs",
      "emoji": "🏰",
      "color": "#8B5A8E",
      "short": "Ancient walking castle that settled on volcanic rock.",
      "long": "In ancient times, a powerful race of beings traveled in a walking castle atop enormous chicken legs... [full story text]",
      "hotspot": {
        "cx": "1280",
        "cy": "480",
        "r": "60"
      }
    },
    {
      "id": "edinburgh-castle",
      "name": "Real Edinburgh Castle",
      "emoji": "👑",
      "color": "#6B4226",
      "short": "Hidden beneath Arthur's Seat, the true rulers retreated underground.",
      "long": "When humans discovered the grand Castle of Eden... [full story text]",
      "hotspot": {
        "cx": "1280",
        "cy": "384",
        "r": "60"
      }
    }
    // ... [all 12+ locations follow same structure]
  ]
}
```

---

## 7. INTERACTION FLOW

1. **Hover over hotspot** → Ring animates/scales up, cursor changes to pointer
2. **Click hotspot** → Story drawer slides up from bottom with smooth animation
3. **Drawer opens** → Header shows location name + accent color, story content loads
4. **User scrolls** → Content scrolls within drawer, header stays fixed
5. **Close button clicked** → Drawer slides down, map returns to focus
6. **Click different hotspot** → Drawer content updates (drawer stays open)

---

## 8. EXPORT CHECKLIST FOR CURSOR

- [ ] WebP background optimized (<800KB)
- [ ] SVG hotspots with clean `<g>` groups and `data-*` attributes
- [ ] Layer names match specification exactly (for DOM implementation)
- [ ] All hotspot coordinates calculated in 2560×1920 space
- [ ] Story JSON file with all 12+ location data ready
- [ ] Component specs documented for drawer implementation
- [ ] Color codes copy-pasted (not approximate)
- [ ] Hotspot hover/active states designed
- [ ] Responsive breakpoints specified

---

## 9. NOTES FOR CURSOR IMPLEMENTATION

**Key Handoff Info:**

1. **SVG Data Attributes**: Use `data-location-id` and `data-location-name` in SVG hotspots for JS targeting
2. **Hotspot Trigger Layers**: Create large invisible circles/polygons overlaid on visible decorative elements
3. **Story Drawer**: Use CSS Grid for header/content/footer structure; content area should overflow-y: auto
4. **Animation**: CSS transitions (350ms cubic-bezier) for drawer slide and hotspot rings
5. **Accessibility**: Add `role="button"` and `tabindex="0"` to hotspot groups; keyboard navigation on drawer
6. **Mobile Touch**: Consider touch-up delays; use 100ms instead of 300ms where possible
7. **Z-Index**: Drawer should appear above map overlay (z-index: 100+)

---

## 10. FILE DELIVERY

**Files to Export from Figma:**

1. `eden-map-background.webp` (2560×1920, 85% quality)
2. `eden-map-hotspots.svg` (viewBox 0 0 2560 1920)
3. `eden-stories.json` (all location data)
4. `story-drawer-component.html` (reusable component template)
5. Figma file link (for reference/iterations)

---

**Ready for Cursor? Copy entire spec + file exports, and Cursor can implement with minimal ambiguity.**