/** Cross-browser Escape detection (`Esc` is the legacy key value). */
export function isEscapeKey(event: KeyboardEvent): boolean {
  return !event.isComposing && (event.key === "Escape" || event.key === "Esc");
}

/** Enter or Space: the standard keyboard activation keys for buttons. */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " " || event.key === "Spacebar";
}
