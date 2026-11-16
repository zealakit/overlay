"use client";

import { useEffect, useRef } from "react";
import { isEscapeKey, listen } from "@zealakit/overlay-core";

export type UseEscapeKeyOptions = {
  enabled?: boolean;
  /** Defaults to the global document. */
  target?: Document | HTMLElement | null;
};

/**
 * Call `handler` when Escape is pressed on the target.
 *
 * This is a general-purpose utility; layer stacks already route Escape to the
 * topmost layer, so use this only for interactions outside that model.
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  options: UseEscapeKeyOptions = {},
): void {
  const { enabled = true, target = null } = options;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const eventTarget =
      target ?? (typeof document !== "undefined" ? document : null);
    if (!eventTarget) {
      return;
    }

    return listen<KeyboardEvent>(eventTarget, "keydown", (event) => {
      if (isEscapeKey(event)) {
        handlerRef.current(event);
      }
    });
  }, [enabled, target]);
}
