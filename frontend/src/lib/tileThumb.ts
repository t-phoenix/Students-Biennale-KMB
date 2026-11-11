/**
 * Discover tiles are shown at a few hundred pixels, but the catalogue images are
 * 1600px wide (about 200 KB each). The storage service can serve a resized copy
 * of the same file, so tiles ask for one that fits (about 30 KB), which makes
 * the whole canvas load several times faster. The original is used if the
 * resized copy is ever unavailable.
 */
const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";
const LONGEST_SIDE = 448;
const QUALITY = 74;

export function tileThumb(url?: string): string | undefined {
  if (!url || !url.includes(OBJECT_PATH)) return url;
  const base = url.split("?")[0];
  return `${base.replace(OBJECT_PATH, RENDER_PATH)}?width=${LONGEST_SIDE}&height=${LONGEST_SIDE}&resize=contain&quality=${QUALITY}`;
}

/** The full-size file behind a resized tile image, or undefined if it is not one. */
export function tileOriginal(url: string): string | undefined {
  if (!url.includes(RENDER_PATH)) return undefined;
  return url.split("?")[0].replace(RENDER_PATH, OBJECT_PATH);
}
