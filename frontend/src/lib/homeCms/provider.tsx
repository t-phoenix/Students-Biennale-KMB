import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { loadHomeCms, peekHomeCms } from "./cache";
import { HomeCmsContext } from "./context";
import type { HomeCmsStatus } from "./types";

export function HomeCmsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const peeked = peekHomeCms();
  const [covers, setCovers] = useState(peeked?.covers ?? []);
  const [cards, setCards] = useState(peeked?.cards ?? []);
  const [status, setStatus] = useState<HomeCmsStatus>(peeked ? "ready" : "loading");

  useEffect(() => {
    let cancelled = false;
    loadHomeCms()
      .then((data) => {
        if (cancelled) return;
        setCovers(data.covers);
        setCards(data.cards);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const value = useMemo(() => ({ covers, cards, status }), [covers, cards, status]);

  return <HomeCmsContext.Provider value={value}>{children}</HomeCmsContext.Provider>;
}
