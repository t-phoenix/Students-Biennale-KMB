type Props = {
  index: number;
  total: number;
  onMove: (delta: -1 | 1) => void;
  disabled?: boolean;
};

/** Compact ↑ / ↓ reorder controls for admin tables. */
export function MoveButtons({ index, total, onMove, disabled }: Props) {
  return (
    <>
      <button
        type="button"
        className="adm-btn adm-btn--secondary adm-btn--small adm-btn--icon"
        onClick={() => onMove(-1)}
        disabled={disabled || index <= 0}
        aria-label="Move up"
        title="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="adm-btn adm-btn--secondary adm-btn--small adm-btn--icon"
        onClick={() => onMove(1)}
        disabled={disabled || index >= total - 1}
        aria-label="Move down"
        title="Move down"
      >
        ↓
      </button>
    </>
  );
}
