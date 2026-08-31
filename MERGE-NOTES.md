# Students' Biennale KMB — Merge & Release Notes

**Date:** 31 August 2026  
**Commit:** `f73f440` (and follow-up notes commit)  
**Branch:** `main`  
**Source Cross-Referenced:** `D:\Claude\Biennale\B_S\students-biennale\frontend` (Round 9 — 2nd Set Corrections)  
**Target Repository:** `d:\AntiGRavity\Students-Biennale-KMB`

---

## 1. Executive Summary

All design refinements, bug fixes, interaction updates, and typography corrections from the client's **Round 9 — 2nd Set Corrections** pass were cross-checked and merged into this repository.

During the merge, full compatibility with the existing **Supabase CMS infrastructure**, **Admin Portal**, **Dynamic Catalogue/Programmes loaders**, and **remote footer updates (`e904c8a`)** was preserved.

---

## 2. Detailed Breakdown of Changes

### 1. Navigation & Header
- **Dropdown Menus Added:**
  - Added hover and focus-within dropdown panels under **EDITIONS**, **PROGRAMMES**, and **ABOUT** in accordance with Figma node `24:296`.
  - EDITIONS dropdown lists the latest edition (`2025–26`) and previous editions (`2022–23`, `2020–21`, `2018–19`, `2016–17`, `2014–15`).
  - PROGRAMMES dropdown links to `#workshops`, `#awards`, and `#residencies`.
  - ABOUT dropdown links to anchor blocks for `#about-kbf`, `#about-sb`, `#about-team`, and `#about`.
- **Files Modified:**
  - `frontend/src/components/Header.tsx`
  - `frontend/src/components/Header.css`

---

### 2. Discover Artworks & Infinite Canvas
- **User-Controlled Zoom:**
  - Replaced the idle auto zoom-in/out cycle with smooth, user-controlled zoom (`MIN_ZOOM = 0.6`, `MAX_ZOOM = 1.8`).
  - Supports desktop **Ctrl + mouse scroll wheel**, laptop **trackpad pinch**, and mobile/tablet **two-finger pinch gestures**.
- **Tile Hover Dimming:**
  - Hovering over an artwork tile drops all other tiles to **70% opacity** via direct DOM class manipulation (`.canvas-tile.is-hover-dimmed`), bypassing React state re-renders to guarantee 60fps performance.
- **Column Centering:**
  - Updated masonry packing math (`packMasonry`) to center tiles horizontally within each column (`xInCol = slack / 2`) while maintaining irregular vertical gaps.
  - Bumped `PACK_VERSION` to `"artworks-only-v12-centered-columns"`.
- **Entrance Animation Safety Net:**
  - Added a 2.5s fallback `setTimeout` to ensure tiles never get stuck at `opacity: 0` under React 19 StrictMode or interrupted animation tickers.
- **Search Header Polish:**
  - Increased bottom padding on `.discover__search` to `64px` and refined the soft multi-stop gradient background fade.
- **Expand Overlay:**
  - Set `.canvas-expand__sheet--artwork` padding to `0` for true edge-to-edge artwork hero display; overlaid the BACK button on the hero image.
- **Files Modified:**
  - `frontend/src/components/canvas/InfiniteCanvas.tsx`
  - `frontend/src/components/canvas/CanvasTile.tsx`
  - `frontend/src/components/canvas/CanvasTile.css`
  - `frontend/src/components/canvas/CanvasExpand.css`
  - `frontend/src/pages/DiscoverArtworks.css`
  - `frontend/src/data/site.ts`

---

### 3. Artwork & Curator Detail Pages
- **Artwork Hero Carousel:**
  - Added a **4-second auto-advancing carousel** for multi-image artworks with pause-on-hover/focus.
- **Materials & Dimensions Inline:**
  - Formatted dimensions inline with the last material item using a ` | ` breaker (e.g. `Oil on canvas | 120 x 80 cm`).
- **Clickable Curators:**
  - Converted curator names in the "Curated By" section into navigable links pointing to `/editions/2025-26/curators/:id`.
- **Typography & Alignment:**
  - Changed artwork year and curatorial note title font weights from `600` to regular `400`.
  - Bottom-anchored curator name and bio block to portrait image (`align-self: end`).
  - Removed underline from zone title and unified all zone text to secondary gray (`--color-text-secondary`).
  - Increased row gap between artwork cards to `48px` and top gutter above "Curated By" to `40px`.
- **Files Modified:**
  - `frontend/src/components/ArtworkDetailBody.tsx`
  - `frontend/src/pages/Detail.css`

---

### 4. Programmes, Residencies & Workshops
- **In-Place "View More" Expander:**
  - Replaced the external page redirect with an interactive down-arrow toggle button that expands past workshops in-place directly on `/programmes`.
- **Half-Open on Hover:**
  - Workshops with descriptions collapsed at rest expand to reveal thumbnail and text snippet upon hover or focus (`.programmes__completed li.is-open`).
  - Applied the same hover preview treatment to `/programmes/past-workshops`.
- **Scholar Spotlight Modal:**
  - Capped hero image height inside the modal to `min(480px, 55vh)` so artwork title, venue, and descriptions remain immediately visible without excessive scrolling.
  - Positioned the BACK button as an overlay on the hero image.
- **Residencies Copy:**
  - Updated CTA link copy from "Learn more..." to "Read more...".
- **Files Modified:**
  - `frontend/src/pages/Programmes.tsx`
  - `frontend/src/pages/Programmes.css`
  - `frontend/src/pages/PastWorkshops.css`
  - `frontend/src/pages/PastWorkshops.tsx`
  - `frontend/src/components/ScholarSpotlight.css`
  - `frontend/src/components/ResidenciesBand.tsx`

---

### 5. Editions & Navigation
- **Previous Editions Navigation:**
  - Added backward navigation (`prevId`) in `getEditionOverview()`, allowing users on older editions (e.g., `2018-19`) to navigate back to older editions (`2016-17`) as well as forward (`2020-21`).
- **Typography & Headings:**
  - Replaced `fig-label--sub` on "CATALOGUE", "THE TEAM", and "PARTICIPATING INSTITUTIONS" with `fig-subheading` (20px font-size).
- **Year Link Underline Reveal:**
  - Added the `.fig-subheading__underline` span on edition year links in the rail.
- **Previous Editions Summary:**
  - Fixed summary label text color to primary black (`--color-text-primary`).
- **Venue Row Spacing:**
  - Increased vertical spacing between consecutive venue rows from `20px` to `48px`.
- **Files Modified:**
  - `frontend/src/data/editions.ts`
  - `frontend/src/pages/EditionOverview.tsx`
  - `frontend/src/pages/EditionOverview.css`
  - `frontend/src/pages/EditionShell.tsx`
  - `frontend/src/pages/EditionShell.css`
  - `frontend/src/pages/EditionViews.css`

---

### 6. Landing Page (Home)
- **Hero Update Stack Close Button:**
  - Added a dismiss `✕` close button (`stackClosed` state) to the hero update-card stack so mobile/touch users can easily collapse the expanded stack.
  - Reset state automatically on mouse enter.
- **Programmes Thumbnails Hover Animation:**
  - Implemented GSAP tween on `flex-basis` when hovering over Workshops, Awards, or Residencies: the hovered thumb expands by +120px while the other two contract by -60px.
- **About Anchor Navigation:**
  - Added `id="about-kbf"`, `id="about-sb"`, and `id="about-team"` to About section blocks with `scroll-margin-top` for exact header-cleared scroll landings.
- **Files Modified:**
  - `frontend/src/pages/Home.tsx`
  - `frontend/src/pages/Home.css`

---

### 7. Documentation
- Added `frontend/ROUND-9-CHANGES.md` (the original live tracking notes from Round 9).
- Added `MERGE-NOTES.md` (this summary).

---

## 3. Verification & Build Status

- **TypeScript Compilation:** Passed with 0 errors.
- **Vite Production Build:** Successfully generated bundle in `frontend/dist`.
- **Git Working Tree:** Clean, tracked, and committed.
