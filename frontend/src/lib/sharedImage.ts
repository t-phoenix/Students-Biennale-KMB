import { DUR, EASE, EXIT, gsap } from "./motion";

type Rect = { left: number; top: number; width: number; height: number };

/** What is visible (the frame) and where the image sits inside it, which can be larger when zoomed. */
export type ImagePlace = { frame: Rect; image: Rect };

type FlyOptions = {
  src: string;
  from: ImagePlace;
  /** Read every frame, so the image lands correctly even if the page is still settling. */
  getTarget: () => ImagePlace | null;
  parent?: HTMLElement;
  objectFit?: string;
  objectPosition?: string;
  zIndex?: number;
  duration?: number;
  ease?: string;
  /** Holds the image in place until the page underneath has its real image ready. */
  isReady?: () => boolean;
  onLand?: () => void;
  /** The temporary image has fully faded away. */
  onGone?: () => void;
  /** Stay at the target rather than fading, because the page is about to replace it. */
  holdAtEnd?: boolean;
  /** CSS filter at the start and at the end, such as a greyscale treatment. */
  filter?: string;
  getLandFilter?: () => string;
  /** Start this frame, to stay in step with a movement that has already begun. */
  startNow?: boolean;
  /** A sharper copy of the same picture. It dissolves in over the first one once decoded, so a
   *  small thumbnail never ends the flight stretched and soft. */
  upgradeSrc?: string;
};

export const placeOf = (img: HTMLImageElement, frame: Element | null = img.parentElement): ImagePlace => {
  const image = img.getBoundingClientRect();
  // A "contain" image only fills part of its box, so land on the picture, not the box.
  if (getComputedStyle(img).objectFit === "contain" && img.naturalWidth && img.naturalHeight) {
    const ratio = Math.min(image.width / img.naturalWidth, image.height / img.naturalHeight);
    const width = img.naturalWidth * ratio;
    const height = img.naturalHeight * ratio;
    const picture = {
      left: image.left + (image.width - width) / 2,
      top: image.top + (image.height - height) / 2,
      width,
      height,
    };
    return { image: picture, frame: picture };
  }
  const box = frame?.getBoundingClientRect();
  return { image, frame: box && box.width && box.height ? box : image };
};

/** A temporary image that travels between two places while the pages change around it. */
export function flyImage({
  src,
  from,
  getTarget,
  parent = document.body,
  objectFit = "cover",
  objectPosition = "center",
  zIndex = 900,
  duration = DUR.page,
  ease = EASE.standard,
  isReady,
  onLand,
  onGone,
  holdAtEnd = false,
  startNow = false,
  filter = "none",
  getLandFilter,
  upgradeSrc,
}: FlyOptions) {
  const frame = document.createElement("div");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("data-flying-image", "");
  Object.assign(frame.style, {
    position: "fixed",
    overflow: "hidden",
    zIndex: String(zIndex),
    pointerEvents: "none",
  });
  const img = new Image();
  img.src = src;
  img.alt = "";
  img.draggable = false;
  Object.assign(img.style, {
    position: "absolute",
    margin: "0",
    maxWidth: "none",
    objectFit,
    objectPosition,
    filter,
    transition: `filter ${duration}s linear`,
  });
  frame.appendChild(img);
  const layers = [img];
  if (upgradeSrc && upgradeSrc !== src) {
    const sharp = new Image();
    sharp.alt = "";
    sharp.draggable = false;
    sharp.style.cssText = img.style.cssText;
    sharp.style.opacity = "0";
    sharp.src = upgradeSrc;
    frame.appendChild(sharp);
    layers.push(sharp);
    const show = () => gsap.to(sharp, { opacity: 1, duration: DUR.base, ease: EASE.fade });
    if (typeof sharp.decode === "function") void sharp.decode().then(show, () => {});
    else sharp.addEventListener("load", show, { once: true });
  }
  parent.appendChild(frame);
  // Resolves once the picture can be painted, so callers can wait before removing what it covers.
  const ready: Promise<void> =
    typeof img.decode === "function"
      ? Promise.race([img.decode().catch(() => {}), new Promise<void>((r) => setTimeout(r, 150))])
      : Promise.resolve();

  const state = { p: 0 };
  const mix = (a: number, b: number) => a + (b - a) * state.p;
  const mixRect = (a: Rect, b: Rect): Rect => ({
    left: mix(a.left, b.left),
    top: mix(a.top, b.top),
    width: mix(a.width, b.width),
    height: mix(a.height, b.height),
  });

  const render = () => {
    const target = getTarget() ?? from;
    const box = mixRect(from.frame, target.frame);
    const inner = mixRect(from.image, target.image);
    frame.style.left = `${box.left}px`;
    frame.style.top = `${box.top}px`;
    frame.style.width = `${box.width}px`;
    frame.style.height = `${box.height}px`;
    for (const layer of layers) {
      layer.style.left = `${inner.left - box.left}px`;
      layer.style.top = `${inner.top - box.top}px`;
      layer.style.width = `${inner.width}px`;
      layer.style.height = `${inner.height}px`;
    }
  };
  render();

  let cancelled = false;
  let tween: gsap.core.Tween | null = null;
  let waitCall: gsap.core.Tween | null = null;
  let startFrame = 0;

  const stopFollowing = () => gsap.ticker.remove(render);
  const cancel = () => {
    cancelled = true;
    cancelAnimationFrame(startFrame);
    stopFollowing();
    tween?.kill();
    waitCall?.kill();
    gsap.killTweensOf([frame, ...layers]);
    frame.remove();
  };

  const fadeOut = () => {
    if (cancelled) return;
    gsap.to(frame, {
      opacity: 0,
      duration: EXIT.duration,
      ease: EXIT.ease,
      onComplete: () => {
        stopFollowing();
        frame.remove();
        onGone?.();
      },
    });
  };

  const land = () => {
    if (cancelled) return;
    onLand?.();
    if (holdAtEnd) return;
    const started = performance.now();
    const check = () => {
      if (cancelled) return;
      if (!isReady || isReady() || performance.now() - started > 1000) {
        fadeOut();
        return;
      }
      waitCall = gsap.delayedCall(0.05, check);
    };
    check();
  };

  // Keeps following until it is gone, in case the page image is still settling.
  gsap.ticker.add(render);

  // Starts once the browser has painted, or the heavy first frame of a new page
  // would swallow the beginning of the movement.
  const begin = () => {
    if (cancelled) return;
    if (getLandFilter) img.style.filter = getLandFilter();
    tween = gsap.to(state, { p: 1, duration, ease, onComplete: land });
  };
  if (startNow) begin();
  else {
    startFrame = requestAnimationFrame(() => {
      startFrame = requestAnimationFrame(begin);
    });
  }

  return { cancel, ready };
}
