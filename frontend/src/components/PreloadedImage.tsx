import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { preloadUrl } from "../lib/preloadImages";
import { BrandImageLoader } from "./BrandImageLoader";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  /** Optional URLs to warm in parallel (e.g. upcoming carousel slides). */
  prefetch?: readonly string[];
  showLoader?: boolean;
  loaderVariant?: "cover" | "inline";
};

/**
 * Image with brand loader overlay — fades in once decoded.
 * Pairs with predictive prefetch so the loader rarely shows for long.
 */
export function PreloadedImage({
  src,
  prefetch,
  showLoader = true,
  loaderVariant = "cover",
  className,
  onLoad,
  onError,
  style,
  ...rest
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    let cancelled = false;

    void preloadUrl(src, "high").then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!prefetch?.length) return;
    for (const url of prefetch) {
      if (url && url !== src) void preloadUrl(url);
    }
  }, [prefetch, src]);

  const mergedStyle = {
    ...style,
    opacity: ready ? 1 : 0,
    transition: ready ? "opacity 0.45s ease" : undefined,
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
          setReady(true);
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
