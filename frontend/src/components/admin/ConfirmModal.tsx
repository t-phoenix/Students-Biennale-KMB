import "./admin-shared.css";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="adm-overlay" onClick={onCancel}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <p className="adm-modal__msg">{message}</p>
        <div className="adm-modal__actions">
          <button className="adm-btn adm-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="adm-btn adm-btn--danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
