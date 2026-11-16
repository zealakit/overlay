import type { Action } from "svelte/action";
import type { LayerStackHandle } from "@zealakit/overlay-core";
import { type LayerOptions, createLayer } from "../layer/create-layer.js";

export type LayerActionParams = Omit<LayerOptions, "element"> & {
  onRegistered?: (handle: LayerStackHandle | null) => void;
  onTopmostChange?: (isTopmost: boolean) => void;
};

function toLayerOptions(params: LayerActionParams | undefined): LayerOptions {
  return {
    reference: params?.reference,
    boundaries: params?.boundaries,
    parent: params?.parent,
    stack: params?.stack,
    dismissOnEscape: params?.dismissOnEscape,
    dismissOnOutsidePress: params?.dismissOnOutsidePress,
    onDismiss: params?.onDismiss,
    disabled: params?.disabled,
  };
}

/**
 * `use:layer` — register the node as a layer with the shared stack.
 *
 * `onRegistered` exposes the handle (for nesting); `onTopmostChange` reports
 * ordering changes. The action is cleaned up automatically on destroy.
 */
export const layer: Action<HTMLElement, LayerActionParams | undefined> = (
  node,
  params,
) => {
  let current = params;
  const controller = createLayer({ ...toLayerOptions(params), element: node });

  const unsubscribe = controller.subscribe((state) => {
    current?.onRegistered?.(state.handle);
    current?.onTopmostChange?.(state.isTopmost);
  });

  return {
    update(next) {
      current = next;
      controller.setOptions({ ...toLayerOptions(next), element: node });
    },
    destroy() {
      controller.dispose();
      unsubscribe();
    },
  };
};
