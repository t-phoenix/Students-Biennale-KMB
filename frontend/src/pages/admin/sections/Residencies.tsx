import { useEffect, useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { swapSortOrder } from "../../../lib/admin/reorder";
import {
  loadProgrammeImage,
  loadProgrammeImages,
  replaceProgrammeGallery,
  upsertProgrammeCover,
} from "../../../lib/admin/programmeAssets";
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
  host: string | null;
  dates: string | null;
  place: string | null;
  awardees: string | null;
  body: string | null;
  published: boolean;
  sort_order: number | null;
}

const EMPTY: Partial<Programme> & { _image?: string; _gallery?: string[] } = {
  title: "",
  slug: "",
  subtype: "residency",
  state: "past",
  host: "",
  dates: "",
  place: "",
  awardees: "",
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
      const payload = {
        ...data,
        // Shared programmes.state column is required by DB; residencies don't use upcoming/past UX.
        state: "past" as const,
        subtype: "residency",
        host: data.host?.trim() || null,
        dates: data.dates?.trim() || null,
        place: data.place?.trim() || null,
        awardees: data.awardees?.trim() || null,
        body: data.body?.trim() || null,
      };
      if (payload.id) {
        const { id: rowId, ...patch } = payload;
        await update(rowId, patch);
      } else {
        payload.id = savedId;
        await create(payload as never);
      }
      if (_image) {
        await upsertProgrammeCover(savedId, _image, "cover");
        await upsertProgrammeCover(savedId, _image, "hero");
      }
      if (_gallery) await replaceProgrammeGallery(savedId, _gallery.filter(Boolean));
      await reload();
      await refreshProgrammes();
      notify("success", editing.id ? "Residency updated" : "Residency created");
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
      await refreshProgrammes();
      notify("success", "Residency deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const move = async (row: Programme, delta: -1 | 1) => {
    const index = rows.findIndex((r) => r.id === row.id);
    const neighbor = rows[index + delta];
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
    return (
      <div className="adm-loader">
        <div className="adm-spinner" />
      </div>
    );
  }

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Residencies</h2>
        <button className="adm-btn adm-btn--primary" onClick={() => openEdit()}>
          + Add Residency
        </button>
      </div>
      <p className="adm-help">
        All residencies appear in the `/programmes#residencies` band and on the detail page. Title,
        Host, Period, Venue, and Awardees show in the meta block; Description fills the card teaser
        and full page body.
      </p>

      {editing && (
        <div className="adm-card">
          <FormField
            label="Title"
            value={editing.title ?? ""}
            onChange={(v) => setEditing({ ...editing, title: v })}
            required
          />
          <FormField
            label="Slug"
            value={editing.slug ?? ""}
            onChange={(v) => setEditing({ ...editing, slug: v })}
            placeholder="Auto-generated from title"
          />
          <FormField
            label="Host"
            value={editing.host ?? ""}
            onChange={(v) => setEditing({ ...editing, host: v })}
            placeholder="e.g. KBF"
          />
          <div className="adm-form-row">
            <FormField
              label="Period"
              value={editing.dates ?? ""}
              onChange={(v) => setEditing({ ...editing, dates: v })}
              placeholder="e.g. 10 June – 10 July 2026"
            />
            <FormField
              label="Venue"
              value={editing.place ?? ""}
              onChange={(v) => setEditing({ ...editing, place: v })}
              placeholder="e.g. SMS Hall, Mattancherry"
            />
          </div>
          <FormField
            label="Awardees"
            value={editing.awardees ?? ""}
            onChange={(v) => setEditing({ ...editing, awardees: v })}
            placeholder="e.g. Name & Name"
          />
          <FormField
            label="Description"
            value={editing.body ?? ""}
            onChange={(v) => setEditing({ ...editing, body: v })}
            multiline
            placeholder="Full residency description (separate paragraphs with a blank line)"
          />
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
            <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !editing ? (
        <div className="adm-empty">No residencies yet.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th className="adm-table__cell--meta">Image</th>
                <th>Title</th>
                <th>Host</th>
                <th className="adm-table__cell--date">Period</th>
                <th>Awardees</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{thumbs[r.id] ? <img src={thumbs[r.id]} alt="" className="adm-table__thumb" /> : "—"}</td>
                  <td>
                    <div className="adm-table__clamp adm-table__clamp--2">{r.title}</div>
                  </td>
                  <td>
                    <div className="adm-table__clamp adm-table__clamp--2">{r.host || "—"}</div>
                  </td>
                  <td>
                    <div className="adm-table__ellipsis">{r.dates || "—"}</div>
                  </td>
                  <td>
                    <div className="adm-table__clamp adm-table__clamp--2">{r.awardees || "—"}</div>
                  </td>
                  <td>
                    <div className="adm-table__actions">
                      <MoveButtons index={i} total={rows.length} onMove={(delta) => move(r, delta)} />
                      <button className="adm-btn adm-btn--secondary adm-btn--small" onClick={() => openEdit(r)}>
                        Edit
                      </button>
                      <button className="adm-btn adm-btn--danger adm-btn--small" onClick={() => handleDelete(r)}>
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
