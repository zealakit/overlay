import type { Cleanup } from "../types/lifecycle.js";

/**
 * Add an event listener and return an idempotent cleanup.
 *
 * Nullish targets (missing refs during SSR or unmount) are a no-op so callers
 * don't need to branch.
 */
export function listen<E extends Event = Event>(
  target: EventTarget | null | undefined,
  type: string,
  handler: (event: E) => void,
  options?: AddEventListenerOptions | boolean,
): Cleanup {
  if (!target) {
    return () => {};
  }

  const listener = handler as EventListener;
  target.addEventListener(type, listener, options);

  let active = true;
  return () => {
    if (!active) {
      return;
    }
    active = false;
    target.removeEventListener(type, listener, options);
  };
}
