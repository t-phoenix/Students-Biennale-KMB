# Students' Biennale KMB — Merge & Release Notes

**Date:** 31 August 2026  
**Branch:** `main`  
**Target Repository:** `d:\AntiGRavity\Students-Biennale-KMB`

---

## 1. Executive Summary

All client updates and design refinements for **Header/Navigation dropdowns**, **Discover Artworks & Infinite Canvas**, **Artwork & Curator Details**, and **Programmes / Residencies / Workshops** were successfully integrated.

Per user feedback, the layout and design changes to the **Landing Page (`Home.tsx`, `Home.css`)** and **Editions sections (`EditionOverview.*`, `EditionShell.*`, `EditionViews.css`, `editions.ts`)** were rolled back to their exact previous state to maintain the original layout.

---

## 2. Active Integrated Features

### 1. Navigation & Header
- **Dropdown Menus:**
  - Added hover and focus-within dropdown panels under **EDITIONS**, **PROGRAMMES**, and **ABOUT** ([Header.tsx](file:///d:/AntiGRavity/Students-Biennale-KMB/frontend/src/components/Header.tsx), [Header.css](file:///d:/AntiGRavity/Students-Biennale-KMB/frontend/src/components/Header.css)).

---

### 2. Discover Artworks & Infinite Canvas
- **User-Controlled Zoom:**
  - Smooth user-controlled zoom (`MIN_ZOOM = 0.6`, `MAX_ZOOM = 1.8`) for Ctrl+scroll, trackpad pinch, and touch 2-finger pinch gestures.
- **Tile Hover Dimming:**
  - Direct DOM 70% opacity tile hover dimming (`.canvas-tile.is-hover-dimmed`) for fast 60fps performance without React state lag.
- **Column Centering:**
  - Centered tiles horizontally within masonry columns (`xInCol = slack / 2`).
- **Entrance Animation Safety Net:**
  - 2.5s fallback safety timer for React 19 StrictMode.
- **Search Header & Full-Bleed Sheet:**
  - 64px search bottom padding and zero padding on `.canvas-expand__sheet--artwork`.
- **Files Active:**
  - `frontend/src/components/canvas/InfiniteCanvas.tsx`
  - `frontend/src/components/canvas/CanvasTile.tsx`
  - `frontend/src/components/canvas/CanvasTile.css`
  - `frontend/src/components/canvas/CanvasExpand.css`
  - `frontend/src/pages/DiscoverArtworks.css`
  - `frontend/src/data/site.ts`

---

### 3. Artwork & Curator Detail Pages
- **Artwork Hero Carousel:**
  - 4-second auto-advancing carousel with pause-on-hover/focus for multi-image artworks.
- **Materials & Dimensions Inline:**
  - Formatted inline with ` | ` breaker.
- **Curator Links & Bios:**
  - Clickable curator links and bottom-anchored bios.
- **Files Active:**
  - `frontend/src/components/ArtworkDetailBody.tsx`
  - `frontend/src/pages/Detail.css`

---

### 4. Programmes, Residencies & Workshops
- **In-Place "View More" Expander:**
  - Interactive expander button revealing full past workshops list in place on `/programmes`.
- **Half-Open on Hover:**
  - Preview expand on hover for past workshops (`.programmes__completed li.is-open`).
- **Scholar Spotlight Modal:**
  - Capped modal hero height to `min(480px, 55vh)` with overlaid BACK button.
- **Files Active:**
  - `frontend/src/pages/Programmes.tsx`
  - `frontend/src/pages/Programmes.css`
  - `frontend/src/pages/PastWorkshops.css`
  - `frontend/src/pages/PastWorkshops.tsx`
  - `frontend/src/components/ScholarSpotlight.css`
  - `frontend/src/components/ResidenciesBand.tsx`

---

## 3. Rolled-Back Sections (Preserved Original Layout)

- **Landing Page (`frontend/src/pages/Home.tsx`, `frontend/src/pages/Home.css`)**:
  - Rolled back to previous layout and styling.
- **Editions Overview & Shell (`frontend/src/pages/EditionOverview.*`, `frontend/src/pages/EditionShell.*`, `frontend/src/pages/EditionViews.css`, `frontend/src/data/editions.ts`)**:
  - Rolled back to previous layout and styling.

---

## 4. Verification

- **Build Status:** `npm run build` passed with 0 errors.
- **Dev Server:** Running on localhost `http://localhost:5174/`.
