"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  createTypeaheadBuffer,
  focusFirstMenuItem,
  focusLastMenuItem,
  focusMenuTypeahead,
  getActiveElement,
  moveMenuFocus,
} from "@zealakit/overlay-core";

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
  const typeahead = useMemo(() => createTypeaheadBuffer(), []);

  useEffect(() => typeahead.clear, [typeahead]);

  return useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (!enabled || !container || event.defaultPrevented) {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveMenuFocus(container, event.key === "ArrowDown" ? 1 : -1);
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
        focusMenuTypeahead(
          container,
          typeahead.push(event.key),
          getActiveElement(container.ownerDocument),
        );
      }
    },
    [container, enabled, typeahead],
  );
}
