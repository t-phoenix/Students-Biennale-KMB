import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client for public reads and CMS writes.
 * Uses the anon key only. RLS + Auth session decide access.
 * Do not import a service_role client in the frontend.
 */
export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey) : null;

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Copy frontend/.env.example to frontend/.env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

/**
 * Server-side tagged search RPC. The public site does not call this on
 * keystroke — edition/Discover search filters the cached catalogue instead.
 */
export function searchEntities(
  q: string,
  editionId?: string | null,
  resultLimit = 12,
) {
  return requireSupabase().rpc("search_entities", {
    q,
    ...(editionId ? { filter_edition_id: editionId } : {}),
    result_limit: resultLimit,
  });
}
