import { useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import type { SectionProps } from "./types";

interface Cover {
  id: string;
  image_url: string;
  heading: string | null;
  body: string | null;
  sort_order: number;
  active: boolean;
}

const EMPTY = { image_url: "", heading: "", body: "", sort_order: 0, active: true };

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
    if (!(await confirm(`Delete cover "${row.heading || "Untitled"}"?`))) return;
    try {
      await remove(row.id);
      notify("success", "Cover deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
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
          onClick={() => setEditing({ ...EMPTY })}
        >
          + Add Cover
        </button>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        3 to 8 images for the hero slideshow. Each displays for 3–5 seconds.
      </p>

      {editing && (
        <div className="adm-card">
          <ImageUpload
            value={editing.image_url ?? ""}
            onChange={(v) => setEditing({ ...editing, image_url: v })}
          />
          <div className="adm-form-row">
            <FormField
              label="Heading"
              value={editing.heading ?? ""}
              onChange={(v) => setEditing({ ...editing, heading: v })}
              maxLength={50}
              placeholder="5–8 words"
            />
            <FormField
              label="Body"
              value={editing.body ?? ""}
              onChange={(v) => setEditing({ ...editing, body: v })}
              maxLength={100}
              placeholder="10–15 words"
            />
          </div>
          <FormField
            label="Sort Order"
            value={String(editing.sort_order ?? 0)}
            onChange={(v) =>
              setEditing({ ...editing, sort_order: parseInt(v) || 0 })
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
              <th>Heading</th>
              <th>Body</th>
              <th>Order</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="adm-table__thumb" />
                  )}
                </td>
                <td>{r.heading || "—"}</td>
                <td>{r.body || "—"}</td>
                <td>{r.sort_order}</td>
                <td>{r.active ? "Yes" : "No"}</td>
                <td>
                  <div className="adm-table__actions">
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
