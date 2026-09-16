import type { ReactNode } from "react";

type Props = {
  text: string;
  className?: string;
  as?: "p" | "span" | "div";
};

/**
 * Renders markdown-lite used in catalogue notes:
 * - paragraphs separated by blank lines (caller may pre-split)
 * - *italic* / **bold** / ***both***
 *
 * Does not change layout — only inline emphasis inside existing type styles.
 */
export function FormattedText({ text, className, as: Tag = "span" }: Props) {
  return <Tag className={className}>{renderInline(text)}</Tag>;
}

/** Split on blank lines into paragraphs, each with inline markdown. */
export function FormattedParagraphs({
  text,
  paragraphClassName,
  className,
}: {
  text: string;
  paragraphClassName?: string;
  className?: string;
}) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={className}>
      {paras.map((para, i) => (
        <p key={`${i}-${para.slice(0, 24)}`} className={paragraphClassName}>
          {renderInline(para)}
        </p>
      ))}
    </div>
  );
}

const TOKEN =
  /(\*\*\*[^*\n]+?\*\*\*|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g;

function renderInline(text: string): ReactNode[] {
  // Preserve intentional single newlines as spaces (CSS collapses anyway).
  const normalized = text.replace(/\n+/g, " ").replace(/[ \t]{2,}/g, " ");
  const parts = normalized.split(TOKEN);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      return (
        <strong key={i}>
          <em>{part.slice(3, -3).trim()}</em>
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2).trim()}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1).trim()}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}
