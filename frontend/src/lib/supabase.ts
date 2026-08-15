import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client for public reads and CMS writes.
 * Uses the anon key only. RLS + Auth session decide access.
 * Do not import a service_role client in the frontend.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Copy frontend/.env.example to frontend/.env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

/** Tagged search — does not scan full body/bio copy. */
export function searchEntities(
  q: string,
  editionId?: string | null,
  resultLimit = 12,
) {
  return requireSupabase().rpc("search_entities", {
    q,
    filter_edition_id: editionId ?? null,
    result_limit: resultLimit,
  });
}
