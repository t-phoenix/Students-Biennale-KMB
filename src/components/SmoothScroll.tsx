import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { ScrollTrigger, gsap } from "../lib/motion";

type Props = {
  enabled?: boolean;
  children: ReactNode;
};

export function SmoothScroll({ enabled = true, children }: Props) {
  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, [enabled]);

  return <>{children}</>;
}
