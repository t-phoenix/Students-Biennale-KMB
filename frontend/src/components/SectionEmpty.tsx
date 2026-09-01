import "./SectionEmpty.css";

type SectionEmptyProps = {
  children: string;
  className?: string;
};

export function SectionEmpty({ children, className }: SectionEmptyProps) {
  return (
    <p className={`section-empty fig-body fig-c4-12${className ? ` ${className}` : ""}`}>
      {children}
    </p>
  );
}
