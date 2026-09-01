import { useEffect, useState } from "react";
import { loadPressItems, peekPressItems } from "./cache";
import type { PressCmsStatus, PressItem } from "./types";

export function usePressItems(): { items: PressItem[]; status: PressCmsStatus } {
  const peeked = peekPressItems();
  const [items, setItems] = useState<PressItem[]>(peeked ?? []);
  const [status, setStatus] = useState<PressCmsStatus>(peeked ? "ready" : "loading");

  useEffect(() => {
    let cancelled = false;
    loadPressItems()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, status };
}
