import { useEffect, useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { swapSortOrder } from "../../../lib/admin/reorder";
import { loadProgrammeImage, upsertProgrammeCover } from "../../../lib/admin/programmeAssets";
import { refreshProgrammes } from "../../../lib/programmes/cache";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import { MoveButtons } from "../../../components/admin/MoveButtons";
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

const EMPTY: Partial<Programme> & { _image?: string } = {
  title: "",
  slug: "",
  subtype: "workshop",
  state: "upcoming",
  dates: "",
  place: "",
  summary: "",
  body: "",
  published: true,
  sort_order: 0,
  _image: "",
};

export function Workshops({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove, reload } = useSupabaseCrud<Programme>(
    "programmes",
    { filter: { subtype: "workshop" }, orderBy: "sort_order" },
  );
  const [editing, setEditing] = useState<(Partial<Programme> & { _image?: string }) | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const row of rows) {
        next[row.id] =
          (await loadProgrammeImage(row.id, "cover")) ||
          (await loadProgrammeImage(row.id, "hero"));
      }
      if (!cancelled) setThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const openEdit = async (row?: Programme, defaultState: "upcoming" | "past" = "upcoming") => {
    if (!row) {
      setEditing({ ...EMPTY, state: defaultState });
      return;
    }
    const image =
      (await loadProgrammeImage(row.id, "cover")) ||
      (await loadProgrammeImage(row.id, "hero"));
    setEditing({ ...row, _image: image });
  };

  const save = async () => {
    if (!editing?.title) return;
    setBusy(true);
    try {
      const { _image, ...data } = editing;
      if (!data.slug) data.slug = data.title!.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const savedId = data.id ?? `programme-${data.slug}`;
      if (data.id) {
        const { id: rowId, ...patch } = data;
        await update(rowId, patch);
      } else {
        data.id = savedId;
        await create(data as never);
      }
      if (_image) await upsertProgrammeCover(savedId, _image, "cover");
      await reload();
      await refreshProgrammes();
      notify("success", editing.id ? "Workshop updated" : "Workshop created");
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: Programme) => {
    if (!(await confirm(`Delete workshop "${row.title}"?`))) return;
    try {
      await remove(row.id);
      await refreshProgrammes();
      notify("success", "Workshop deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const move = async (list: Programme[], row: Programme, delta: -1 | 1) => {
    const index = list.findIndex((r) => r.id === row.id);
    const neighbor = list[index + delta];
    if (!neighbor) return;
    try {
      await swapSortOrder("programmes", row, neighbor);
      await reload();
      await refreshProgrammes();
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to reorder");
    }
  };

  if (loading) {
    return <div className="adm-loader"><div className="adm-spinner" /></div>;
  }

  const upcoming = rows.filter((r) => r.state === "upcoming");
  const past = rows.filter((r) => r.state !== "upcoming");

  const renderTable = (label: string, list: Programme[], defaultState: "upcoming" | "past") => (
    <div style={{ marginBottom: 32 }}>
      <div className="adm-section__header">
        <h3 style={{ fontSize: 18, fontWeight: 500 }}>{label}</h3>
        <button
          className="adm-btn adm-btn--secondary adm-btn--small"
          onClick={() => openEdit(undefined, defaultState)}
        >
          + Add {defaultState === "upcoming" ? "upcoming" : "past"}
        </button>
      </div>
      {list.length === 0 ? (
        <div className="adm-empty">No {label.toLowerCase()} yet.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Image</th><th>Title</th><th>Dates</th><th>Place</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={r.id}>
                <td>{thumbs[r.id] ? <img src={thumbs[r.id]} alt="" className="adm-table__thumb" /> : "—"}</td>
                <td>{r.title}</td>
                <td>{r.dates || "—"}</td>
                <td>{r.place || "—"}</td>
                <td>
                  <div className="adm-table__actions">
                    <MoveButtons index={i} total={list.length} onMove={(delta) => move(list, r, delta)} />
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

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Workshops</h2>
      </div>
      <p className="adm-help">
        Upcoming workshops appear under UPCOMING WORKSHOPS. Past workshops appear under PAST
        WORKSHOPS (first five on `/programmes`, with View more / View less to expand in place).
      </p>

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
            <FormField label="Dates" value={editing.dates ?? ""} onChange={(v) => setEditing({ ...editing, dates: v })} placeholder="e.g. 12–15 Jan 2027" />
          </div>
          <FormField label="Place" value={editing.place ?? ""} onChange={(v) => setEditing({ ...editing, place: v })} />
          <FormField label="Summary" value={editing.summary ?? ""} onChange={(v) => setEditing({ ...editing, summary: v })} multiline />
          <FormField label="Body" value={editing.body ?? ""} onChange={(v) => setEditing({ ...editing, body: v })} multiline />
          <ImageUpload value={editing._image ?? ""} onChange={(v) => setEditing({ ...editing, _image: v })} />
          <div className="adm-form-actions">
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing.id ? "Update" : "Create"}
            </button>
            <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {renderTable("Upcoming workshops", upcoming, "upcoming")}
      {renderTable("Past workshops", past, "past")}
    </div>
  );
}
