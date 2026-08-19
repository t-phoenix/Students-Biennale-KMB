import { useEffect, useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import {
  loadProgrammeImage,
  loadProgrammeImages,
  replaceProgrammeGallery,
  upsertProgrammeCover,
} from "../../../lib/admin/programmeAssets";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import type { SectionProps } from "./types";

interface Programme {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  state: string;
  dates: string | null;
  place: string | null;
  summary: string | null;
  body: string | null;
  published: boolean;
  sort_order: number | null;
}

const EMPTY: Partial<Programme> & { _image?: string; _gallery?: string[] } = {
  title: "",
  slug: "",
  subtype: "residency",
  state: "past",
  dates: "",
  place: "",
  summary: "",
  body: "",
  published: true,
  sort_order: 0,
  _image: "",
  _gallery: [],
};

export function ResidenciesSection({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove, reload } = useSupabaseCrud<Programme>(
    "programmes",
    { filter: { subtype: "residency" }, orderBy: "sort_order" },
  );
  const [editing, setEditing] = useState<(Partial<Programme> & { _image?: string; _gallery?: string[] }) | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const openEdit = async (row?: Programme) => {
    if (!row) {
      setEditing({ ...EMPTY });
      return;
    }
    const [hero, gallery] = await Promise.all([
      loadProgrammeImage(row.id, "hero").then((url) => url || loadProgrammeImage(row.id, "cover")),
      loadProgrammeImages(row.id, "gallery"),
    ]);
    setEditing({ ...row, _image: hero, _gallery: gallery });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const row of rows) {
        next[row.id] =
          (await loadProgrammeImage(row.id, "hero")) ||
          (await loadProgrammeImage(row.id, "cover"));
      }
      if (!cancelled) setThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const save = async () => {
    if (!editing?.title) return;
    setBusy(true);
    try {
      const { _image, _gallery, ...data } = editing;
      if (!data.slug) data.slug = data.title!.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const savedId = data.id ?? `programme-${data.slug}`;
      if (data.id) {
        const { id: rowId, ...patch } = data;
        await update(rowId, patch);
      } else {
        data.id = savedId;
        await create(data as never);
      }
      if (_image) {
        await upsertProgrammeCover(savedId, _image, "cover");
        await upsertProgrammeCover(savedId, _image, "hero");
      }
      if (_gallery) await replaceProgrammeGallery(savedId, _gallery.filter(Boolean));
      await reload();
      notify("success", data.id && editing.id ? "Residency updated" : "Residency created");
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: Programme) => {
    if (!(await confirm(`Delete residency "${row.title}"?`))) return;
    try {
      await remove(row.id);
      notify("success", "Residency deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (loading) {
    return <div className="adm-loader"><div className="adm-spinner" /></div>;
  }

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Residencies</h2>
        <button className="adm-btn adm-btn--primary" onClick={() => openEdit()}>
          + Add Residency
        </button>
      </div>

      {editing && (
        <div className="adm-card">
          <FormField label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} required />
          <FormField label="Slug" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} placeholder="Auto-generated from title" />
          <div className="adm-form-row">
            <div className="adm-field">
              <label className="adm-field__label">State</label>
              <select className="adm-select" value={editing.state ?? "upcoming"} onChange={(e) => setEditing({ ...editing, state: e.target.value })}>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            <FormField label="Period / Dates" value={editing.dates ?? ""} onChange={(v) => setEditing({ ...editing, dates: v })} placeholder="e.g. Jan–Mar 2027" />
          </div>
          <FormField label="Venue" value={editing.place ?? ""} onChange={(v) => setEditing({ ...editing, place: v })} />
          <FormField label="Summary" value={editing.summary ?? ""} onChange={(v) => setEditing({ ...editing, summary: v })} multiline />
          <FormField label="Body" value={editing.body ?? ""} onChange={(v) => setEditing({ ...editing, body: v })} multiline />
          <label className="adm-field__label">Cover / hero</label>
          <ImageUpload value={editing._image ?? ""} onChange={(v) => setEditing({ ...editing, _image: v })} />
          <label className="adm-field__label">Gallery</label>
          {(editing._gallery ?? [""]).map((url, index) => (
            <ImageUpload
              key={index}
              value={url}
              onChange={(v) => {
                const gallery = [...(editing._gallery ?? [])];
                gallery[index] = v;
                setEditing({ ...editing, _gallery: gallery });
              }}
            />
          ))}
          <button
            type="button"
            className="adm-btn adm-btn--secondary adm-btn--small"
            onClick={() => setEditing({ ...editing, _gallery: [...(editing._gallery ?? []), ""] })}
          >
            + Add gallery image
          </button>
          <div className="adm-form-actions">
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing.id ? "Update" : "Create"}
            </button>
            <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {rows.length === 0 && !editing ? (
        <div className="adm-empty">No residencies yet.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Image</th><th>Title</th><th>Period</th><th>Venue</th><th>Published</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{thumbs[r.id] ? <img src={thumbs[r.id]} alt="" className="adm-table__thumb" /> : "—"}</td>
                <td>{r.title}</td>
                <td>{r.dates || "—"}</td>
                <td>{r.place || "—"}</td>
                <td>{r.published ? "Yes" : "No"}</td>
                <td>
                  <div className="adm-table__actions">
                    <button className="adm-btn adm-btn--secondary adm-btn--small" onClick={() => openEdit(r)}>Edit</button>
                    <button className="adm-btn adm-btn--danger adm-btn--small" onClick={() => handleDelete(r)}>Delete</button>
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
