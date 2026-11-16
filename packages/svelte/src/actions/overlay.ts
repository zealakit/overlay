import type { Action } from "svelte/action";
import type {
  DismissReason,
  LayerStack,
  Placement,
  PositionerBoundary,
  PositionerOptions,
  PositionerResult,
  Strategy,
} from "@zealakit/overlay-core";
import { createLayer } from "../layer/create-layer.js";
import { createPositioner } from "../positioning/create-positioner.js";

export type OverlayActionParams = {
  /** Anchor element; the action is attached to the floating element. */
  reference: Element | null | undefined;
  open: boolean;
  /** Extra elements that belong to the interaction boundary. */
  boundaries?: readonly (Element | null)[];
  placement?: Placement;
  offset?: number;
  alignOffset?: number;
  flip?: boolean;
  shift?: boolean;
  padding?: number;
  boundary?: PositionerBoundary;
  strategy?: Strategy;
  autoUpdate?: boolean;
  stack?: LayerStack;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  onDismiss?: (reason: DismissReason) => void;
  onUpdate?: (result: PositionerResult) => void;
};

/**
 * `use:overlay` — positioning + layer registration for an open/closed overlay.
 *
 * The host owns `open`; closing removes the layer and pauses positioning.
 * `use:portal` can be combined on the same node for DOM transport.
 */
export const overlay: Action<HTMLElement, OverlayActionParams | undefined> = (
  node,
  params,
) => {
  let current = params;

  const positioningOptions = (
    next: OverlayActionParams | undefined,
  ): PositionerOptions => ({
    placement: next?.placement,
    offset: next?.offset,
    alignOffset: next?.alignOffset,
    flip: next?.flip,
    shift: next?.shift,
    padding: next?.padding,
    boundary: next?.boundary,
    strategy: next?.strategy,
    autoUpdate: next?.autoUpdate,
  });

  const positioner = createPositioner({
    ...positioningOptions(params),
    reference: null,
    floating: null,
  });
  const layer = createLayer({ element: node, disabled: true });

  const unsubscribe = positioner.subscribe((result) => {
    if (result) {
      current?.onUpdate?.(result);
    }
  });

  const apply = (): void => {
    const open = current?.open ?? false;
    node.dataset.state = open ? "open" : "closed";

    positioner.setOptions(positioningOptions(current));
    positioner.setReference(open ? (current?.reference ?? null) : null);
    positioner.setFloating(open ? node : null);

    layer.setOptions({
      element: node,
      reference: current?.reference ?? null,
      boundaries: current?.boundaries,
      stack: current?.stack,
      dismissOnEscape: current?.dismissOnEscape,
      dismissOnOutsidePress: current?.dismissOnOutsidePress,
      disabled: !open,
      onDismiss: (reason) => current?.onDismiss?.(reason),
    });
  };

  apply();

  return {
    update(next) {
      current = next;
      apply();
    },
    destroy() {
      unsubscribe();
      positioner.dispose();
      layer.dispose();
    },
  };
};
