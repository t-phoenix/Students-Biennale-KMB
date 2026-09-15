---
name: ui-ux-design
description: Master-level UI/UX Design skillset for creating stunning, editorial, state-of-the-art web interfaces. Covers typography, strict grid alignment, micro-interactions, visual hierarchy, color harmony, accessibility, and modern interactive aesthetics.
license: MIT
---

# UI & UX Design Mastery

## Core Principles

### 1. Editorial Typography & Typographic Scale
- **Degular & Display Hierarchy**: Utilize the tailored typography tokens (`--type-title-size`, `--type-subtitle-size`, `--type-body-size`, `--type-caption-size`) consistently.
- **Leading & Measure**: Line heights must match visual proportions (e.g. 1.25–1.3 for headlines, 1.5–1.6 for body copy). Maximum reading measure between 45–75 characters per line (`max-width: 65ch` or 6-column span).
- **Kerning & Tracking**: Subtle letter spacing on uppercase labels (`letter-spacing: 0.05em` to `0.1em`), crisp baseline alignment for numerals and dates.

### 2. Strict 12-Column Grid & Spatial Rhythm
- **Figma 12-Column Alignment**:
  - Desktop: 12 equal columns, `60px` margins, `20px` gutters (`--grid-margin`, `--grid-gutter`).
  - Left Rail (cols 1–3) for sticky metadata, titles, navigation, and filters.
  - Core Content (cols 4–9) for narrative reading and feature imagery.
  - Auxiliary Content (cols 10–12) for secondary cards, notes, and pagination.
- **Optical Spacing**:
  - Gaps between sections: `56px` to `80px` desktop, `32px` to `48px` mobile.
  - Component inner padding: multiples of `4px` / `8px` (`--spacing-xs` through `--spacing-5xl`).

### 3. Visual Polish & Micro-Interactions
- **Interactive Affordances**:
  - Buttons and links must have subtle hover states: `opacity: 0.75;`, smooth transform transitions (`transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)`).
  - Hover cursor states with tactile feedback.
- **Contained Motion & Depth**:
  - Image scaling effects (e.g., hover zooms or parallax depth) MUST ALWAYS be clipped inside an `overflow: hidden` media container to prevent layout shifting or overlapping adjacent grid columns.

### 4. Accessibility & Contrast (WCAG AA+)
- Contrast ratio minimum 4.5:1 for body text, 3:1 for large display titles.
- Focus-visible outlines on keyboard navigation (`:focus-visible`).
- Screen reader accessibility: `aria-hidden="true"` on decorative icons and colons, descriptive `alt` tags or empty `alt=""` for decorative hero visuals.
- Respect `prefers-reduced-motion` at all times with graceful fallbacks.
