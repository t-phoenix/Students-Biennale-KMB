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

export type JustifiedConfig = {
  baseIndex: number;
  justifiedIndex: number;
  baseSpacing: string;
};

/**
 * Editorial brand lockups where both lines MUST align flush on the left (first letters)
 * and flush on the right (last letters), forming a perfect typographic rectangle.
 */
export const JUSTIFIED_LOCKUPS: Record<string, JustifiedConfig> = {
  // EXPLORE is wider and sets container width; EDITION stretches to align left E with E and right E with N
  "EXPLORE EDITION": { baseIndex: 0, justifiedIndex: 1, baseSpacing: "0.135em" },
  // MORE is wider and sets container width; VIEW stretches to align left V with M and right W with E
  "VIEW MORE": { baseIndex: 1, justifiedIndex: 0, baseSpacing: "0.135em" },
  "VIEW LESS": { baseIndex: 1, justifiedIndex: 0, baseSpacing: "0.135em" },
  // MORE is wider and sets container width; READ stretches to align left R with M and right D with E
  "READ MORE": { baseIndex: 1, justifiedIndex: 0, baseSpacing: "0.135em" },
  "READ LESS": { baseIndex: 1, justifiedIndex: 0, baseSpacing: "0.135em" },
};

export const CTA_PHRASE_SPACINGS: Record<string, readonly string[]> = {
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
  const phrase = lines.map(getCtaLineText).join(" ").trim().toUpperCase();
  const justifiedConfig = !spacing ? JUSTIFIED_LOCKUPS[phrase] : undefined;

  const classes = [
    "cta-link",
    `cta-link--${dir}`,
    justifiedConfig ? "cta-link--justified" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {isLeft ? <BrandArrow direction="left" /> : null}
      <span className="cta-link__label" aria-hidden>
        {lines.map((line, i) => {
          const key = typeof line === "object" ? `${line.desktop}-${line.mobile}-${i}` : `${line}-${i}`;

          // Fully justified lockup (e.g. EXPLORE EDITION, VIEW MORE, READ MORE)
          if (justifiedConfig) {
            if (i === justifiedConfig.justifiedIndex) {
              const text = getCtaLineText(line).trim();
              const chars = Array.from(text);
              return (
                <span key={key} className="cta-link__line cta-link__line--justified">
                  {chars.map((char, charIdx) => (
                    <span key={charIdx}>{char}</span>
                  ))}
                </span>
              );
            }

            if (i === justifiedConfig.baseIndex) {
              const text = getCtaLineText(line).trim();
              const baseSpace = justifiedConfig.baseSpacing;
              return (
                <span
                  key={key}
                  className="cta-link__line cta-link__line--base"
                  style={{
                    letterSpacing: baseSpace,
                    marginRight: `-${baseSpace}`,
                  }}
                >
                  {text}
                </span>
              );
            }
          }

          // Default rendering for other / custom CTA links
          const currentSpacing =
            activeSpacing[i] ?? activeSpacing[activeSpacing.length - 1] ?? DEFAULT_CTA_LINE_SPACING;
          return (
            <span
              key={key}
              className="cta-link__line"
              style={{
                letterSpacing: currentSpacing,
                marginRight: `-${currentSpacing}`,
              }}
            >
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
