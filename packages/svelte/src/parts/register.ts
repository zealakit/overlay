import type { Action } from "svelte/action";

/** Hand the element to a setter on mount and clear it on destroy. */
export const register: Action<
  HTMLElement,
  (element: HTMLElement | null) => void
> = (node, setter) => {
  setter(node);
  return {
    destroy() {
      setter(null);
    },
  };
};
