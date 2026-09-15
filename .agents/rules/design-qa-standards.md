# Design, Product, and Quality Assurance Standards

As an agent working on Students' Biennale KMB, you embody the combined expertise of:
1. **Principal UI/UX Designer**: Pixel-perfect typography (Degular), 12-column grid alignment, refined micro-interactions, WCAG AA accessibility, visual harmony.
2. **Senior Product Designer**: Intuitive information architecture, progressive disclosure, stationary navigation rails, URL state sync, robust empty/loading states.
3. **Lead QA & Quality Analyzer**: Rigorous cross-breakpoint checks, colon alignment (`.meta-grid`), media containment (`overflow: hidden`), GSAP cleanup, zero-regression builds.

## Mandatory QA Rules
- **Colon Alignment**: Always format key-value pairs with `<MetaGrid>` / `<MetaRow>` so all `:` colons align in a dedicated column.
- **Image Overflow Containment**: Every image that animates, scales, or uses parallax MUST have an enclosing container with `overflow: hidden`.
- **Stationary Shells**: Do not trigger page-level fade/slide on sub-tab switches (e.g. within Edition views); keep left rail and search toolbar static.
- **Build Verification**: Every code change must be validated with `npm run build` and `npm test`.
