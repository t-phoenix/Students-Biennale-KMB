import { requireSupabase } from "../supabase";
import type { Database } from "../database.types";

type PublicTable = keyof Database["public"]["Tables"];

type OrderedRow = { id: string; sort_order: number | null };

/** Swap sort_order between two adjacent rows (uses a temporary negative value). */
export async function swapSortOrder(
  table: PublicTable,
  a: OrderedRow,
  b: OrderedRow,
) {
  const sb = requireSupabase();
  const orderA = a.sort_order ?? 0;
  let orderB = b.sort_order ?? 0;
  if (orderA === orderB) {
    orderB = orderA + 1;
    const { error: assignErr } = await sb
      .from(table)
      .update({ sort_order: orderB } as never)
      .eq("id" as never, b.id);
    if (assignErr) throw assignErr;
  }
  const temp = -Math.abs(orderA) - 10_000;
  const { error: e1 } = await sb
    .from(table)
    .update({ sort_order: temp } as never)
    .eq("id" as never, a.id);
  if (e1) throw e1;
  const { error: e2 } = await sb
    .from(table)
    .update({ sort_order: orderA } as never)
    .eq("id" as never, b.id);
  if (e2) throw e2;
  const { error: e3 } = await sb
    .from(table)
    .update({ sort_order: orderB } as never)
    .eq("id" as never, a.id);
  if (e3) throw e3;
}

/** Swap update_cards.slot (1–3) via temporary slot 0. */
export async function swapUpdateCardSlots(
  a: { id: string; slot: number },
  b: { id: string; slot: number },
) {
  const sb = requireSupabase();
  const { error: e1 } = await sb.from("update_cards").update({ slot: 0 }).eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await sb.from("update_cards").update({ slot: a.slot }).eq("id", b.id);
  if (e2) throw e2;
  const { error: e3 } = await sb.from("update_cards").update({ slot: b.slot }).eq("id", a.id);
  if (e3) throw e3;
}
