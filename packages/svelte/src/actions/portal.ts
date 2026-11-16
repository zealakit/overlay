import {
  moveToPortal,
  restorePortal,
  type PortalState,
} from "@zealakit/overlay-core";
import type { Action } from "svelte/action";

export type PortalActionParams = {
  /** CSS selector or element. Defaults to `document.body`. */
  target?: string | Element | null;
  disabled?: boolean;
};

/**
 * `use:portal` — move an element into a portal target for its lifetime and
 * restore its original position when destroyed.
 */
export const portal: Action<HTMLElement, PortalActionParams | undefined> = (
  node,
  params,
) => {
  let current = params;
  let state: PortalState | null = null;

  const resolveTarget = (
    target: PortalActionParams["target"],
  ): Element | null => {
    if (typeof target === "string") {
      return document.querySelector(target);
    }
    return target ?? document.body;
  };

  const move = (): void => {
    if (state) {
      return;
    }
    const target = resolveTarget(current?.target);
    if (target) {
      state = moveToPortal(node, target);
    }
  };

  const restore = (): void => {
    restorePortal(state);
    state = null;
  };

  if (!current?.disabled) {
    move();
  }

  return {
    update(next) {
      current = next;
      restore();
      if (!current?.disabled) {
        move();
      }
    },
    destroy() {
      restore();
    },
  };
};
