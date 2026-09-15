---
name: product-design-strategy
description: Senior Product Designer skillset for structuring user journeys, progressive disclosure, mental models, responsive UX across viewports, information architecture, and content discovery.
license: MIT
---

# Product Design Strategy

## Core Principles

### 1. Information Architecture & Navigation Hierarchy
- **Predictable Mental Models**:
  - Keep persistent shell elements (Left Rails, Filter bars, Search Toolbars) stationary during tab or view transitions to maintain spatial orientation.
  - When switching tabs, only animate the inner content catalogue grid/list with an unobtrusive `0.4s` crossfade.
- **Progressive Disclosure**:
  - Show key teasers or first items expanded (e.g. Press featured preview, top 3 awards), with collapsed single-line rows for dense scanning.
  - Provide intuitive triggers ("Know more...", "View More / View Less", "↗") with explicit expansion states.

### 2. State Resilience & Empty States
- **Graceful Degradation**:
  - Every view must have dedicated loading, empty, and error boundaries.
  - Fallback placeholders for missing images or unpopulated CMS fields with neutral backgrounds (`var(--color-neutral-gray-mid)`).
- **Responsive Adaptations**:
  - Seamless layout collapse from 12-column desktop grid to single-column / 2-column mobile layouts without horizontal overflow or clipping.

### 3. Contextual Discovery & User Friction Reduction
- Smooth scroll transitions to top upon detail selection.
- URL-driven state (`?article=id`, `?residency=slug`, hash links) to allow deep linking, shareability, and browser back/forward fidelity.
- Instant feedback on drawing/interactive canvas layers without blocking document reading.
