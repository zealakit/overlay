import type { Cleanup } from "../types/lifecycle.js";
import { isElement } from "../utils/dom.js";

type ResizeObserverWindow = Window & {
  ResizeObserver?: typeof ResizeObserver;
};

/**
 * Observe size changes for a set of elements.
 *
 * Uses the owning window's `ResizeObserver` when available and degrades to a
 * no-op when the environment lacks it (older browsers, SSR-adjacent runtimes).
 */
export function observeResize(
  elements: readonly (Element | null | undefined)[],
  onResize: () => void,
): Cleanup {
  const targets = elements.filter((element): element is Element =>
    isElement(element),
  );
  if (targets.length === 0) {
    return () => {};
  }

  const view = targets[0]?.ownerDocument
    .defaultView as ResizeObserverWindow | null;
  const Observer = view?.ResizeObserver;
  if (typeof Observer !== "function") {
    return () => {};
  }

  const observer = new Observer(() => {
    onResize();
  });

  for (const target of targets) {
    observer.observe(target);
  }

  return () => {
    observer.disconnect();
  };
}
