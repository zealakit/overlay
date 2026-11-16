import {
  type DismissReason,
  type OverlayChangeReason,
  type Placement,
  type PositionerBoundary,
  type PositionerResult,
  type Strategy,
  createOverlayController,
  isBrowser,
} from "@zealakit/overlay-core";
import type { LayerStack } from "@zealakit/overlay-core";

/** How the reference element toggles the overlay. */
export type OverlayTrigger = "click" | "none";

export type OverlayOptions = {
  reference: Element;
  floating: HTMLElement;
  placement?: Placement;
  offset?: number;
  alignOffset?: number;
  /** Collision handling can be tuned per overlay. */
  flip?: boolean;
  shift?: boolean;
  padding?: number;
  boundary?: PositionerBoundary;
  strategy?: Strategy;
  autoUpdate?: boolean;
  /** Portal target for the floating element; omit to keep it in place. */
  portal?: Element | null;
  /** Shared layer stack. One stack per document is recommended. */
  stack?: LayerStack;
  /** Extra elements that belong to the interaction boundary. */
  boundaries?: readonly (Element | null)[];
  defaultOpen?: boolean;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  trigger?: OverlayTrigger;
  onOpenChange?: (open: boolean, reason?: DismissReason) => void;
};

export type OverlayState = {
  open: boolean;
  placement: Placement;
};

export type OverlayListener = (state: OverlayState) => void;

export type Overlay = {
  readonly isOpen: boolean;
  readonly placement: Placement;
  open(): void;
  close(reason?: DismissReason): void;
  toggle(): void;
  update(): Promise<PositionerResult | null>;
  subscribe(listener: OverlayListener): () => void;
  destroy(): void;
};

function toDismissReason(reason: OverlayChangeReason): DismissReason {
  switch (reason) {
    case "escape-key":
    case "outside-press":
    case "reference-press":
    case "imperative":
      return reason;
    case "trigger":
      return "reference-press";
    default:
      return "imperative";
  }
}

/**
 * Create an imperative overlay.
 *
 * A thin wrapper over the shared overlay controller (popover kind): it
 * positions `floating` against `reference`, registers it on a layer stack for
 * Escape/outside-press dismissal, and hides it while closed.
 */
export function createOverlay(options: OverlayOptions): Overlay {
  if (!isBrowser()) {
    throw new Error("[overlay-vanilla] createOverlay requires a browser DOM.");
  }

  const { onOpenChange } = options;
  const controller = createOverlayController({
    kind: "popover",
    trigger: options.reference as HTMLElement,
    content: options.floating,
    defaultOpen: options.defaultOpen,
    toggleOnTriggerClick: (options.trigger ?? "click") === "click",
    onOpenChange: (open, reason) =>
      onOpenChange?.(open, open ? undefined : toDismissReason(reason)),
    portal: options.portal ?? null,
    stack: options.stack,
    boundaries: options.boundaries,
    placement: options.placement ?? "bottom",
    offset: options.offset,
    alignOffset: options.alignOffset,
    flip: options.flip,
    shift: options.shift,
    padding: options.padding,
    boundary: options.boundary,
    strategy: options.strategy,
    autoUpdate: options.autoUpdate,
    dismissOnEscape: options.dismissOnEscape,
    dismissOnOutsidePress: options.dismissOnOutsidePress,
    restoreFocus: false,
  });

  let destroyed = false;
  let placement: Placement = options.placement ?? "bottom";
  const stopTracking = controller.subscribe((state) => {
    placement = state.placement;
  });

  return {
    get isOpen() {
      return !destroyed && controller.isOpen;
    },
    get placement() {
      return placement;
    },
    open: () => controller.open(),
    close: (reason = "imperative") => controller.close(reason),
    toggle: () =>
      controller.isOpen ? controller.close("imperative") : controller.open(),
    update: (): Promise<PositionerResult | null> => controller.update(),
    subscribe(listener: OverlayListener) {
      let initial = true;
      const unsubscribe = controller.subscribe((state) => {
        if (initial) {
          return;
        }
        listener({ open: state.isOpen, placement: state.placement });
      });
      initial = false;
      return unsubscribe;
    },
    destroy() {
      if (destroyed) {
        return;
      }
      stopTracking();
      controller.destroy();
      destroyed = true;
    },
  };
}
