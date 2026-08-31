/** Dev-only Discover image loading metrics — Network tab remains the source of truth. */

const MOUNT_MARK = "discover-mount";
const DECODE_MARK = "discover-first-decode";
const MEASURE = "discover-first-decoded";

export function markDiscoverMount() {
  if (typeof performance === "undefined") return;
  performance.clearMarks(MOUNT_MARK);
  performance.clearMarks(DECODE_MARK);
  performance.clearMeasures(MEASURE);
  performance.mark(MOUNT_MARK);
}

export function markDiscoverFirstDecode(url?: string) {
  if (typeof performance === "undefined") return;
  if (performance.getEntriesByName(DECODE_MARK).length) return;
  performance.mark(DECODE_MARK);
  performance.measure(MEASURE, MOUNT_MARK, DECODE_MARK);
  if (import.meta.env.DEV) {
    const entry = performance.getEntriesByName(MEASURE)[0];
    console.info("[discover] first tile decoded", {
      ms: entry ? Math.round(entry.duration) : null,
      url,
    });
  }
}
