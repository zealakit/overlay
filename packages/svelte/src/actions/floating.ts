import type { Action } from "svelte/action";
import type {
  PositionerOptions,
  PositionerResult,
  ReferenceElement,
} from "@zealakit/overlay-core";
import { createPositioner } from "../positioning/create-positioner.js";

export type FloatingActionParams = PositionerOptions & {
  /** Anchor element. The action is attached to the floating element. */
  reference?: ReferenceElement | null;
  /** Set false to pause positioning without unmounting the node. */
  enabled?: boolean;
  /** Write positioning styles to the node. Defaults to true. */
  applyStyles?: boolean;
  onUpdate?: (result: PositionerResult) => void;
};

/**
 * `use:floating` — position a node against a reference element.
 *
 * Parameters are read on every action update; positioning options and the
 * reference element can change without recreating the Core positioner.
 */
export const floating: Action<HTMLElement, FloatingActionParams | undefined> = (
  node,
  params,
) => {
  let current = params;

  const positioningOptions = (
    next: FloatingActionParams | undefined,
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

  const controller = createPositioner({
    ...positioningOptions(params),
    reference: params?.reference ?? null,
    floating: params?.enabled === false ? null : node,
    applyStyles: params?.applyStyles ?? true,
  });

  const unsubscribe = controller.subscribe((result) => {
    if (result) {
      current?.onUpdate?.(result);
    }
  });

  const sync = (): void => {
    controller.setOptions(positioningOptions(current));
    controller.setReference(current?.reference ?? null);
    controller.setFloating(current?.enabled === false ? null : node);
    controller.setApplyStyles(current?.applyStyles ?? true);
  };

  sync();

  return {
    update(next) {
      current = next;
      sync();
    },
    destroy() {
      unsubscribe();
      controller.dispose();
    },
  };
};
