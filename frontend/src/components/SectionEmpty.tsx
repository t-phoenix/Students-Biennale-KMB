import "./SectionEmpty.css";

type SectionEmptyProps = {
  children: string;
  className?: string;
  /** While data is still loading, "nothing published" would flash before the real content. */
  hidden?: boolean;
};

export function SectionEmpty({ children, className, hidden = false }: SectionEmptyProps) {
  if (hidden) return null;
  return (
    <p className={`section-empty fig-body fig-c4-12${className ? ` ${className}` : ""}`}>
      {children}
    </p>
  );
}
