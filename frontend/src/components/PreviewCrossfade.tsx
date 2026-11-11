import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { EASE, EXIT, gsap, prefersReducedMotion } from "../lib/motion";

/** Long enough to read as a soft dissolve, short enough to keep up with the pointer. */
const DURATION = 0.6;
/** If a picture is slow, the change still happens rather than waiting forever. */
const MAX_PICTURE_WAIT_MS = 900;

type Props = {
  /** Which item is shown now. */
  id: string;
  render: (id: string) => ReactNode;
};

/**
 * Swaps one preview for another by dissolving. The new preview fades in on top of the old
 * one, which stays fully visible beneath until the new one has covered it, so the panel
 * is never blank in between. (Removing the old preview and fading the new one in from
 * nothing, as before, flashes empty on every change.) The new preview waits for its
 * picture to be ready, so a picture never pops in halfway through.
 */
export function PreviewCrossfade({ id, render }: Props) {
  const [layers, setLayers] = useState<string[]>([id]);
  const elements = useRef(new Map<string, HTMLDivElement>());

  if (layers[layers.length - 1] !== id) {
    setLayers((prev) => [...prev.filter((layer) => layer !== id).slice(-2), id]);
  }

  useLayoutEffect(() => {
    const incoming = elements.current.get(id);
    if (!incoming) return;
    const others = layers.filter((layer) => layer !== id);
    if (!others.length) return;

    if (prefersReducedMotion()) {
      gsap.set(incoming, { clearProps: "opacity" });
      setLayers([id]);
      return;
    }

    // A layer that was already fading out and is coming back continues from where it is.
    const resuming = incoming.style.opacity !== "";
    gsap.killTweensOf(incoming);
    if (!resuming) gsap.set(incoming, { opacity: 0 });
    others.forEach((layer) => {
      const el = elements.current.get(layer);
      if (el) gsap.killTweensOf([el, ...Array.from(el.firstElementChild?.children ?? [])]);
    });

    let cancelled = false;
    let timer = 0;
    const cleanups: Array<() => void> = [];
    // The blocks of text beside the picture. Two titles dissolving into each other in the
    // same place read as garbled letters, so the old text clears first and the new text
    // follows it in with a small rise; the picture dissolves for the whole duration.
    const textBlocks = (layer: HTMLElement) => {
      const root = layer.firstElementChild;
      if (!root) return [] as Element[];
      return Array.from(root.children).filter((child) => !child.querySelector("img") && child.tagName !== "IMG");
    };
    const begin = () => {
      if (cancelled) return;
      const timeline = gsap.timeline({
        onComplete: () => {
          gsap.set(incoming, { clearProps: "opacity" });
          gsap.set(textBlocks(incoming), { clearProps: "opacity,transform" });
          setLayers((prev) => (prev[prev.length - 1] === id ? [id] : prev));
        },
      });
      timeline.to(incoming, { opacity: 1, duration: DURATION, ease: EASE.fade }, 0);
      const incomingText = textBlocks(incoming);
      if (incomingText.length) {
        timeline.fromTo(
          incomingText,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: DURATION * 0.7, ease: EASE.fade, stagger: 0.04 },
          DURATION * 0.22,
        );
      }
      others.forEach((layer) => {
        const el = elements.current.get(layer);
        if (!el) return;
        const outgoingText = textBlocks(el);
        if (outgoingText.length) {
          // Exit: the old text is gone at once.
          timeline.to(outgoingText, { opacity: 0, y: -6, duration: EXIT.micro, ease: EXIT.ease }, 0);
        }
        // The old preview itself fades away over the second half, so nothing of it is left to
        // pop out when it is removed.
        timeline.to(el, { opacity: 0, duration: DURATION * 0.5, ease: EASE.fade }, DURATION * 0.5);
      });
    };

    const picture = incoming.querySelector("img");
    if (picture && !(picture.complete && picture.naturalWidth > 0)) {
      const go = () => {
        window.clearTimeout(timer);
        picture.removeEventListener("load", go);
        picture.removeEventListener("error", go);
        begin();
      };
      picture.addEventListener("load", go);
      picture.addEventListener("error", go);
      timer = window.setTimeout(go, MAX_PICTURE_WAIT_MS);
      cleanups.push(() => {
        window.clearTimeout(timer);
        picture.removeEventListener("load", go);
        picture.removeEventListener("error", go);
      });
    } else if (picture && typeof picture.decode === "function") {
      void picture.decode().then(begin, begin);
    } else {
      begin();
    }

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
    // Runs when the shown item changes; the layers it reads are the ones just committed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(
    () => () => {
      elements.current.forEach((el) => gsap.killTweensOf(el));
    },
    [],
  );

  return (
    <div className="catalogue__preview-stack">
      {layers.map((layer) => (
        <div
          key={layer}
          ref={(el) => {
            if (el) elements.current.set(layer, el);
            else elements.current.delete(layer);
          }}
          className={`catalogue__preview-inner-wrap catalogue__preview-layer${layer === id ? "" : " is-outgoing"}`}
          aria-hidden={layer === id ? undefined : true}
        >
          {render(layer)}
        </div>
      ))}
    </div>
  );
}
