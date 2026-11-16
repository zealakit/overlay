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
  const parent = node.parentNode;
  const nextSibling = node.nextSibling;
  let current = params;
  let moved = false;

  const resolveTarget = (
    target: PortalActionParams["target"],
  ): Element | null => {
    if (typeof target === "string") {
      return document.querySelector(target);
    }
    return target ?? document.body;
  };

  const move = (): void => {
    if (!parent || moved) {
      return;
    }

    const target = resolveTarget(current?.target);
    if (!target) {
      return;
    }

    target.appendChild(node);
    moved = true;
  };

  const restore = (): void => {
    if (!moved || !parent) {
      return;
    }

    if (nextSibling?.parentNode === parent) {
      parent.insertBefore(node, nextSibling);
    } else {
      parent.appendChild(node);
    }
    moved = false;
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
