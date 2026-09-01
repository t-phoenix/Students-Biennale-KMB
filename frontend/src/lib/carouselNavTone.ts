export type CarouselNavTone = "light" | "dark";

export type CarouselDotsAlign = "right" | "center";

/** Relative luminance (0–255) of a strip along the left or right edge of an image. */
export async function sampleCarouselNavTone(
  src: string,
  edge: "left" | "right",
): Promise<CarouselNavTone> {
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "dark";

    const stripW = Math.max(1, img.naturalWidth * 0.14);
    const stripH = Math.max(1, img.naturalHeight * 0.22);
    const sx = edge === "left" ? 0 : img.naturalWidth - stripW;
    const sy = (img.naturalHeight - stripH) / 2;

    return toneFromAverage(luminanceFromRegion(ctx, img, sx, sy, stripW, stripH, size));
  } catch {
    return "dark";
  }
}

/** Luminance under the dot tracker — bottom-right or bottom-center of the slide. */
export async function sampleCarouselDotsTone(
  src: string,
  align: CarouselDotsAlign = "right",
): Promise<CarouselNavTone> {
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "dark";

    const stripW = Math.max(1, img.naturalWidth * (align === "right" ? 0.32 : 0.42));
    const stripH = Math.max(1, img.naturalHeight * 0.16);
    const sx = align === "right" ? img.naturalWidth - stripW : (img.naturalWidth - stripW) / 2;
    const sy = img.naturalHeight - stripH;

    return toneFromAverage(luminanceFromRegion(ctx, img, sx, sy, stripW, stripH, size));
  } catch {
    return "dark";
  }
}

function luminanceFromRegion(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  size: number,
): number {
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let sum = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return sum / pixels;
}

function toneFromAverage(avg: number): CarouselNavTone {
  return avg > 168 ? "light" : "dark";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`carousel nav tone: ${src}`));
    img.src = src;
  });
}
