import { useEffect, useMemo, useState } from "react";
import { loadProgrammesCovers, peekProgrammesCovers } from "./cache";
import { resolveHomeProgrammesBanner, resolveProgrammesHeroCovers } from "./resolve";
import type { ProgrammesCmsStatus, ProgrammesCover } from "./types";

export function useProgrammesCovers(): {
  covers: ProgrammesCover[];
  heroCovers: ProgrammesCover[];
  homeBannerUrl: string | null;
  status: ProgrammesCmsStatus;
} {
  const peeked = peekProgrammesCovers();
  const [covers, setCovers] = useState<ProgrammesCover[]>(peeked ?? []);
  const [status, setStatus] = useState<ProgrammesCmsStatus>(peeked ? "ready" : "loading");

  useEffect(() => {
    let cancelled = false;
    loadProgrammesCovers()
      .then((data) => {
        if (cancelled) return;
        setCovers(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heroCovers = useMemo(() => resolveProgrammesHeroCovers(covers), [covers]);
  const homeBannerUrl = useMemo(() => resolveHomeProgrammesBanner(covers), [covers]);

  return { covers, heroCovers, homeBannerUrl, status };
}
