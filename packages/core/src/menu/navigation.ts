import { getActiveElement } from "../focus/focus.js";

const ITEM_SELECTOR = [
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
].join(",");

function isNavigable(element: HTMLElement, container: HTMLElement): boolean {
  // Items of a nested menu belong to that menu, not to this one.
  if (element.closest('[role="menu"]') !== container) {
    return false;
  }
  return !(
    element.getAttribute("aria-disabled") === "true" ||
    element.hasAttribute("disabled") ||
    element.hidden
  );
}

/** Enabled, visible menu items that directly belong to `container`. */
export function getMenuItems(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)].filter(
    (element) => isNavigable(element, container),
  );
}

/** Focus a menu item. Returns whether it ended up as the active element. */
export function focusMenuItem(element: HTMLElement | null): boolean {
  if (!element?.isConnected) {
    return false;
  }
  element.focus();
  return getActiveElement(element.ownerDocument) === element;
}

/** Focus the first item, or the container itself when it has none. */
export function focusFirstMenuItem(container: HTMLElement): HTMLElement | null {
  const first = getMenuItems(container)[0] ?? null;
  if (first) {
    focusMenuItem(first);
  } else if (container.isConnected) {
    container.focus();
  }
  return first;
}

/** Focus the last item, or the container itself when it has none. */
export function focusLastMenuItem(container: HTMLElement): HTMLElement | null {
  const last = getMenuItems(container).at(-1) ?? null;
  if (last) {
    focusMenuItem(last);
  } else if (container.isConnected) {
    container.focus();
  }
  return last;
}

/** Move focus to the next/previous item, wrapping around. */
export function moveMenuFocus(container: HTMLElement, delta: 1 | -1): void {
  const items = getMenuItems(container);
  if (items.length === 0) {
    container.focus();
    return;
  }
  const active = getActiveElement(container.ownerDocument);
  const index = active ? items.indexOf(active as HTMLElement) : -1;
  const nextIndex =
    index === -1
      ? delta > 0
        ? 0
        : items.length - 1
      : (index + delta + items.length) % items.length;
  focusMenuItem(items[nextIndex] ?? null);
}

/**
 * Focus the next item (after `active`, wrapping) whose text starts with
 * `buffer`, case-insensitively.
 */
export function focusMenuTypeahead(
  container: HTMLElement,
  buffer: string,
  active: Element | null,
): HTMLElement | null {
  const items = getMenuItems(container);
  const normalized = buffer.toLocaleLowerCase();
  const currentIndex = active ? items.indexOf(active as HTMLElement) : -1;
  const ordered = [
    ...items.slice(currentIndex + 1),
    ...items.slice(0, currentIndex + 1),
  ];
  const match =
    ordered.find((item) =>
      (item.textContent ?? "")
        .trim()
        .toLocaleLowerCase()
        .startsWith(normalized),
    ) ?? null;
  focusMenuItem(match);
  return match;
}

export type TypeaheadBuffer = {
  /** Append a key and restart the reset timer; returns the current buffer. */
  push(key: string): string;
  clear(): void;
};

/** A character buffer that clears itself after `timeout` ms of inactivity. */
export function createTypeaheadBuffer(timeout = 500): TypeaheadBuffer {
  let value = "";
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    value = "";
  };

  return {
    push(key) {
      if (timer !== null) {
        clearTimeout(timer);
      }
      value += key;
      timer = setTimeout(clear, timeout);
      return value;
    },
    clear,
  };
}
