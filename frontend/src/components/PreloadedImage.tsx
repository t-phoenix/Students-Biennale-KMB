import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { preloadInTurn, preloadUrl } from "../lib/preloadImages";
import { BrandImageLoader } from "./BrandImageLoader";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  /** Optional URLs to warm in parallel (e.g. upcoming carousel slides). */
  prefetch?: readonly string[];
  showLoader?: boolean;
  loaderVariant?: "cover" | "inline";
  /** Fade in even when already loaded, slowly and softly, over whatever sits beneath it. */
  crossfade?: boolean;
  /** Arrives quickly once downloaded (a picture someone just tapped to open). */
  quick?: boolean;
};

function isAlreadyLoaded(src: string) {
  if (typeof Image === "undefined" || !src) return false;
  const probe = new Image();
  probe.src = src;
  return probe.complete && probe.naturalWidth > 0;
}

/**
 * Image with brand loader overlay — fades in once decoded.
 * Pairs with predictive prefetch so the loader rarely shows for long.
 */
export function PreloadedImage({
  src,
  prefetch,
  showLoader = true,
  loaderVariant = "cover",
  crossfade = false,
  quick = false,
  className,
  onLoad,
  onError,
  style,
  ...rest
}: Props) {
  // An image the browser already holds shows at once, instead of fading in over the grey.
  const [ready, setReady] = useState(() => !crossfade && isAlreadyLoaded(src));

  useEffect(() => {
    setReady(!crossfade && isAlreadyLoaded(src));
    let cancelled = false;

    void preloadUrl(src, "high").then(() => {
      if (cancelled) return;
      if (!crossfade) {
        setReady(true);
        return;
      }
      // Two frames later, so the browser has painted the hidden start and the fade runs.
      requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && setReady(true)));
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!prefetch?.length) return;
    // The other pictures load one after another once this one is showing, not all at once.
    preloadInTurn(prefetch.filter((url) => url && url !== src));
  }, [prefetch, src]);

  const mergedStyle = {
    ...style,
    opacity: ready ? 1 : 0,
    transition: ready
      ? crossfade
        ? "opacity 1.3s var(--enter-ease-fade)"
        : `opacity ${quick ? 0.2 : 0.45}s var(--enter-ease-fade)`
      : undefined,
  };

  return (
    <>
      {showLoader && !ready ? (
        <BrandImageLoader variant={loaderVariant} className={className ? `${className}__loader` : undefined} />
      ) : null}
      <img
        {...rest}
        src={src}
        className={className}
        style={mergedStyle}
        onLoad={(event) => {
          if (!crossfade) setReady(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setReady(true);
          onError?.(event);
        }}
      />
    </>
  );
}
