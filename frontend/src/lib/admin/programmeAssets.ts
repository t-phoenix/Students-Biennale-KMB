import { requireSupabase } from "../supabase";
import { refreshProgrammes } from "../programmes";

export async function loadProgrammeImage(
  entityId: string,
  role: "cover" | "hero" | "gallery" = "cover",
): Promise<string> {
  const sb = requireSupabase();
  const { data } = await sb
    .from("asset_links")
    .select("assets(public_url, storage_path, variant, status)")
    .eq("entity_type", "programme")
    .eq("entity_id", entityId)
    .eq("role", role)
    .limit(1)
    .maybeSingle();
  const asset = (data?.assets as
    | { public_url: string | null; storage_path: string | null; status: string }
    | { public_url: string | null; storage_path: string | null; status: string }[]
    | null
    | undefined);
  const row = Array.isArray(asset) ? asset[0] : asset;
  if (!row || row.status === "failed") return "";
  if (row.public_url) return row.public_url;
  if (row.storage_path?.startsWith("http") || row.storage_path?.startsWith("/")) {
    return row.storage_path;
  }
  return "";
}

export async function loadProgrammeImages(
  entityId: string,
  role: "cover" | "hero" | "gallery",
): Promise<string[]> {
  const sb = requireSupabase();
  const { data } = await sb
    .from("asset_links")
    .select("assets(public_url, storage_path, status, sort_order)")
    .eq("entity_type", "programme")
    .eq("entity_id", entityId)
    .eq("role", role);
  return (data ?? [])
    .map((link) => {
      const raw = link.assets as
        | { public_url: string | null; storage_path: string | null; status: string; sort_order: number }
        | { public_url: string | null; storage_path: string | null; status: string; sort_order: number }[]
        | null;
      const asset = Array.isArray(raw) ? raw[0] : raw;
      if (!asset || asset.status === "failed") return "";
      return asset.public_url || asset.storage_path || "";
    })
    .filter(Boolean);
}

/** Replace the cover/hero image for a programme, keeping a public_url the frontend can render. */
export async function upsertProgrammeCover(entityId: string, url: string, role: "cover" | "hero" = "cover") {
  const sb = requireSupabase();
  const { data: existing } = await sb
    .from("asset_links")
    .select("asset_id")
    .eq("entity_type", "programme")
    .eq("entity_id", entityId)
    .eq("role", role)
    .maybeSingle();

  if (existing?.asset_id) {
    const { error } = await sb
      .from("assets")
      .update({
        public_url: url,
        status: "ready",
        variant: role === "hero" ? "hero" : "card",
      } as never)
      .eq("id", existing.asset_id);
    if (error) throw error;
  } else {
    const assetId = `cms-${role}-${entityId}`;
    const { error: assetError } = await sb.from("assets").upsert(
      {
        id: assetId,
        bucket: "sb-assets-public",
        storage_path: `cms/${entityId}/${role}`,
        public_url: url,
        variant: role === "hero" ? "hero" : "card",
        status: "ready",
        sort_order: 0,
      } as never,
      { onConflict: "id" },
    );
    if (assetError) throw assetError;
    const { error: linkError } = await sb.from("asset_links").upsert(
      {
        asset_id: assetId,
        entity_type: "programme",
        entity_id: entityId,
        role,
      } as never,
    );
    if (linkError) throw linkError;
  }
  await refreshProgrammes();
}

export async function replaceProgrammeGallery(entityId: string, urls: string[]) {
  const sb = requireSupabase();
  const { data: existing } = await sb
    .from("asset_links")
    .select("asset_id")
    .eq("entity_type", "programme")
    .eq("entity_id", entityId)
    .eq("role", "gallery");
  const ids = (existing ?? []).map((row) => row.asset_id);
  if (ids.length) {
    await sb.from("asset_links").delete().in("asset_id", ids).eq("role", "gallery");
    await sb.from("assets").delete().in("id", ids);
  }
  for (const [index, url] of urls.entries()) {
    if (!url) continue;
    const assetId = `cms-gallery-${entityId}-${index}`;
    const { error: assetError } = await sb.from("assets").upsert(
      {
        id: assetId,
        bucket: "sb-assets-public",
        storage_path: `cms/${entityId}/gallery-${index}`,
        public_url: url,
        variant: "gallery",
        status: "ready",
        sort_order: index,
      } as never,
      { onConflict: "id" },
    );
    if (assetError) throw assetError;
    const { error: linkError } = await sb.from("asset_links").insert({
      asset_id: assetId,
      entity_type: "programme",
      entity_id: entityId,
      role: "gallery",
    } as never);
    if (linkError) throw linkError;
  }
  await refreshProgrammes();
}
