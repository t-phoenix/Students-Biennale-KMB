import { Link } from "react-router-dom";
import { BrandArrow, type BrandArrowDirection } from "./BrandArrow";
import "./CtaLink.css";

export type CtaLineItem = string | { desktop: string; mobile: string };

export type CtaLinkProps = {
  /** Omit to render a button instead of a link. */
  to?: string;
  /** Rendered one per line, uppercase — e.g. ["VIEW", "MORE"] or ["EXPLORE", "EDITION"]. */
  lines: readonly CtaLineItem[];
  /** Per-line letter-spacing (CSS length, e.g. "0.135em"), matched by index to `lines`. If omitted, automatically resolved from Figma component tokens. */
  spacing?: readonly string[];
  /**
   * Explicit arrow orientation.
   * If omitted, automatically resolved:
   * - "VIEW MORE" / "EXPLORE MORE" -> "down"
   * - "VIEW LESS" / "COLLAPSE" -> "up"
   * - "BACK" / "PREV" -> "left"
   * - default -> "right"
   */
  direction?: BrandArrowDirection;
  /** Kept for backwards compatibility */
  variant?: "chevron" | "next";
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

/** Exact letter-spacing definitions matching Figma components (nodes 1445-316, 1445-352, 1445-297, 1445-371) */
export const CTA_PHRASE_SPACINGS: Record<string, readonly string[]> = {
  // Figma 1445:316 — EXPLORE = 13.5% (0.135em), EDITION = 20% (0.2em)
  "EXPLORE EDITION": ["0.135em", "0.2em"],
  // Figma 1445:352 — VIEW = 24% (0.24em), MORE = 13.5% (0.135em)
  "VIEW MORE": ["0.24em", "0.135em"],
  "VIEW LESS": ["0.24em", "0.135em"],
  // Figma 1445:297 — READ = 22% (0.22em), MORE = 13.5% (0.135em)
  "READ MORE": ["0.22em", "0.135em"],
  "READ LESS": ["0.22em", "0.135em"],
  // Figma 1445:371 — NEXT = 13.5% (0.135em), ARTWORK = 13.5% (0.135em)
  "NEXT ARTWORK": ["0.135em", "0.135em"],
  "NEXT EDITION": ["0.135em", "0.2em"],
  "DISCOVER ARTWORKS": ["0.135em", "0.135em"],
};

export const CTA_WORD_SPACINGS: Record<string, string> = {
  EXPLORE: "0.135em",
  EDITION: "0.2em",
  VIEW: "0.24em",
  READ: "0.22em",
  MORE: "0.135em",
  LESS: "0.135em",
  NEXT: "0.135em",
  ARTWORK: "0.135em",
  ARTWORKS: "0.135em",
  DISCOVER: "0.135em",
};

export const DEFAULT_CTA_LINE_SPACING = "0.135em";

export function getCtaLineText(item: CtaLineItem): string {
  return typeof item === "object" ? item.desktop : item;
}

export function resolveCtaSpacing(
  lines: readonly CtaLineItem[],
  explicit?: readonly string[]
): readonly string[] {
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  const phrase = lines.map(getCtaLineText).join(" ").trim().toUpperCase();
  if (CTA_PHRASE_SPACINGS[phrase]) {
    return CTA_PHRASE_SPACINGS[phrase];
  }
  return lines.map((item) => {
    const word = getCtaLineText(item).trim().toUpperCase();
    return CTA_WORD_SPACINGS[word] ?? DEFAULT_CTA_LINE_SPACING;
  });
}

export function resolveCtaDirection(
  lines: readonly CtaLineItem[],
  explicit?: BrandArrowDirection
): BrandArrowDirection {
  if (explicit) return explicit;
  const joined = lines.map(getCtaLineText).join(" ").toUpperCase();
  if (joined.includes("VIEW MORE") || joined.includes("EXPLORE MORE")) {
    return "down";
  }
  if (joined.includes("VIEW LESS") || joined.includes("COLLAPSE")) {
    return "up";
  }
  if (joined.includes("BACK") || joined.includes("PREV")) {
    return "left";
  }
  return "right";
}

export function CtaLink({
  to,
  lines,
  spacing,
  direction,
  className,
  onClick,
  ariaLabel,
}: CtaLinkProps) {
  const dir = resolveCtaDirection(lines, direction);
  const activeSpacing = resolveCtaSpacing(lines, spacing);
  const label = ariaLabel ?? lines.map(getCtaLineText).join(" ");
  const isLeft = dir === "left";
  const classes = ["cta-link", `cta-link--${dir}`, className].filter(Boolean).join(" ");

  const content = (
    <>
      {isLeft ? <BrandArrow direction="left" /> : null}
      <span className="cta-link__label" aria-hidden>
        {lines.map((line, i) => {
          const key = typeof line === "object" ? `${line.desktop}-${line.mobile}-${i}` : `${line}-${i}`;
          const currentSpacing =
            activeSpacing[i] ?? activeSpacing[activeSpacing.length - 1] ?? DEFAULT_CTA_LINE_SPACING;
          return (
            <span key={key} style={{ letterSpacing: currentSpacing }}>
              {typeof line === "object" ? (
                <>
                  <span className="cta-link__line-desktop">{line.desktop}</span>
                  <span className="cta-link__line-mobile">{line.mobile}</span>
                </>
              ) : (
                line
              )}
            </span>
          );
        })}
      </span>
      {!isLeft ? <BrandArrow direction={dir} /> : null}
    </>
  );

  if (!to) {
    return (
      <button type="button" onClick={onClick} aria-label={label} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} onClick={onClick} aria-label={label} className={classes}>
      {content}
    </Link>
  );
}
