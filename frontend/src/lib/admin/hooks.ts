import { useState, useCallback, useEffect, useRef } from "react";
import { requireSupabase } from "../supabase";
import type { Database } from "../database.types";
import type { User } from "@supabase/supabase-js";

type PublicTable = keyof Database["public"]["Tables"];

/* ── Auth ── */

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sb = requireSupabase();

  useEffect(() => {
    let cancelled = false;
    sb.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [sb]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [sb],
  );

  const signOut = useCallback(() => sb.auth.signOut(), [sb]);

  return { user, loading, signIn, signOut };
}

/* ── Notifications ── */

export interface Notification {
  id: number;
  type: "success" | "error";
  message: string;
}

let _nid = 0;

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = useCallback((type: Notification["type"], message: string) => {
    const id = ++_nid;
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, push, dismiss };
}

/* ── Confirm modal ── */

export function useConfirm() {
  const [state, setState] = useState<{
    message: string;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const confirm = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => setState({ message, resolve })),
    [],
  );

  const handle = useCallback(
    (ok: boolean) => {
      state?.resolve(ok);
      setState(null);
    },
    [state],
  );

  return {
    confirmState: state,
    confirm,
    handleConfirm: () => handle(true),
    handleCancel: () => handle(false),
  };
}

/* ── Generic CRUD ── */

export function useSupabaseCrud<
  T extends { id: string },
>(
  table: PublicTable,
  opts?: {
    orderBy?: string;
    filter?: Record<string, unknown>;
    select?: string;
  },
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = requireSupabase();
  const filterRef = useRef(opts?.filter);
  filterRef.current = opts?.filter;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let q = sb.from(table).select(opts?.select ?? "*");
      if (filterRef.current) {
        for (const [k, v] of Object.entries(filterRef.current)) {
          q = q.eq(k as never, v as never);
        }
      }
      const orderBy = opts?.orderBy ?? "created_at";
      q = q.order(orderBy as never, { ascending: orderBy === "sort_order" || orderBy === "slot" });
      const { data, error } = await q;
      if (error) throw error;
      setRows((data ?? []) as unknown as T[]);
    } finally {
      setLoading(false);
    }
  }, [sb, table, opts?.select, opts?.orderBy]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (row: Omit<T, "id" | "created_at" | "updated_at">) => {
      const { error } = await sb.from(table).insert(row as never);
      if (error) throw error;
      await load();
    },
    [sb, table, load],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const { error } = await sb
        .from(table)
        .update(patch as never)
        .eq("id" as never, id);
      if (error) throw error;
      await load();
    },
    [sb, table, load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await sb.from(table).delete().eq("id" as never, id);
      if (error) throw error;
      await load();
    },
    [sb, table, load],
  );

  return { rows, loading, reload: load, create, update, remove };
}
