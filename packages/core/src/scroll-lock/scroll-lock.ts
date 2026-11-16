import type { Cleanup } from "../types/lifecycle.js";

type ScrollLockState = {
  count: number;
  bodyOverflow: string;
  bodyPaddingRight: string;
  htmlOverflow: string;
};

const states = new WeakMap<Document, ScrollLockState>();

function resolveDocument(documentRef?: Document): Document | null {
  if (documentRef?.body) {
    return documentRef;
  }
  return typeof document !== "undefined" && document.body ? document : null;
}

/**
 * Reference-counted body scroll lock for modal overlays.
 *
 * The first lock saves the current inline overflow/padding styles and applies
 * `overflow: hidden` plus scrollbar-width compensation. Nested locks only
 * increment a counter; the final release restores the original styles.
 *
 * This intentionally does not attach global event listeners. Callers own the
 * lock lifetime and must call the returned cleanup on close/unmount.
 */
export function lockBodyScroll(documentRef?: Document): Cleanup {
  const document_ = resolveDocument(documentRef);
  if (!document_) {
    return () => {};
  }

  const body = document_.body;
  const root = document_.documentElement;
  const view = document_.defaultView;

  let state = states.get(document_);
  if (!state) {
    const scrollbarGap = view
      ? Math.max(0, view.innerWidth - root.clientWidth)
      : 0;
    const currentPadding = view
      ? Number.parseFloat(view.getComputedStyle(body).paddingRight) || 0
      : 0;

    state = {
      count: 0,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: root.style.overflow,
    };
    states.set(document_, state);

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${currentPadding + scrollbarGap}px`;
    }
  }

  state.count += 1;
  let released = false;

  return () => {
    if (released) {
      return;
    }
    released = true;
    const current = states.get(document_);
    if (!current) {
      return;
    }
    current.count -= 1;
    if (current.count > 0) {
      return;
    }

    body.style.overflow = current.bodyOverflow;
    body.style.paddingRight = current.bodyPaddingRight;
    root.style.overflow = current.htmlOverflow;
    states.delete(document_);
  };
}
