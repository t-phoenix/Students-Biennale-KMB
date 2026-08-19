export interface SectionProps {
  notify: (type: "success" | "error", message: string) => void;
  confirm: (message: string) => Promise<boolean>;
}
