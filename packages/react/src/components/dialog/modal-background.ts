"use client";

import { useEffect } from "react";

type HiddenElement = {
  inertAttribute: string | null;
  ariaHidden: string | null;
};

type DocumentBackgroundState = {
  /** Acquisition order; the last root is the active modal boundary. */
  roots: Element[];
  hidden: Map<HTMLElement, HiddenElement>;
};

const states = new WeakMap<Document, DocumentBackgroundState>();

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

function isNonVisualElement(element: HTMLElement): boolean {
  return (
    element.tagName === "SCRIPT" ||
    element.tagName === "STYLE" ||
    element.tagName === "LINK" ||
    element.tagName === "META" ||
    element.tagName === "TEMPLATE"
  );
}

function restoreElement(element: HTMLElement, previous: HiddenElement): void {
  if (previous.inertAttribute === null) {
    element.removeAttribute("inert");
  } else {
    element.setAttribute("inert", previous.inertAttribute);
  }
  if (previous.ariaHidden === null) {
    element.removeAttribute("aria-hidden");
  } else {
    element.setAttribute("aria-hidden", previous.ariaHidden);
  }
}

function apply(state: DocumentBackgroundState, documentRef: Document): void {
  const body = documentRef.body;
  if (!body) {
    return;
  }

  const active = new Set<HTMLElement>();
  const topRoot = state.roots.at(-1);
  if (topRoot?.isConnected) {
    const child = topLevelBodyChild(topRoot, body);
    if (child) {
      active.add(child);
    }
  }

  for (const [element, previous] of [...state.hidden]) {
    if (!element.isConnected || active.has(element)) {
      restoreElement(element, previous);
      state.hidden.delete(element);
    }
  }

  for (const child of [...body.children]) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (active.has(child) || isLiveRegion(child) || isNonVisualElement(child)) {
      continue;
    }
    if (state.hidden.has(child)) {
      continue;
    }
    state.hidden.set(child, {
      inertAttribute: child.getAttribute("inert"),
      ariaHidden: child.getAttribute("aria-hidden"),
    });
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }
}

function acquireBackground(documentRef: Document, root: Element): () => void {
  let state = states.get(documentRef);
  if (!state) {
    state = { roots: [], hidden: new Map() };
    states.set(documentRef, state);
  }
  state.roots.push(root);
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
    const index = current.roots.lastIndexOf(root);
    if (index >= 0) {
      current.roots.splice(index, 1);
    }
    if (current.roots.length === 0) {
      for (const [element, previous] of current.hidden) {
        if (element.isConnected) {
          restoreElement(element, previous);
        }
      }
      current.hidden.clear();
      states.delete(documentRef);
      return;
    }
    apply(current, documentRef);
  };
}

/**
 * Mark all body-level background siblings inert while a modal dialog is open.
 * Dialog portal roots (including other open dialogs) are preserved so this does
 * not fight nested dialog lifecycles or sibling overlays rendered inside the
 * dialog portal.
 */
export function useModalBackground(
  root: Element | null,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !root?.isConnected) {
      return;
    }
    const documentRef = root.ownerDocument;
    if (!documentRef?.body) {
      return;
    }
    return acquireBackground(documentRef, root);
  }, [enabled, root]);
}
