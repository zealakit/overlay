/** Cross-browser Escape detection (`Esc` is the legacy key value). */
export function isEscapeKey(event: KeyboardEvent): boolean {
  return !event.isComposing && (event.key === "Escape" || event.key === "Esc");
}
