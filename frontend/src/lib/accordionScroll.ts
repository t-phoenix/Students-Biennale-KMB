import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, RefObject, MouseEvent as ReactMouseEvent } from "react";

/**
 * Keyboard moves between the rows of an accordion list, as in the WAI-ARIA accordion pattern:
 * Arrow Down / Up go to the next / previous row (wrapping), Home / End to the first / last.
 * Enter and Space already toggle, since every row header is a button. Put it on each header.
 */
export function onAccordionKeyDown(e: ReactKeyboardEvent<HTMLElement>) {
  const key = e.key;
  if (key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End") return;
  const item = e.currentTarget.parentElement;
  const list = item?.parentElement;
  if (!list) return;
  const headers = Array.from(list.children)
    .map((row) => row.querySelector<HTMLElement>(":scope > [aria-expanded]"))
    .filter((h): h is HTMLElement => h !== null);
  const i = headers.indexOf(e.currentTarget);
  if (i < 0 || headers.length < 2) return;
  const n = headers.length;
  const next =
    key === "Home" ? 0 : key === "End" ? n - 1 : key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
  e.preventDefault();
  headers[next].focus();
}

/** Desktop with a real mouse: rows also open on hover there. Touch devices open on tap only. */
export function isDesktopHover() {
  return (
    typeof window !== "undefined" &&
    window.innerWidth > 899 &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/** How long the pointer rests on a row before it opens. */
export const ACCORDION_HOVER_OPEN_MS = 160;

/**
 * Desktop hover for an accordion list: resting the mouse on a row opens it (closing the open
 * one), as a click does. Moving off the list closes nothing, so one row always stays open.
 * The page is never scrolled. Rows open only from real pointer movement: when a row above
 * closes and the list slides under a still pointer, nothing opens. After a click on a row,
 * hovering that row does nothing until the pointer leaves it, so a row just closed by a click
 * does not spring open again.
 */
export function useAccordionHover(open: (id: string) => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef("");
  const clickedId = useRef("");
  const last = useRef({ x: NaN, y: NaN });
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = "";
  };
  useEffect(() => clear, []);

  const onRowPointerMove = useCallback(
    (e: ReactPointerEvent, id: string, isOpen: boolean) => {
      if (e.pointerType !== "mouse" || !isDesktopHover()) return;
      if (e.clientX === last.current.x && e.clientY === last.current.y) return;
      last.current = { x: e.clientX, y: e.clientY };
      if (clickedId.current === id) return;
      if (isOpen) {
        clear();
        return;
      }
      if (pending.current === id) return;
      clear();
      pending.current = id;
      timer.current = setTimeout(() => {
        pending.current = "";
        open(id);
      }, ACCORDION_HOVER_OPEN_MS);
    },
    [open],
  );

  const onRowPointerLeave = useCallback((id: string) => {
    if (clickedId.current === id) clickedId.current = "";
    if (pending.current === id) clear();
  }, []);

  const onRowClick = useCallback((id: string) => {
    clear();
    clickedId.current = id;
  }, []);

  return { onRowPointerMove, onRowPointerLeave, onRowClick };
}

/**
 * Keeps an accordion list the same height whichever article is open: every article's open
 * area takes the height of the tallest one in the list (shorter ones simply have room below
 * their content). Measured from the content's natural height, and again whenever the list is
 * resized or its content changes, so it is always the true tallest. Sets
 * --accordion-content-h on the list; the drawer content's min-height reads it.
 */
export function useEqualDrawerHeights(
  listRef: RefObject<HTMLElement | null>,
  contentSelector: string,
  key: unknown,
) {
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    let last = -1;
    const measure = () => {
      const contents = Array.from(list.querySelectorAll<HTMLElement>(contentSelector));
      if (!contents.length) return;
      // Natural heights: measured with the shared minimum lifted, all in one layout pass.
      contents.forEach((c) => c.style.setProperty("min-height", "0px"));
      const tallest = Math.ceil(Math.max(...contents.map((c) => c.getBoundingClientRect().height)));
      contents.forEach((c) => c.style.removeProperty("min-height"));
      if (tallest !== last) {
        last = tallest;
        list.style.setProperty("--accordion-content-h", `${tallest}px`);
      }
    };
    measure();
    // The list itself grows and shrinks while articles open and close; only a change of width
    // (text re-wrapping) or of an article's own content needs a new measurement.
    let width = list.getBoundingClientRect().width;
    const ro = new ResizeObserver((entries) => {
      const resized = entries.some((e) =>
        e.target === list ? Math.abs(e.contentRect.width - width) > 0.5 : true,
      );
      width = list.getBoundingClientRect().width;
      if (resized) measure();
    });
    ro.observe(list);
    list.querySelectorAll(contentSelector).forEach((c) => ro.observe(c));
    // Images arriving late change heights.
    const onLoad = () => measure();
    list.addEventListener("load", onLoad, true);
    return () => {
      ro.disconnect();
      list.removeEventListener("load", onLoad, true);
      list.style.removeProperty("--accordion-content-h");
    };
  }, [listRef, contentSelector, key]);
}

let lastPointerType = "";
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => {
      lastPointerType = e.pointerType;
    },
    { capture: true, passive: true },
  );
}

/**
 * Whether a click on an article row should open the full article. With a desktop mouse, hover
 * already expands rows, so a click always opens the article. By touch or keyboard there is no
 * hover: the first tap (or Enter) expands the row, the next one opens the article.
 */
export function rowClickOpensArticle(e: ReactMouseEvent, isExpanded: boolean) {
  const byMouse = e.detail > 0 && lastPointerType === "mouse" && isDesktopHover();
  return byMouse || isExpanded;
}
