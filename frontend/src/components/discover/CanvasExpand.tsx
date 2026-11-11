import { useCallback, useEffect, useRef } from "react";
import { DUR, EASE, EXIT, gsap, useGSAP } from "../../lib/motion";
import type { CanvasItem } from "../../data/discover";
import "./CanvasExpand.css";

type Props = {
  item: CanvasItem;
  origin: DOMRect;
  onClose: () => void;
};

function readHeaderH() {
  return (
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 60
  );
}

export function CanvasExpand({ item, origin, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const originRef = useRef(origin);
  originRef.current = origin;

  const animateClose = useCallback(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    const o = originRef.current;
    if (!sheet || !backdrop) {
      onClose();
      return;
    }
    const headerH = readHeaderH();
    gsap.set(sheet, {
      x: 0,
      y: headerH,
      width: window.innerWidth,
      height: window.innerHeight - headerH,
      overflow: "hidden",
    });
    gsap
      .timeline({ onComplete: onClose })
      .to(backdrop, { autoAlpha: 0, duration: EXIT.duration, ease: EXIT.ease }, 0)
      .to(
        sheet,
        {
          x: o.left,
          y: o.top,
          width: o.width,
          height: o.height,
          duration: EXIT.travel,
          ease: EASE.fade,
        },
        0
      );
  }, [onClose]);

  useGSAP(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;
    const headerH = readHeaderH();
    gsap.set(sheet, {
      x: origin.left,
      y: origin.top,
      width: origin.width,
      height: origin.height,
      autoAlpha: 1,
      overflow: "hidden",
    });
    gsap.set(backdrop, { autoAlpha: 0 });
    gsap
      .timeline()
      .to(backdrop, { autoAlpha: 1, duration: DUR.base, ease: EASE.enter }, 0)
      .to(
        sheet,
        {
          x: 0,
          y: headerH,
          width: window.innerWidth,
          height: window.innerHeight - headerH,
          duration: DUR.slow,
          ease: EASE.enterSoft,
        },
        0
      );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") animateClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [animateClose]);

  return (
    <div className="canvas-expand" role="dialog" aria-modal="true" aria-label={item.name}>
      <button
        ref={backdropRef}
        type="button"
        className="canvas-expand__backdrop"
        aria-label="Close"
        onClick={animateClose}
      />
      <div ref={sheetRef} className="canvas-expand__sheet">
        <button type="button" className="canvas-expand__close" onClick={animateClose}>
          Close
        </button>
        <p className="canvas-expand__kind">{item.kind}</p>
        <h2 className="canvas-expand__title">{item.name}</h2>
        <p className="canvas-expand__meta">{item.meta}</p>
        <p className="canvas-expand__bio">{item.bio}</p>
      </div>
    </div>
  );
}
