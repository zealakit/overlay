"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { getActiveElement } from "@zealakit/overlay-core";

const ITEM_SELECTOR = [
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
].join(",");

function isNavigable(element: HTMLElement, container: HTMLElement): boolean {
  if (element.closest('[role="menu"]') !== container) {
    return false;
  }
  if (
    element.getAttribute("aria-disabled") === "true" ||
    element.hasAttribute("disabled") ||
    element.hidden
  ) {
    return false;
  }
  return true;
}

export function getMenuItems(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)].filter(
    (element) => isNavigable(element, container),
  );
}

export function focusMenuItem(element: HTMLElement | null): boolean {
  if (!element?.isConnected) {
    return false;
  }
  element.focus();
  return getActiveElement(element.ownerDocument) === element;
}

export function focusFirstMenuItem(container: HTMLElement): HTMLElement | null {
  const first = getMenuItems(container)[0] ?? null;
  if (first) {
    focusMenuItem(first);
  } else if (container.isConnected) {
    container.focus();
  }
  return first;
}

export function focusLastMenuItem(container: HTMLElement): HTMLElement | null {
  const items = getMenuItems(container);
  const last = items.at(-1) ?? null;
  if (last) {
    focusMenuItem(last);
  } else if (container.isConnected) {
    container.focus();
  }
  return last;
}

function moveFocus(container: HTMLElement, delta: 1 | -1): void {
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

function typeahead(
  container: HTMLElement,
  buffer: string,
  active: Element | null,
): void {
  const items = getMenuItems(container);
  if (items.length === 0) {
    return;
  }
  const normalized = buffer.toLocaleLowerCase();
  const currentIndex = active ? items.indexOf(active as HTMLElement) : -1;
  const ordered = [
    ...items.slice(currentIndex + 1),
    ...items.slice(0, currentIndex + 1),
  ];
  const match = ordered.find((item) =>
    (item.textContent ?? "").trim().toLocaleLowerCase().startsWith(normalized),
  );
  if (match) {
    focusMenuItem(match);
  }
}

export function useMenuAutoFocus(
  container: HTMLElement | null,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !container) {
      return;
    }
    focusFirstMenuItem(container);
  }, [container, enabled]);
}

export function useMenuNavigation(
  container: HTMLElement | null,
  enabled: boolean,
): (event: ReactKeyboardEvent<HTMLElement>) => void {
  const bufferRef = useRef("");
  const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bufferTimerRef.current !== null) {
        clearTimeout(bufferTimerRef.current);
      }
    };
  }, []);

  return useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (!enabled || !container || event.defaultPrevented) {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(container, 1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(container, -1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        focusFirstMenuItem(container);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        focusLastMenuItem(container);
        return;
      }
      if (event.key.length === 1 && event.key !== " ") {
        event.preventDefault();
        const next = `${bufferRef.current}${event.key}`;
        if (bufferTimerRef.current !== null) {
          clearTimeout(bufferTimerRef.current);
        }
        bufferTimerRef.current = setTimeout(() => {
          bufferRef.current = "";
          bufferTimerRef.current = null;
        }, 500);
        bufferRef.current = next;
        typeahead(container, next, getActiveElement(container.ownerDocument));
      }
    },
    [container, enabled],
  );
}
