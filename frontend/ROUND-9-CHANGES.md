# Round 9 — 2nd Set Corrections

Live tracking doc for the client's second feedback pass ("2nd Set Corrections" Google Doc). Updated as we go, section by section, in the order we're working through it in chat. Status per item: **Done**, **Not started**, **Blocked**, or **No change** (checked and already correct).

---

## 1. Landing Page

### Header dropdowns — **Done**
Added hover/focus dropdown menus under EDITIONS, PROGRAMMES, and ABOUT, matching the client-supplied Figma (`8DUyHfa6VW8dFl5fneOvHl`, node `24:296`): plain white panel, left-aligned under the trigger, current item black, rest gray, no dividers.

- **`src/components/Header.tsx`** — `NAV` array extended with a `dropdown` list per item; EDITIONS lists `LATEST_EDITION` + `PREVIOUS_EDITIONS` (each linking to `/editions/:year/curators` or `/editions/:year`); PROGRAMMES lists Workshops/Awards/Residencies (`/programmes#hash`); ABOUT lists Kochi Biennale Foundation / Students' Biennale / SB 2025-26 Team / Sponsors of SB 2025-26. Render restructured: each nav item wrapped in a `.site-header__nav-trigger` span with a `.site-header__dropdown` panel.
- **`src/components/Header.css`** — new `.site-header__nav-trigger`, `.site-header__dropdown` rules (hover/focus-within reveal, no JS state needed).
- **`src/pages/Home.tsx`** — added `id="about-kbf"`, `id="about-sb"`, `id="about-team"` to the three About Us sub-blocks so the ABOUT dropdown's first three links land somewhere real.
- **`src/pages/Home.css`** — `scroll-margin-top` added to `.home-about__block` and `.home-about__team` so the sticky header doesn't cover the anchor target on jump.

**Known gap:** "Sponsors of SB 2025-26" has no content block on the page yet, so that link falls back to `/#about` (the section entry point) rather than a real destination — flagged, not fabricated.

### Update-card close button — **Done**
The hero card stack only expanded via hover/focus with no way to dismiss it (a problem on touch, which has no "hover away").

- **`src/pages/Home.tsx`** — new `stackClosed` state; close `<button>` added inside `.home-hero__stack`, sets `stackClosed(true)` on click; `onMouseEnter` on the stack resets it back to `false` so the next hover works normally.
- **`src/pages/Home.css`** — all `.home-hero__stack:hover` / `:focus-within` expand rules changed to `:not(.is-closed):hover` / `:not(.is-closed):focus-within` so the closed state cleanly overrides the hover-expand instead of fighting it. New `.home-hero__stack-close` button styling.

### Sensing Grounds heading — **No change**
Checked live via computed styles: already `text-transform: uppercase`, `text-align: right`, 20px/24px line-height — identical to the "CURATORS" reference link. Doc's ask (full caps, right-align, line-height fix) was already satisfied.

### Programmes hover-expand interaction — **Done**
Workshops (left) / Awards (center) / Residencies (right) images now respond to hover on either the text label or the image itself: the hovered image grows 60px on each side (120px total), the other two shrink 60px each, text weight goes thin→regular (existing `.fig-subheading` hover convention), all driven by GSAP for smooth motion.

- **`src/pages/Home.tsx`** — `PROGRAMMES_TABS` constant (shared order/data for both the rail and the thumbnails); `programmesHover` state; `programmesThumbsRef` / `programmesThumbEls` refs; new `useGSAP` effect computing each thumbnail's target `flex-basis` in pixels and tweening it (`scope: programmesThumbsRef`, isolated from other GSAP effects on the page — see note below); `onMouseEnter`/`onMouseLeave` wired on both the rail `<Link>`s and the thumbnail `<Link>`s.
- **`src/pages/Home.css`** — `.home-programmes__thumbs` changed from the `fig-sub-3` equal-grid utility to a flex row so widths can be driven precisely in pixels; mobile fallback (`≤899px`) wraps to a 2-up grid instead of using the fixed-pixel hover state.

**Verification note:** the sandboxed browser used to test this doesn't reliably composite animation frames, so `gsap.to()` tweens don't visibly tick in that environment (confirmed via `gsap.set()`, which applies instantly and computed the exact right pixel values). The math and wiring are verified correct; the actual smoothness of the motion needs a real browser to confirm.

### `/programmes#hash` auto-scroll — **Done** (found and fixed a real bug)
Clicking Workshops/Awards/Residencies navigated to `/programmes#workshops` etc., but nothing actually scrolled — the app's only hash-scroll handling was hardcoded to the Home page.

- **`src/components/Layout.tsx`** — both scroll-management effects extended to also recognize `/programmes` + a valid `parseProgrammeHash` result (skip the scroll-to-top reset, and call `scrollToId` on the matching section — reusing the existing Lenis-aware smooth-scroll utility that Home already uses).

### Press column — **No change**
Client confirmed "proceed" — no further work needed beyond the fix already made last round.

### SB logo (About Us) — **Blocked**
No replacement asset supplied yet.

### Team heading / Web Design section — **Deferred**
Client's own team is making this change.

### Footer — **No change, explicitly left alone**
Client said to leave it. (Open question from earlier — Figma showed a materially different footer with dead links and a different design credit — stays unresolved, untouched either way.)

---

## 2. Discover Artworks

### Search box spacing + gradient — **Done**
- **`src/pages/DiscoverArtworks.css`** — `.discover__search` padding-bottom increased (16px → 64px) and the background gradient extended with an extra fade stop so it tapers out gradually instead of cutting off abruptly; `.discover__search-field input`'s bottom padding reduced (14px → 8px) to tighten the gap between the placeholder text and the underline.

### Canvas centering — **Done**
- **`src/components/canvas/InfiniteCanvas.tsx`** — the initial/re-tier pan offset changed from a hardcoded `{x: -40, y: -40}` to `{x: -(seedW - viewportWidth) / 2, y: -40}`, centering the viewport on the middle of one horizontal repeat period instead of an arbitrary small pan from its edge. Random jitter/spacing itself is untouched.

### Hover-dim to 70% opacity — **Done**
- **`src/components/canvas/CanvasTile.tsx`** — new optional `onHoverChange` prop, wired to `onMouseEnter`/`onMouseLeave`.
- **`src/components/canvas/InfiniteCanvas.tsx`** — new `handleTileHover` callback that toggles a class directly via `querySelectorAll`/`classList` (not React state) so hovering doesn't re-render every tile on the canvas — this can be several hundred tiles, and a React re-render per mouse move would be exactly the kind of jank the rest of this component's GSAP-driven approach is built to avoid.
- **`src/components/canvas/CanvasTile.css`** — new `.canvas-tile.is-hover-dimmed { opacity: 0.7 }`, kept as a separate class from the existing search-query `.is-dimmed` (0.18 opacity) so the two states never collide.
- **Verified live**: hovering one tile drops the other 477 of 486 tiles to 70% opacity (the 9 that stay full-opacity are other on-canvas copies of the same wrapped/repeated artwork); clears correctly on mouse-out.

### Responsive pass — **Not started**
Listed in the plan, never actually executed. No tablet/mobile-specific audit has been done on the canvas beyond what already existed.

### Tiles stuck invisible (opacity: 0) — **Done** (real regression, client-reported)
Client reported cards on Discover Artworks weren't showing images. Root cause: the one-time entrance animation (`gsap.from(".canvas-tile", { opacity: 0, ... })`) sets every tile to `opacity: 0` up front and relies on the tween ticking back to 1 — under React 19 StrictMode's double-effect-invoke (and/or animation-ticker edge cases), a large number of tiles were getting stuck at 0 permanently.
- **`src/components/canvas/InfiniteCanvas.tsx`** — added a `setTimeout` safety net in the same entrance `useGSAP` effect: 2.5s after mount, force `gsap.set(".canvas-tile", { opacity: 1, scale: 1 })` regardless of whether the tween actually completed, with cleanup on unmount.
- **Verified live**: went from many tiles stuck at `opacity: 0` to 0 of 711.

### Column-centering — **Done** (client follow-up, post-doc)
Client asked to center-align every image within its column on Discover Artworks, while explicitly keeping the existing random width/height/spacing. This reverses an earlier deliberate anti-grid design decision from an earlier round.
- **`src/data/site.ts`** — `packMasonry()`'s horizontal placement changed from a pseudo-random scatter across the column's slack (`xInCol = slack * posT`) to a fixed center (`xInCol = slack / 2`). Vertical spacing and width/height jitter untouched. `PACK_VERSION` bumped to `"artworks-only-v12-centered-columns"` to bust the pack cache.
- **Verified live**: tiles sharing a column now share the same horizontal center despite differing widths.

### Replace idle auto zoom-in/out with user-controlled zoom — **Done** (client follow-up, post-doc)
Client asked to remove the automatic idle zoom-in/zoom-out cycle and instead let the user zoom manually: mouse-wheel on desktop, pinch on trackpad/touch, with min/max limits.
- **`src/components/canvas/InfiniteCanvas.tsx`** — removed the idle-triggered zoom-out/reset-in system (`IDLE_ZOOM_DELAY`, `ZOOM_OUT_SCALE`, `zoomedOut`, `lastInteractionAt`, `resetZoom`, `startZoomOut`, `registerInteraction`) entirely. Replaced with user-controlled zoom: `MIN_ZOOM = 0.6`, `MAX_ZOOM = 1.8`, a `setZoom(value, animate?)` helper that clamps and applies via `gsap`/direct style, and:
  - **Ctrl+scroll wheel** zooms — the same `onWheel` handler branches on `e.ctrlKey`; when true it zooms instead of panning. Browsers report trackpad pinch as wheel events with `ctrlKey` set automatically, so this one branch covers both desktop Ctrl+scroll and laptop trackpad pinch with no separate code path.
  - **Two-finger touch pinch** — new `touchstart`/`touchmove`/`touchend` listeners track the distance between two touch points and scale zoom by the ratio to the pinch's starting distance; a second finger touching down also cancels any in-progress single-pointer drag so the two gesture paths don't fight over the pan offset.
  - The one-time entrance "whoa" zoom-in (0.92 → 1 on load) is unrelated and was left untouched — it's a single settle-in motion, not a repeating in/out idle cycle.
- **Verified live** (simulated wheel events): plain scroll still pans (world offset changes, zoom transform untouched); `ctrlKey` wheel zooms and clamps correctly at both `0.6` and `1.8`.

### Expand overlay — **Done**
- **`src/components/canvas/CanvasExpand.css`** — `.canvas-expand__sheet--artwork` padding changed from inline-only to fully `0`, so the artwork hero reaches every edge of the overlay instead of floating in a white margin. `.canvas-expand__back` repositioned to `position: absolute`, overlaid on top of the hero image (matching the artwork page's own hero-nav treatment) instead of sitting in the padding above it.
- **Verified live**: sheet padding computes to `0px`.

---

## 3. Edition Page — **Done**

- **"PREVIOUS EDITION headline should be visible" — real fix found.** It was already rendering fully uppercase ("Previous EDITIONS" text + `text-transform` both already there) — the actual problem was `color: var(--color-text-tertiary)` (#c3c3c3, very pale gray) on `.edition__prev summary`. Changed to `--color-text-primary` (black).
  - **`src/pages/EditionShell.tsx`** — summary text reverted to natural-case "Previous Editions" (CSS already uppercases it).
  - **`src/pages/EditionShell.css`** — `.edition__prev summary` color fixed.
- **Line-selection animation for years — Done.** Year links (`2022-23`, etc.) now use `fig-subheading` + the same underline-reveal span everywhere else in the site.
  - **`src/pages/EditionShell.tsx`** — year `NavLink`s given `fig-subheading` class + `.fig-subheading__underline` span.
- **Curator images manual crop — Blocked**, unchanged (asset task).
- **Venue grid gutter — Done.** Widened the vertical gap between consecutive venue entries (20px → 48px).
  - **`src/pages/EditionViews.css`** — `.edition-venue-rows` gap increased.
- **List view "+"/"-" icons — No change, checked live.** They render correctly (confirmed via computed style + screenshot); not a regression, nothing to fix.

## 4. Curator Page — **Done**

- **Curatorial note font — Done.** `.detail__note-title` weight changed 600 → 400 (regular).
- **"Additional info in a single colour, remove Zone 1's underline" — Done.** `.detail__zone h2`'s `border-bottom` removed; `.detail__zone h2`, `.detail__zone p`, and `.detail__zone-assistant span` all unified to `--color-text-secondary` (previously an unintentional black/gray/black mix).
- **Curator Note Title "Missing" — not a code bug.** The JSX already conditionally renders it; if it's missing for a given zone, that's a data gap (`zone.noteTitle` unset in `data/editions.ts`), not a display bug. Not touched — needs a content check, not a code fix.
- **Space between artwork cards — Done.** `.fig-sub-3.detail__cards` given its own `row-gap: 48px` (was sharing `fig-sub-3`'s 20px column+row gap).
- **"Add BACK arrow" — correction to the original plan.** The curator page already has a working `.detail__back` "BACK" link (I'd mis-read this as missing when planning) — confirmed present live. Not touched.
- **Profile image aligned with SB logo — not independently verified**; general portrait/bio alignment addressed below.
- **Bio aligned with profile image's bottom — Done.** `.detail__curator-copy` given `align-self: end` (a grid-item property, bottom-anchoring the name+bio block to the portrait's height). Confirmed visually via screenshot.
  - **`src/pages/Detail.css`**

## 5. Artworks Page — **Done**

- **Auto-slide — Done.** Hero now auto-advances every 4s (matching the Home hero's pace), pausing on hover/focus, same pattern as Home.
  - **`src/components/ArtworkDetailBody.tsx`** — new `useGSAP` timeline effect.
- **"2025-26" year regular weight — Done.** `.detail__year` weight 600 → 400 (same size as title, less heavy).
- **Cover full-screen + title at bottom — No change.** Already matches the reference/Round 8 rebuild.
- **Full image view experience — No change.** Already built (Round 8's double-click lightbox).
- **Materials & Dimensions inline — Done, format is a best guess.** Dimensions now appends to the last material's line with a `|` separator instead of its own paragraph. The exact punctuation ("breaker") was never specified — flagged for you to confirm/adjust.
  - **`src/components/ArtworkDetailBody.tsx`**
- **Gutter between Artists and Curated By — Done.** `.detail__curated-by` margin-top 20px → 40px.
- **Curator name links — Done** (wasn't asked for a fix per se, but "curators name selection" read as wanting them clickable — they were plain text before). Now real links to each curator's page.
  - **`src/pages/Detail.css`**, **`src/components/ArtworkDetailBody.tsx`**
- **Back Arrow — not touched.** Artwork page already has a working "BACK" text link; unclear if an icon is specifically wanted instead of text — flagged, not guessed at.

## 6. Programmes Page — **Done**

- **"Place:" → "Facilitator:" — No change**, already done in Round 1.
- **Past Workshops "View More" — Done, reinterpreted.** The doc says this twice now, and also separately says "individual past workshop layouts need to fix" — read together as: the *list* should expand in place (a down-arrow reveal), but *individual* workshop pages should stay and just get layout work. Implemented: "View More" is now a button that reveals the rest of `PAST_WORKSHOPS` directly on the Programmes page instead of linking to the separate listing page; each entry still opens its own detail page when clicked. The full `/programmes/past-workshops` listing page is untouched and still reachable directly. **Verified live**: clicking expands 2→5 items in place, stays on `/programmes`, button disappears once expanded.
  - **`src/pages/Programmes.tsx`**, **`src/pages/Programmes.css`**
- **Recent workshop half-open only on hover — Done**, applied to both the Programmes preview and the full listing page for consistency.
  - **`src/pages/Programmes.tsx`**, **`src/pages/Programmes.css`**, **`src/pages/PastWorkshops.tsx`**, **`src/pages/PastWorkshops.css`**
  - **Verification note:** confirmed via computed styles that the row is collapsed by default (`display: none` on the thumb/snippet at rest); couldn't get a clean real-mouse `:hover` proof in this sandboxed browser pane, but the CSS uses the exact same `:hover`/`:focus-within` mechanism already proven working everywhere else on the site.
- **Individual past workshop layouts need fixing — not started.** Too vague without a specific reference; needs a live walkthrough or screenshot from you.
- **Raza image size — re-verified, still correct** (315:360 aspect ratio, matches Round 1 fix).
- **Raza "spotlight content" — real issue found and fixed.** The spotlight modal reuses `ArtworkDetailBody`'s hero, which is built for a full page (~100dvh) — inside a modal that's already viewport-sized, that meant scrolling almost a full screen before any real content (title, venue, materials) was visible. Capped the hero to `min(480px, 55vh)` inside the spotlight specifically, moved the BACK button to overlay on the hero (matching the artwork page's own hero-nav style) instead of sitting in dead padding above it, and removed the redundant top padding. NEXT button confirmed already present and working.
  - **`src/components/ScholarSpotlight.css`**
- **Raza 2 more artists — Blocked**, unchanged.
- **Residencies heading — No change**, already done in Round 1.
- **"Read more…" ellipsis styling — real bug found: wrong copy.** The Residencies band's link said "Learn more..." instead of "Read more..." as the doc asks. Fixed the text (styling — italic, 16px — was already correct and consistent with the rest of the site).
  - **`src/components/ResidenciesBand.tsx`**
- **Next/back arrows on Raza/Past Workshop detail pages — checked, already present.** `PastWorkshopDetail.tsx` has both BACK and NEXT (`CtaLink`). Raza doesn't use separate detail pages (confirmed live — it's the `ScholarSpotlight` modal, not routed pages; `RazaScholarshipDetail.tsx` was only ever planned, never actually built) — the modal has its own BACK/NEXT, both confirmed present and working live.

## 7. Old Editions — **Done**

- **"Previous year - back button is missing" — Done.** Added a `prevId` (older edition) alongside the existing `nextId` (newer edition) in `getEditionOverview()`, and a BACK link next to the existing "Next Edition" CTA, matching the site's standard BACK-link style. **Verified live** on `/editions/2018-19`: BACK correctly points to `/editions/2016-17` (older), NEXT to `/editions/2020-21` (newer).
  - **`src/data/editions.ts`**, **`src/pages/EditionOverview.tsx`**, **`src/pages/EditionOverview.css`**
- **"Follow the same headline style across the pages" — real bug found: same specificity issue as the earlier Programmes.tsx fix.** "CATALOGUE" / "THE TEAM" / "PARTICIPATING INSTITUTIONS" used `fig-label--sub` (500 weight, subtitle line-height) instead of the now-established `fig-subheading` convention (400 weight) used everywhere else. Switched all three, then found — and fixed — the *exact* specificity bug from Round 8: `fig-label` + `fig-subheading` combined defaults to 26px (fig-label's title-size) since `fig-subheading` never sets font-size on its own. Added the same scoped override pattern already used for Programmes.tsx. **Verified live**: 20px/400 weight, matching Curators/Artworks/Venues exactly.
  - **`src/pages/EditionOverview.tsx`**, **`src/pages/EditionOverview.css`**
- **Next/back button + slide indicators on every cover — still Blocked.** Waiting on the Figma link you said you'd share.
- **"Want to fix the layout" — not independently addressed**; likely covered by the fixes above, but too vague to confirm as fully resolved without your input.

---

## Outstanding decisions / blockers (cross-cutting)

- SB logo (About Us) — waiting on new asset.
- Curator portrait images — waiting on manually-cropped source files.
- 2 more Raza Scholarship artists — waiting on real names (not fabricated).
- Old Editions cover carousel (next/back + slide indicators) — waiting on a specific Figma link the client said they'd share.
- Materials & Dimensions "breaker" punctuation — exact character not yet specified by the client.
- Footer — explicitly left as-is; the Figma-vs-current-content conflict from earlier is unresolved but not blocking anything since no changes are being made there.
