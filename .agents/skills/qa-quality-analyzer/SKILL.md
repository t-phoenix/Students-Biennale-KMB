---
name: qa-quality-analyzer
description: Expert QA Engineer, Visual Inspector, and Code Quality Analyzer skillset. Enforces pixel-perfection, Figma fidelity, colon/grid alignment checks, performance audits, edge-case validation, and regression prevention.
license: MIT
---

# Quality Assurance & Visual Analysis

## Quality Checklist & Validation Protocols

### 1. Visual & Layout Quality Audits
- **Alignment Checks**:
  - Verify that all colons (`:`) in metadata blocks are strictly aligned vertically via `.meta-grid` (`grid-template-columns: max-content 14px 1fr`).
  - Ensure margins and gutters strictly align with Figma 12-column grid lines.
- **Containment & Overflow**:
  - Ensure all parallax, hover-scale, and aspect-ratio images are wrapped in dedicated media containers (`[class*='__media']`) with `overflow: hidden;` and `position: relative;`.
  - Check that text columns have `min-width: 0;` to prevent grid blowout or text bleeding into adjacent columns.

### 2. Edge Case & Data Robustness Testing
- **Dynamic Content**:
  - Test with extra long titles, multi-paragraph text, missing images, single vs multiple artists, empty external links.
- **Null Safety**:
  - Ensure all arrays (e.g. `galleryImages`, `descriptionParas`, `artists`, `scholars`) have non-null fallbacks (`?? []`, `?? ""`).

### 3. Motion & Performance Integrity
- **GSAP Lifecycle & Memory Cleanup**:
  - Always clean up timelines, scroll triggers, and event listeners in `useGSAP` or `useEffect`.
  - Respect `prefersReducedMotion()` across all animated components.
- **Build & Bundle Validation**:
  - Run `npm run build` (`tsc -b && vite build`) and `npm test` before committing.
  - Zero TypeScript compiler errors or unhandled promises.
