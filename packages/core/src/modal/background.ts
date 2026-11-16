import type { Cleanup } from "../types/lifecycle.js";
import { getGlobalState } from "../utils/global-state.js";

type SavedAttributes = {
  inert: string | null;
  ariaHidden: string | null;
};

type DocumentState = {
  /** Acquisition order; the last entry's roots are the active modal boundary. */
  entries: Element[][];
  hidden: Map<HTMLElement, SavedAttributes>;
};

const states = getGlobalState(
  "modal-background",
  () => new WeakMap<Document, DocumentState>(),
);

function topLevelBodyChild(
  root: Element,
  body: HTMLElement,
): HTMLElement | null {
  let node: Element | null = root;
  while (node?.parentElement && node.parentElement !== body) {
    node = node.parentElement;
  }
  return node?.parentElement === body ? (node as HTMLElement) : null;
}

function isLiveRegion(element: HTMLElement): boolean {
  if (element.hasAttribute("aria-live")) {
    return true;
  }
  const role = element.getAttribute("role");
  return role === "status" || role === "alert" || role === "log";
}

function isNonVisual(element: HTMLElement): boolean {
  return ["SCRIPT", "STYLE", "LINK", "META", "TEMPLATE"].includes(
    element.tagName,
  );
}

function restore(element: HTMLElement, saved: SavedAttributes): void {
  if (saved.inert === null) {
    element.removeAttribute("inert");
  } else {
    element.setAttribute("inert", saved.inert);
  }
  if (saved.ariaHidden === null) {
    element.removeAttribute("aria-hidden");
  } else {
    element.setAttribute("aria-hidden", saved.ariaHidden);
  }
}

function apply(state: DocumentState, documentRef: Document): void {
  const body = documentRef.body;
  const top = state.entries.at(-1);
  if (!body || !top) {
    return;
  }

  const active = new Set<HTMLElement>();
  for (const root of top) {
    if (!root.isConnected) {
      continue;
    }
    const child = topLevelBodyChild(root, body);
    if (child) {
      active.add(child);
    }
  }

  for (const [element, saved] of [...state.hidden]) {
    if (!element.isConnected || active.has(element)) {
      restore(element, saved);
      state.hidden.delete(element);
    }
  }

  for (const child of [...body.children]) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (active.has(child) || isLiveRegion(child) || isNonVisual(child)) {
      continue;
    }
    if (state.hidden.has(child)) {
      continue;
    }
    state.hidden.set(child, {
      inert: child.getAttribute("inert"),
      ariaHidden: child.getAttribute("aria-hidden"),
    });
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }
}

/**
 * Mark every body-level sibling of `roots` inert and `aria-hidden` while a
 * modal is open. Live regions and non-visual elements are left alone.
 *
 * Acquisitions stack per document: only the most recent one is enforced, and
 * releasing it re-applies the previous one. Cleanup is idempotent and restores
 * each element's original `inert`/`aria-hidden` attributes.
 */
export function acquireModalBackground(
  documentRef: Document,
  roots: readonly Element[],
): Cleanup {
  let state = states.get(documentRef);
  if (!state) {
    state = { entries: [], hidden: new Map() };
    states.set(documentRef, state);
  }
  const entry = [...roots];
  state.entries.push(entry);
  apply(state, documentRef);

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const current = states.get(documentRef);
    if (!current) {
      return;
    }
    const index = current.entries.lastIndexOf(entry);
    if (index >= 0) {
      current.entries.splice(index, 1);
    }
    if (current.entries.length === 0) {
      for (const [element, saved] of current.hidden) {
        restore(element, saved);
      }
      current.hidden.clear();
      states.delete(documentRef);
      return;
    }
    apply(current, documentRef);
  };
}
