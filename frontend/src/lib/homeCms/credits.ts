/** A hero credit line renders only when enabled and non-empty. */
export function heroCreditVisible(
  show: boolean | undefined,
  text: string | null | undefined,
): boolean {
  return show !== false && Boolean(text?.trim());
}
