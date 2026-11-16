import {
  type DismissReason,
  type Layer,
  type LayerEvent,
  type Placement,
  type PositionerBoundary,
  type PositionerResult,
  type Strategy,
  createLayer,
  acquireSharedLayerStack,
  isBrowser,
} from "@zealakit/overlay-core";
import { createFloating } from "../positioning/create-floating.js";
import {
  type PortalState,
  moveToPortal,
  restoreFromPortal,
} from "../portal/portal.js";
import type {
  LayerStack,
  LayerStackHandle,
  LayerStackLease,
} from "@zealakit/overlay-core";

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

/**
 * Create an imperative overlay controller.
 *
 * Positioning is delegated to `createFloating()` (core's collision-aware
 * positioner), dismissal to a shared layer stack. The floating element is
 * hidden while closed and moved into `portal` while open.
 */
export function createOverlay(options: OverlayOptions): Overlay {
  if (!isBrowser()) {
    throw new Error("[overlay-vanilla] createOverlay requires a browser DOM.");
  }

  const {
    reference,
    floating,
    portal = null,
    trigger = "click",
    onOpenChange,
  } = options;

  let layerStack: LayerStack;
  let sharedStack: LayerStackLease | null = null;
  if (options.stack) {
    layerStack = options.stack;
  } else {
    sharedStack = acquireSharedLayerStack(floating.ownerDocument);
    layerStack = sharedStack.stack;
  }
  const layer: Layer = createLayer({ defaultOpen: options.defaultOpen });
  const floatingController = createFloating({
    reference: null,
    floating: null,
    placement: options.placement,
    offset: options.offset,
    alignOffset: options.alignOffset,
    flip: options.flip,
    shift: options.shift,
    padding: options.padding,
    boundary: options.boundary,
    strategy: options.strategy,
    autoUpdate: options.autoUpdate,
  });

  const listeners = new Set<OverlayListener>();
  let layerHandle: LayerStackHandle | null = null;
  let portalState: PortalState = null;
  let destroyed = false;

  const currentPlacement = (): Placement =>
    floatingController.result?.placement ?? options.placement ?? "bottom";

  const notify = (): void => {
    const state: OverlayState = {
      open: layer.status === "open",
      placement: currentPlacement(),
    };
    for (const listener of [...listeners]) {
      listener(state);
    }
  };

  const syncAttributes = (open: boolean): void => {
    floating.dataset.state = open ? "open" : "closed";
    if (open) {
      floating.removeAttribute("hidden");
    } else {
      floating.setAttribute("hidden", "");
    }
  };

  const open = (): void => {
    layer.open();
  };

  const close = (reason: DismissReason = "imperative"): void => {
    layer.close(reason);
  };

  const toggle = (): void => {
    if (layer.status === "open") {
      close("imperative");
    } else {
      open();
    }
  };

  const handleReferenceClick = (): void => {
    if (layer.status === "open") {
      close("reference-press");
    } else {
      open();
    }
  };

  const start = (): void => {
    if (portal) {
      portalState = moveToPortal(floating, portal);
    }
    syncAttributes(true);

    floatingController.setReference(reference);
    floatingController.setFloating(floating);

    layerHandle = layerStack.register({
      element: floating,
      reference,
      boundaries: options.boundaries,
      dismissOnEscape: options.dismissOnEscape ?? true,
      dismissOnOutsidePress: options.dismissOnOutsidePress ?? true,
      onDismiss: (reason) => close(reason),
    });
  };

  const stop = (): void => {
    layerHandle?.dispose();
    layerHandle = null;

    floatingController.setFloating(null);
    floatingController.setReference(null);
    syncAttributes(false);
  };

  const update = async (): Promise<PositionerResult | null> => {
    if (destroyed || layer.status !== "open") {
      return null;
    }
    return floatingController.update();
  };

  const handleLayerEvent = (event: LayerEvent): void => {
    if (event.type === "open") {
      start();
    } else {
      stop();
    }

    notify();
    onOpenChange?.(
      event.status === "open",
      event.type === "close" ? event.reason : undefined,
    );
  };

  const unsubscribe = layer.subscribe(handleLayerEvent);

  syncAttributes(layer.status === "open");
  if (layer.status === "open") {
    start();
  }
  if (trigger === "click") {
    reference.addEventListener("click", handleReferenceClick);
  }

  return {
    get isOpen() {
      return layer.status === "open";
    },
    get placement() {
      return currentPlacement();
    },
    open,
    close,
    toggle,
    update,
    subscribe(listener: OverlayListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      if (trigger === "click") {
        reference.removeEventListener("click", handleReferenceClick);
      }
      unsubscribe();
      layer.destroy();
      stop();
      floatingController.dispose();
      if (portalState) {
        restoreFromPortal(floating, portalState);
        portalState = null;
      }
      sharedStack?.release();
      listeners.clear();
    },
  };
}
