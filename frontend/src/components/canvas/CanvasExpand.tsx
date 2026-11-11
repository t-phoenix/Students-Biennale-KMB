import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { type ArtworkCard, type CanvasItem } from "../../data/site";
import { findCard, useAllArtworks } from "../../lib/catalogue";
import { prefetchArtworkGallery } from "../../lib/predictivePrefetch";
import { ArtworkDetailBody } from "../ArtworkDetailBody";
import { BrandArrow } from "../BrandArrow";
import { CtaLink } from "../CtaLink";
import { bindPullToDismiss } from "../../lib/gesture";
import { DUR, EASE, EXIT, gsap, useGSAP, prefersReducedMotion } from "../../lib/motion";
import { flyImage, placeOf, type ImagePlace } from "../../lib/sharedImage";
import "./CanvasExpand.css";

type Props = {
  item: CanvasItem;
  origin: DOMRect;
  /** The tile that was clicked. Hidden while its picture is out, so the picture never shows twice. */
  originEl?: HTMLElement;
  onClose: () => void;
  /** Called the moment closing begins, so what sits behind can be back in place before the
   *  sheet has gone. */
  onCloseStart?: () => void;
  /** Called once the sheet has fully opened and covers what is behind it. */
  onOpened?: () => void;
  onNext?: (nextArtwork: ArtworkCard) => void;
};

/** Canvas tiles are seeded as "aw-" + ArtworkCard.id; tiled copies append
 *  "__c{col}-{n}". Decorative filler tiles use "ph-…" ids. */
function canvasArtworkId(itemId: string): string | undefined {
  if (!itemId.startsWith("aw-")) return undefined;
  return itemId.slice(3).replace(/__c\d+-\d+$/, "");
}

export function CanvasExpand({ item, origin, originEl, onClose, onCloseStart, onOpened, onNext }: Props) {
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const { artworks } = useAllArtworks();
  const artwork = useMemo(() => {
    const id = canvasArtworkId(item.id);
    return id ? findCard(artworks, id) : undefined;
  }, [artworks, item.id]);

  const artworkIdx = useMemo(() => {
    if (!artwork) return -1;
    return artworks.findIndex((x) => x.id === artwork.id);
  }, [artworks, artwork]);

  const nextArtwork = useMemo(() => {
    if (artworkIdx < 0 || !artworks.length) return undefined;
    return artworks[(artworkIdx + 1) % artworks.length];
  }, [artworks, artworkIdx]);

  useEffect(() => {
    prefetchArtworkGallery(artwork);
  }, [artwork]);

  useEffect(() => {
    // Guarantee header is untucked immediately whenever an article is opened
    window.dispatchEvent(
      new CustomEvent("canvas:tuck-header", { detail: { tucked: false, immediate: true } })
    );
  }, []);

  const goNextArtwork = useCallback(() => {
    if (!nextArtwork || !onNext) return;
    onNext(nextArtwork);
    sheetRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [nextArtwork, onNext]);

  // FLIP transform that makes the full-size sheet exactly overlay the
  // clicked tile's position/size — computed once on open, reused in reverse
  // on close, so the sheet visibly grows out of and shrinks back into the
  // very tile the user clicked, not just a generic fade/scale.
  const flip = useRef({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
  const closingRef = useRef(false);
  const flightRef = useRef<{ cancel: () => void } | null>(null);
  const openedItemIdRef = useRef(item.id);

  // While the picture is out of its tile, the tile itself is hidden: otherwise the same picture
  // shows twice, once flying and once still sitting in the canvas.
  const hideTile = useCallback(() => {
    if (originEl) originEl.style.visibility = "hidden";
  }, [originEl]);
  const showTile = useCallback(() => {
    if (originEl) originEl.style.visibility = "";
  }, [originEl]);
  // Layout-effect cleanup runs in the same commit that removes the flying picture, so there is
  // never a frame with neither the tile nor the picture on screen.
  useLayoutEffect(() => showTile, [showTile]);

  // While an artwork is open the rest of the canvas recedes to 1%, so only the opening picture
  // reads. The whole tile field fades as one layer (one composited opacity, not a tween per tile).
  const fieldRef = useRef<HTMLElement | null>(null);
  if (!fieldRef.current) {
    fieldRef.current =
      originEl?.closest(".infinite-canvas")?.querySelector<HTMLElement>(".infinite-canvas__zoom") ??
      document.querySelector<HTMLElement>(".infinite-canvas__zoom");
  }
  const restoreField = useCallback(() => {
    const field = fieldRef.current;
    if (!field) return;
    gsap.killTweensOf(field, "opacity");
    gsap.set(field, { clearProps: "opacity" });
  }, []);
  // Same commit that removes the sheet: the field is never left dimmed.
  useLayoutEffect(() => restoreField, [restoreField]);

  /** Where the tile's picture is right now. The canvas keeps drifting while an artwork is open,
   *  so the place it was clicked is not where it is when the artwork closes. */
  const tilePlace = useCallback((): ImagePlace => {
    const tileImg = originEl?.isConnected ? originEl.querySelector<HTMLImageElement>("img") : null;
    if (tileImg) {
      const r = tileImg.getBoundingClientRect();
      if (r.width && r.height) return { frame: r, image: r };
    }
    return { frame: origin, image: origin };
  }, [originEl, origin]);

  const animateClose = useCallback(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    onCloseStart?.();
    if (!sheet || !backdrop || prefersReducedMotion()) {
      onClose();
      return;
    }
    // Second close request while the exit runs finishes it at once.
    if (closingRef.current) {
      gsap.killTweensOf([sheet, backdrop, ...Array.from(sheet.children)]);
      showTile();
      restoreField();
      flightRef.current?.cancel();
      onClose();
      return;
    }
    closingRef.current = true;
    // Retargets from wherever the sheet currently is, so closing mid-open is smooth.
    gsap.killTweensOf([sheet, backdrop, ...Array.from(sheet.children)]);
    flightRef.current?.cancel();

    // The image returns to its tile, if this is still the artwork that tile shows.
    const heroImg = sheet.querySelector<HTMLImageElement>(".detail__hero-img");
    const heroRect = heroImg?.getBoundingClientRect();
    let ready: Promise<void> = Promise.resolve();
    if (
      heroImg &&
      heroRect &&
      rootRef.current &&
      item.id === openedItemIdRef.current &&
      heroRect.bottom > 0 &&
      heroRect.top < window.innerHeight
    ) {
      const parent = rootRef.current;
      hideTile();
      const flight = flyImage({
        src: heroImg.currentSrc || heroImg.src,
        from: placeOf(heroImg),
        // Read every frame, so it lands exactly on the tile even though the canvas drifts.
        getTarget: tilePlace,
        parent,
        zIndex: 5,
        // Exit: the picture travels back quickly, settling into its tile rather than slamming in.
        duration: EXIT.travel,
        ease: EASE.fade,
        holdAtEnd: true,
        startNow: true,
        // Picture and tile are now in the same place: hand over to the tile.
        onLand: showTile,
      });
      flightRef.current = flight;
      ready = flight.ready;
    } else {
      // No picture travels back (another artwork is showing): the tile simply reappears
      // under the fading sheet.
      showTile();
    }
    const field = fieldRef.current;
    const exit = gsap
      .timeline({ paused: true, onComplete: onClose })
      .to(sheet.children, { autoAlpha: 0, duration: EXIT.micro, ease: EXIT.ease }, 0)
      // The sheet's white fades away at once, so only the picture shrinks back into its tile
      // rather than a white box with a small picture inside it.
      .to(sheet, { backgroundColor: "rgba(255, 255, 255, 0)", duration: EXIT.micro, ease: EXIT.ease }, 0)
      .to(backdrop, { autoAlpha: 0, duration: EXIT.duration, ease: EXIT.ease }, 0)
      .to(
        sheet,
        {
          x: flip.current.x,
          y: flip.current.y,
          scaleX: flip.current.scaleX,
          scaleY: flip.current.scaleY,
          duration: EXIT.travel,
          ease: EASE.fade,
        },
        0
      );
    // The canvas comes back as the picture returns, fully there a beat before it lands in its
    // tile, so the tile never reappears dimmed.
    if (field) {
      exit.to(field, { opacity: 1, duration: EXIT.travel * 0.85, ease: EASE.fade, overwrite: true }, 0);
    }
    // The sheet's own picture stays until the travelling copy can actually be painted.
    // Fading the sheet first left a frame or two with no picture at all — the flicker on close.
    void ready.then(() => {
      if (closingRef.current) exit.play();
    });
  }, [onClose, onCloseStart, item.id, hideTile, showTile, tilePlace, restoreField]);

  useGSAP(
    () => {
      const sheet = sheetRef.current;
      const backdrop = backdropRef.current;
      if (!sheet || !backdrop) return;

      if (prefersReducedMotion()) {
        gsap.set([sheet, backdrop], { autoAlpha: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 });
        onOpenedRef.current?.();
        return;
      }

      // Measure the sheet at its natural full-size layout, then compute the
      // transform that shrinks it down onto the origin tile's exact rect.
      const final = sheet.getBoundingClientRect();
      const heroImg = sheet.querySelector<HTMLImageElement>(".detail__hero-img");
      const heroFinal = heroImg ? placeOf(heroImg) : null;
      const scaleX = final.width > 0 && origin.width > 0 ? origin.width / final.width : 1;
      const scaleY = final.height > 0 && origin.height > 0 ? origin.height / final.height : 1;
      const x = origin.left + origin.width / 2 - (final.left + final.width / 2);
      const y = origin.top + origin.height / 2 - (final.top + final.height / 2);
      flip.current = { x, y, scaleX, scaleY };

      // The sheet starts see-through: its white would otherwise show as a box growing out of
      // the tile with a small picture floating inside it.
      gsap.set(sheet, {
        transformOrigin: "50% 50%",
        autoAlpha: 1,
        x,
        y,
        scaleX,
        scaleY,
        backgroundColor: "rgba(255, 255, 255, 0)",
      });
      gsap.set(backdrop, { autoAlpha: 0 });
      // Content fades in as the sheet lands, so text never rides the FLIP scale.
      gsap.set(sheet.children, { autoAlpha: 0 });
      // The rest of the canvas recedes while the tile opens.
      if (fieldRef.current) {
        gsap.to(fieldRef.current, { opacity: 0.01, duration: DUR.slow, ease: EASE.fade, overwrite: true });
      }
      gsap
        .timeline({ onComplete: () => onOpenedRef.current?.() })
        .to(backdrop, { autoAlpha: 1, duration: DUR.base, ease: EASE.enter }, 0)
        .to(sheet, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: DUR.page, ease: EASE.standard }, 0)
        // The white arrives late, once the picture has almost reached its place.
        .to(
          sheet,
          {
            backgroundColor: "rgba(255, 255, 255, 1)",
            duration: DUR.slow,
            ease: EASE.enter,
            clearProps: "backgroundColor",
          },
          DUR.page * 0.55,
        )
        // Content appears only once the sheet is essentially in place. Before that it would be
        // stretched with the sheet and show as a ghost behind the travelling picture.
        .to(sheet.children, { autoAlpha: 1, duration: DUR.slow, ease: EASE.enter }, DUR.page * 0.8);

      // The tile's image stays on screen and travels to its place in the sheet.
      if (item.image && heroFinal?.image.width && heroFinal.image.height && rootRef.current) {
        flightRef.current?.cancel();
        hideTile();
        // Starts from the tile's own small picture (already on screen, so it never arrives
        // blank) and dissolves to the sheet's full-size picture on the way, so it lands sharp and
        // matches the sheet exactly instead of swapping from soft to sharp at the end.
        const tileImg = originEl?.querySelector<HTMLImageElement>("img");
        const tileSrc = tileImg?.complete && tileImg.naturalWidth ? tileImg.currentSrc || tileImg.src : "";
        flightRef.current = flyImage({
          src: tileSrc || item.image,
          upgradeSrc: heroImg ? heroImg.currentSrc || heroImg.src : undefined,
          from: { frame: origin, image: origin },
          getTarget: () => heroFinal,
          parent: rootRef.current,
          zIndex: 5,
          startNow: true,
          isReady: () => {
            const current = sheet.querySelector<HTMLImageElement>(".detail__hero-img");
            return Boolean(current?.complete && current.naturalWidth > 0);
          },
        });
      }
    },
    { dependencies: [origin], scope: rootRef }
  );

  // Next Artwork: the new content fades in rather than swapping abruptly.
  const lastItemIdRef = useRef(item.id);
  useGSAP(
    () => {
      if (lastItemIdRef.current === item.id) return;
      lastItemIdRef.current = item.id;
      const sheet = sheetRef.current;
      if (!sheet || prefersReducedMotion()) return;
      gsap.fromTo(
        sheet.children,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: DUR.slow, ease: EASE.enter, overwrite: "auto" }
      );
    },
    { dependencies: [item.id], scope: rootRef }
  );

  useEffect(() => () => flightRef.current?.cancel(), []);

  // On touch, pulling the sheet down from the top closes it back into its tile.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    return bindPullToDismiss({ sheet, backdrop: backdropRef.current, onDismiss: animateClose });
  }, [animateClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") animateClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [animateClose]);

  return (
    <div
      ref={rootRef}
      className="canvas-expand"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <button
        ref={backdropRef}
        type="button"
        className="canvas-expand__backdrop"
        aria-label="Close"
        onClick={animateClose}
      />
      <div
        ref={sheetRef}
        className={`canvas-expand__sheet${artwork ? " canvas-expand__sheet--artwork" : ""}`}
      >
        <button
          type="button"
          className="canvas-expand__close"
          aria-label="Close"
          onClick={animateClose}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {artwork ? (
          <>
            <ArtworkDetailBody artwork={artwork} />
            <div className="fig-grid canvas-expand__nav">
              <button
                type="button"
                className="fig-c1-3 canvas-expand__bottom-back"
                onClick={animateClose}
              >
                <BrandArrow direction="left" />
                <span>BACK</span>
              </button>
              {nextArtwork && onNext ? (
                <div className="canvas-expand__next-wrap">
                  <CtaLink
                    className="canvas-expand__next"
                    onClick={goNextArtwork}
                    lines={["NEXT", "ARTWORK"]}
                  />
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="canvas-expand__custom">
            <p className="canvas-expand__kind">{item.kind}</p>
            <h2>{item.name}</h2>
            <p className="canvas-expand__meta">{item.meta}</p>
            {item.bio ? <p className="canvas-expand__bio">{item.bio}</p> : null}
            <div className="fig-grid canvas-expand__nav">
              <button
                type="button"
                className="fig-c1-3 canvas-expand__bottom-back"
                onClick={animateClose}
              >
                <BrandArrow direction="left" />
                <span>BACK</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
