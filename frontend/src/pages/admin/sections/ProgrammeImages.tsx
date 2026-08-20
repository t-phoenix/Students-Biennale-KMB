import { useState, useEffect, useCallback } from "react";
import { requireSupabase } from "../../../lib/supabase";
import { loadProgrammeImage, upsertProgrammeCover } from "../../../lib/admin/programmeAssets";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import type { SectionProps } from "./types";

interface ProgrammeRow {
  id: string;
  title: string;
  subtype: string;
  image_url?: string;
}

export function ProgrammeImages({ notify }: SectionProps) {
  const [rows, setRows] = useState<ProgrammeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = requireSupabase();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: programmes } = await sb
      .from("programmes")
      .select("id, title, subtype")
      .in("subtype", ["workshop", "residency", "national-award", "international-award"])
      .order("subtype")
      .order("sort_order");

    if (!programmes) {
      setLoading(false);
      return;
    }

    const withImages = await Promise.all(
      programmes.map(async (p) => ({
        ...p,
        image_url:
          (await loadProgrammeImage(p.id, "cover")) ||
          (await loadProgrammeImage(p.id, "hero")),
      })),
    );
    setRows(withImages);
    setLoading(false);
  }, [sb]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImageChange = async (programmeId: string, url: string) => {
    try {
      await upsertProgrammeCover(programmeId, url, "cover");
      await upsertProgrammeCover(programmeId, url, "hero");
      setRows((prev) =>
        prev.map((r) => (r.id === programmeId ? { ...r, image_url: url } : r)),
      );
      notify("success", "Image updated");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to update image");
    }
  };

  if (loading) {
    return <div className="adm-loader"><div className="adm-spinner" /></div>;
  }

  const grouped = {
    workshop: rows.filter((r) => r.subtype === "workshop"),
    residency: rows.filter((r) => r.subtype === "residency"),
    "international-award": rows.filter((r) => r.subtype === "international-award"),
    "national-award": rows.filter((r) => r.subtype === "national-award"),
  };

  const labels: Record<string, string> = {
    workshop: "Workshops",
    residency: "Residencies",
    "international-award": "International Awards",
    "national-award": "National Awards",
  };

  return (
    <div className="adm-section">
      <h2 className="adm-section__title" style={{ marginBottom: 24 }}>Programme Cover Images</h2>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24 }}>
        These covers feed the programmes page, residencies band, and home thumbnails.
      </p>

      {Object.entries(grouped).map(([key, items]) =>
        items.length > 0 ? (
          <div key={key} style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>{labels[key]}</h3>
            {items.map((item) => (
              <div key={item.id} className="adm-card" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <strong>{item.title}</strong>
                </div>
                <div style={{ width: 280 }}>
                  <ImageUpload
                    value={item.image_url ?? ""}
                    onChange={(url) => handleImageChange(item.id, url)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null,
      )}

      {rows.length === 0 && (
        <div className="adm-empty">
          No programmes found. Create workshops, residencies, or awards first.
        </div>
      )}
    </div>
  );
}
