import { useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { swapSortOrder } from "../../../lib/admin/reorder";
import { requireSupabase } from "../../../lib/supabase";
import { refreshPressItems } from "../../../lib/pressCms";
import { slugify } from "../../../lib/admin/slugify";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import { MoveButtons } from "../../../components/admin/MoveButtons";
import {
  VisibilityColumnHeader,
  VisibilityField,
  VisibilityRowToggle,
  hiddenRowClass,
} from "../../../components/admin/VisibilityToggle";
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

async function loadPressImage(entityId: string): Promise<string> {
  const sb = requireSupabase();
  const { data } = await sb
    .from("asset_links")
    .select("assets(public_url, storage_path, status)")
    .eq("entity_type", "press_item")
    .eq("entity_id", entityId)
    .eq("role", "cover")
    .limit(1)
    .maybeSingle();
  const asset = data?.assets as
    | { public_url: string | null; storage_path: string | null; status: string }
    | { public_url: string | null; storage_path: string | null; status: string }[]
    | null
    | undefined;
  const row = Array.isArray(asset) ? asset[0] : asset;
  if (!row || row.status === "failed") return "";
  return row.public_url || row.storage_path || "";
}

async function upsertPressImage(entityId: string, url: string) {
  const sb = requireSupabase();
  const { data: existing } = await sb
    .from("asset_links")
    .select("asset_id")
    .eq("entity_type", "press_item")
    .eq("entity_id", entityId)
    .eq("role", "cover")
    .maybeSingle();

  if (existing?.asset_id) {
    const { error } = await sb
      .from("assets")
      .update({ public_url: url, status: "ready", variant: "card" } as never)
      .eq("id", existing.asset_id);
    if (error) throw error;
  } else {
    const assetId = `cms-cover-press-${entityId}`;
    const { error: assetError } = await sb.from("assets").upsert(
      {
        id: assetId,
        bucket: "sb-assets-public",
        storage_path: `cms/press/${entityId}/cover`,
        public_url: url,
        variant: "card",
        status: "ready",
        sort_order: 0,
      } as never,
      { onConflict: "id" },
    );
    if (assetError) throw assetError;
    const { error: linkError } = await sb.from("asset_links").upsert(
      {
        asset_id: assetId,
        entity_type: "press_item",
        entity_id: entityId,
        role: "cover",
      } as never,
    );
    if (linkError) throw linkError;
  }
}

export function PressItems({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove, reload } = useSupabaseCrud<PressItem>(
    "press_items",
    { orderBy: "sort_order" },
  );
  const [editing, setEditing] = useState<(Partial<PressItem> & { _image?: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const openEdit = async (row?: PressItem) => {
    if (!row) {
      setEditing({ ...EMPTY, sort_order: rows.length });
      return;
    }
    const image = await loadPressImage(row.id);
    setEditing({ ...row, _image: image });
  };

  const save = async () => {
    if (!editing?.title) return;
    setBusy(true);
    try {
      const { _image, ...data } = editing;
      data.slug = slugify(data.title!);
      if (data.sort_order == null) data.sort_order = rows.length;
      const savedId = data.id ?? crypto.randomUUID();
      if (data.id) {
        const { id, ...patch } = data;
        await update(id, patch);
        notify("success", "Press item updated");
      } else {
        data.id = savedId;
        await create(data as never);
        notify("success", "Press item created");
      }
      if (_image) await upsertPressImage(savedId, _image);
      await refreshPressItems();
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (row: PressItem) => {
    try {
      await update(row.id, { published: !row.published });
      try {
        await refreshPressItems();
      } catch {
        /* public cache refresh is best-effort */
      }
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to update visibility");
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
          onClick={() => openEdit()}
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
          <div className="adm-form-row">
            <FormField label="Published Date" value={editing.published_at ?? ""} onChange={(v) => setEditing({ ...editing, published_at: v })} type="date" />
            <FormField label="External URL" value={editing.external_url ?? ""} onChange={(v) => setEditing({ ...editing, external_url: v })} placeholder="https://..." />
          </div>
          <FormField label="Excerpt / Author" value={editing.excerpt ?? ""} onChange={(v) => setEditing({ ...editing, excerpt: v })} multiline />
          <FormField label="Content (Markdown)" value={editing.body ?? ""} onChange={(v) => setEditing({ ...editing, body: v })} multiline />
          <ImageUpload value={editing._image ?? ""} onChange={(v) => setEditing({ ...editing, _image: v })} />
          <VisibilityField
            visible={editing.published !== false}
            onChange={(visible) => setEditing({ ...editing, published: visible })}
          />
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
              <col className="adm-col--show" />
              <col className="adm-col--title" />
              <col className="adm-col--date" />
              <col className="adm-col--order" />
              <col className="adm-col--pub" />
              <col className="adm-col--actions" />
            </colgroup>
            <thead>
              <tr>
                <VisibilityColumnHeader />
                <th>Title</th>
                <th>Date</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={hiddenRowClass(r.published)}>
                  <td>
                    <VisibilityRowToggle
                      visible={r.published}
                      onToggle={() => togglePublished(r)}
                    />
                  </td>
                  <td>
                    <div className="adm-table__clamp adm-table__clamp--2">{r.title}</div>
                  </td>
                  <td>{r.published_at ? new Date(r.published_at).toLocaleDateString() : "—"}</td>
                  <td>{r.sort_order ?? "—"}</td>
                  <td>
                    <div className="adm-table__actions">
                      <MoveButtons index={i} total={rows.length} onMove={(delta) => move(r, delta)} />
                      <button
                        className="adm-btn adm-btn--secondary adm-btn--small"
                        onClick={() => openEdit(r)}
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
