import { createDisposer } from "../lifecycle/disposer.js";
import { listen } from "../lifecycle/events.js";
import { observeResize } from "../lifecycle/observers.js";
import type { ReferenceElement } from "../types/element.js";
import { isBrowser, isElement } from "../utils/dom.js";

export type WatchPositionOptions = {
  reference: ReferenceElement;
  floating: Element;
  onChange: () => void;
};

/**
 * Re-run a positioning callback when the reference/floating geometry or the
 * viewport changes. Returns an idempotent cleanup.
 */
export function watchPosition({
  reference,
  floating,
  onChange,
}: WatchPositionOptions): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const ownerDocument = floating.ownerDocument;
  const view = ownerDocument.defaultView;
  if (!view) {
    return () => {};
  }

  const disposer = createDisposer();
  const listener = (): void => {
    onChange();
  };

  disposer.add(listen(view, "resize", listener, { passive: true }));
  disposer.add(
    listen(ownerDocument, "scroll", listener, {
      capture: true,
      passive: true,
    }),
  );

  const observed: Element[] = [floating];
  if (isElement(reference)) {
    observed.push(reference);
  }
  disposer.add(observeResize(observed, listener));

  return () => disposer.dispose();
}
