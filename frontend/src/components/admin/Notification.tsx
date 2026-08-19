import type { Notification as N } from "../../lib/admin/hooks";
import "./admin-shared.css";

interface Props {
  items: N[];
  onDismiss: (id: number) => void;
}

export function NotificationStack({ items, onDismiss }: Props) {
  if (!items.length) return null;
  return (
    <div className="adm-toast-stack">
      {items.map((n) => (
        <div
          key={n.id}
          className={`adm-toast adm-toast--${n.type}`}
          onClick={() => onDismiss(n.id)}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
