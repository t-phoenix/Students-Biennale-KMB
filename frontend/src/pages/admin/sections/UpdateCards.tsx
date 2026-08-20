import { useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { swapUpdateCardSlots } from "../../../lib/admin/reorder";
import { FormField } from "../../../components/admin/FormField";
import { MoveButtons } from "../../../components/admin/MoveButtons";
import type { SectionProps } from "./types";

interface Card {
  id: string;
  slot: number;
  heading: string;
  body: string;
  link_url: string | null;
  link_external: boolean;
  card_type: string;
  active: boolean;
}

const CARD_TYPES = ["general", "programmes", "news"] as const;

export function UpdateCards({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove, reload } = useSupabaseCrud<Card>(
    "update_cards",
    { orderBy: "slot" },
  );
  const [editing, setEditing] = useState<Partial<Card> | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing?.heading || !editing?.body) return;
    setBusy(true);
    try {
      const payload = {
        ...editing,
        link_url: editing.link_url?.trim() || null,
      };
      if (editing.id) {
        const id = editing.id;
        const { id: _rowId, ...patch } = payload;
        await update(id, patch);
        notify("success", "Card updated");
      } else {
        await create(payload as never);
        notify("success", "Card created");
      }
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: Card) => {
    if (!(await confirm(`Delete card slot ${row.slot}?`))) return;
    try {
      await remove(row.id);
      notify("success", "Card deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const move = async (row: Card, delta: -1 | 1) => {
    const index = rows.findIndex((r) => r.id === row.id);
    const neighbor = rows[index + delta];
    if (!neighbor) return;
    try {
      await swapUpdateCardSlots(row, neighbor);
      await reload();
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to reorder");
    }
  };

  if (loading) {
    return (
      <div className="adm-loader">
        <div className="adm-spinner" />
      </div>
    );
  }

  const usedSlots = rows.map((r) => r.slot);

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Update Cards</h2>
        {rows.length < 3 && (
          <button
            className="adm-btn adm-btn--primary"
            onClick={() => {
              const nextSlot = [1, 2, 3].find((s) => !usedSlots.includes(s)) ?? 1;
              setEditing({
                slot: nextSlot,
                heading: "",
                body: "",
                link_url: "",
                link_external: false,
                card_type: "general",
                active: true,
              });
            }}
          >
            + Add Card
          </button>
        )}
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Max 3 update cards on the home page. Each has a heading (30–60 chars), body (80–140
        chars), and an optional link. Internal links use site paths like /programmes; external
        links open in a new tab.
      </p>

      {editing && (
        <div className="adm-card">
          <div className="adm-form-row">
            <div className="adm-field">
              <label className="adm-field__label">Slot</label>
              <select
                className="adm-select"
                value={editing.slot ?? 1}
                onChange={(e) =>
                  setEditing({ ...editing, slot: Number(e.target.value) })
                }
              >
                {[1, 2, 3].map((s) => (
                  <option key={s} value={s} disabled={usedSlots.includes(s) && editing.slot !== s}>
                    Slot {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-field__label">Type</label>
              <select
                className="adm-select"
                value={editing.card_type ?? "general"}
                onChange={(e) =>
                  setEditing({ ...editing, card_type: e.target.value })
                }
              >
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <FormField
            label="Heading"
            value={editing.heading ?? ""}
            onChange={(v) => setEditing({ ...editing, heading: v })}
            maxLength={60}
            required
            placeholder="5–10 words"
          />
          <FormField
            label="Body"
            value={editing.body ?? ""}
            onChange={(v) => setEditing({ ...editing, body: v })}
            maxLength={140}
            required
            multiline
            placeholder="15–25 words"
          />
          <FormField
            label="Link URL"
            value={editing.link_url ?? ""}
            onChange={(v) => setEditing({ ...editing, link_url: v })}
            placeholder="/programmes or https://example.com"
          />
          <div className="adm-field">
            <label className="adm-field__label">
              <input
                type="checkbox"
                checked={editing.link_external ?? false}
                onChange={(e) =>
                  setEditing({ ...editing, link_external: e.target.checked })
                }
                style={{ marginRight: 8 }}
              />
              Open link in new tab (external)
            </label>
          </div>
          <div className="adm-form-actions">
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing.id ? "Update" : "Create"}
            </button>
            <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !editing ? (
        <div className="adm-empty">No update cards yet.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Type</th>
              <th>Heading</th>
              <th>Body</th>
              <th>Link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{r.slot}</td>
                <td>{r.card_type}</td>
                <td>{r.heading}</td>
                <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.body}
                </td>
                <td>{r.link_url || "—"}</td>
                <td>
                  <div className="adm-table__actions">
                    <MoveButtons index={i} total={rows.length} onMove={(delta) => move(r, delta)} />
                    <button
                      className="adm-btn adm-btn--secondary adm-btn--small"
                      onClick={() => setEditing({ ...r })}
                    >
                      Edit
                    </button>
                    <button
                      className="adm-btn adm-btn--danger adm-btn--small"
                      onClick={() => handleDelete(r)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
