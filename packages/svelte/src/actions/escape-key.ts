import type { Action } from "svelte/action";
import { isEscapeKey, listen } from "@zealakit/overlay-core";

export type EscapeKeyActionParams = {
  handler: (event: KeyboardEvent) => void;
  enabled?: boolean;
  /** Defaults to the global document. */
  target?: Document | HTMLElement | null;
};

/**
 * `use:escapeKey` — call `handler` when Escape is pressed on the target.
 *
 * Layer actions already route Escape to the topmost layer; use this for
 * interactions outside that model.
 */
export const escapeKey: Action<
  HTMLElement,
  EscapeKeyActionParams | undefined
> = (_node, params) => {
  let current = params;
  let cleanup: (() => void) | null = null;

  const detach = (): void => {
    cleanup?.();
    cleanup = null;
  };

  const attach = (): void => {
    detach();
    if (!current || current.enabled === false) {
      return;
    }

    const target =
      current.target ?? (typeof document !== "undefined" ? document : null);
    if (!target) {
      return;
    }

    cleanup = listen<KeyboardEvent>(target, "keydown", (event) => {
      if (isEscapeKey(event)) {
        current?.handler(event);
      }
    });
  };

  attach();

  return {
    update(next) {
      current = next;
      attach();
    },
    destroy() {
      detach();
    },
  };
};
