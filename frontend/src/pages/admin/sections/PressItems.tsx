import { useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { swapSortOrder } from "../../../lib/admin/reorder";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import { MoveButtons } from "../../../components/admin/MoveButtons";
import type { SectionProps } from "./types";

interface PressItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  external_url: string | null;
  published_at: string | null;
  published: boolean;
  sort_order: number | null;
}

const EMPTY: Partial<PressItem> & { _image?: string } = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  external_url: "",
  published_at: new Date().toISOString().slice(0, 10),
  published: true,
  sort_order: 0,
  _image: "",
};

export function PressItems({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove, reload } = useSupabaseCrud<PressItem>(
    "press_items",
    { orderBy: "sort_order" },
  );
  const [editing, setEditing] = useState<(Partial<PressItem> & { _image?: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing?.title) return;
    setBusy(true);
    try {
      const { _image, ...data } = editing;
      void _image;
      if (!data.slug) data.slug = data.title!.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (data.sort_order == null) data.sort_order = rows.length;
      if (data.id) {
        const { id, ...patch } = data;
        await update(id, patch);
        notify("success", "Press item updated");
      } else {
        data.id = crypto.randomUUID();
        await create(data as never);
        notify("success", "Press item created");
      }
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: PressItem) => {
    if (!(await confirm(`Delete "${row.title}"?`))) return;
    try {
      await remove(row.id);
      notify("success", "Press item deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const move = async (row: PressItem, delta: -1 | 1) => {
    const index = rows.findIndex((r) => r.id === row.id);
    const neighbor = rows[index + delta];
    if (!neighbor) return;
    try {
      await swapSortOrder("press_items", row, neighbor);
      await reload();
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to reorder");
    }
  };

  if (loading) {
    return <div className="adm-loader"><div className="adm-spinner" /></div>;
  }

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Press</h2>
        <button
          className="adm-btn adm-btn--primary"
          onClick={() => setEditing({ ...EMPTY, sort_order: rows.length })}
        >
          + Add Article
        </button>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Use Up / Down to set the display order on the site.
      </p>

      {editing && (
        <div className="adm-card">
          <FormField label="Title / Heading" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} required />
          <FormField label="Slug" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} placeholder="Auto-generated" />
          <div className="adm-form-row">
            <FormField label="Published Date" value={editing.published_at ?? ""} onChange={(v) => setEditing({ ...editing, published_at: v })} type="date" />
            <FormField label="External URL" value={editing.external_url ?? ""} onChange={(v) => setEditing({ ...editing, external_url: v })} placeholder="https://..." />
          </div>
          <FormField label="Excerpt / Author" value={editing.excerpt ?? ""} onChange={(v) => setEditing({ ...editing, excerpt: v })} multiline />
          <FormField label="Content (Markdown)" value={editing.body ?? ""} onChange={(v) => setEditing({ ...editing, body: v })} multiline />
          <ImageUpload value={editing._image ?? ""} onChange={(v) => setEditing({ ...editing, _image: v })} />
          <div className="adm-form-actions">
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing.id ? "Update" : "Create"}
            </button>
            <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {rows.length === 0 && !editing ? (
        <div className="adm-empty">No press items yet.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--press">
            <colgroup>
              <col className="adm-col--title" />
              <col className="adm-col--date" />
              <col className="adm-col--order" />
              <col className="adm-col--pub" />
              <col className="adm-col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Order</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>
                    <div className="adm-table__clamp adm-table__clamp--2">{r.title}</div>
                  </td>
                  <td>{r.published_at ? new Date(r.published_at).toLocaleDateString() : "—"}</td>
                  <td>{r.sort_order ?? "—"}</td>
                  <td>{r.published ? "Yes" : "No"}</td>
                  <td>
                    <div className="adm-table__actions">
                      <MoveButtons index={i} total={rows.length} onMove={(delta) => move(r, delta)} />
                      <button
                        className="adm-btn adm-btn--secondary adm-btn--small"
                        onClick={() => setEditing({ ...r, _image: "" })}
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
        </div>
      )}
    </div>
  );
}
