import { useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import { MoveButtons } from "../../../components/admin/MoveButtons";
import type { SectionProps } from "./types";

interface Cover {
  id: string;
  image_url: string;
  artwork_name: string | null;
  artist: string | null;
  institution: string | null;
  sort_order: number;
  active: boolean;
}

const EMPTY = {
  image_url: "",
  artwork_name: "",
  artist: "",
  institution: "",
  sort_order: 0,
  active: true,
};

export function HomeCovers({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove } = useSupabaseCrud<Cover>(
    "home_covers",
    { orderBy: "sort_order" },
  );
  const [editing, setEditing] = useState<Partial<Cover> | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing?.image_url) return;
    setBusy(true);
    try {
      if (editing.id) {
        const { id, ...patch } = editing;
        await update(id, patch);
        notify("success", "Cover updated");
      } else {
        await create(editing as never);
        notify("success", "Cover created");
      }
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: Cover) => {
    if (!(await confirm(`Delete cover "${row.artwork_name || "Untitled"}"?`))) return;
    try {
      await remove(row.id);
      notify("success", "Cover deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const move = async (row: Cover, delta: -1 | 1) => {
    const next = row.sort_order + delta;
    if (next < 0 || next >= rows.length) return;
    try {
      await update(row.id, { sort_order: next });
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

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Home Covers</h2>
        <button
          className="adm-btn adm-btn--primary"
          onClick={() => setEditing({ ...EMPTY, sort_order: 0 })}
        >
          + Add Cover
        </button>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        3 to 8 images for the hero slideshow. Each displays for 3–5 seconds. Artwork name, artist,
        and institution map to the three credit lines on the home hero. Sort order is 0-based:
        saving at 0 inserts at the front and shifts the rest down. Use Up/Down to swap.
      </p>

      {editing && (
        <div className="adm-card">
          <ImageUpload
            value={editing.image_url ?? ""}
            onChange={(v) => setEditing({ ...editing, image_url: v })}
          />
          <FormField
            label="Artwork Name"
            value={editing.artwork_name ?? ""}
            onChange={(v) => setEditing({ ...editing, artwork_name: v })}
            maxLength={50}
            placeholder="As shown on the hero"
            required
          />
          <div className="adm-form-row">
            <FormField
              label="Artist"
              value={editing.artist ?? ""}
              onChange={(v) => setEditing({ ...editing, artist: v })}
              maxLength={80}
              placeholder="Artist name"
            />
            <FormField
              label="Institution"
              value={editing.institution ?? ""}
              onChange={(v) => setEditing({ ...editing, institution: v })}
              maxLength={100}
              placeholder="College or institution"
            />
          </div>
          <FormField
            label="Sort Order"
            value={String(editing.sort_order ?? 0)}
            onChange={(v) =>
              setEditing({ ...editing, sort_order: Number.isNaN(parseInt(v, 10)) ? 0 : parseInt(v, 10) })
            }
            type="number"
          />
          <div className="adm-form-actions">
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing.id ? "Update" : "Create"}
            </button>
            <button
              className="adm-btn adm-btn--ghost"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !editing ? (
        <div className="adm-empty">No covers yet. Add your first hero image.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Artwork</th>
              <th>Artist</th>
              <th>Institution</th>
              <th>Order</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="adm-table__thumb" />
                  )}
                </td>
                <td>{r.artwork_name || "—"}</td>
                <td>{r.artist || "—"}</td>
                <td>{r.institution || "—"}</td>
                <td>{r.sort_order}</td>
                <td>{r.active ? "Yes" : "No"}</td>
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
