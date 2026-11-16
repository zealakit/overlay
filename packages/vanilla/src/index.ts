export {
  createFocusContainment,
  focusElement,
  focusFirst,
  getActiveElement,
  getFocusableElements,
  isFocusable,
  restoreFocus,
  type FocusContainment,
  type FocusContainmentOptions,
  type FocusContainmentTarget,
} from "@zealakit/overlay-core";
export {
  createLayerStack,
  type LayerStack,
  type LayerStackOptions,
  type LayerStackHandle as LayerHandle,
  type LayerStackRegistration as LayerOptions,
} from "@zealakit/overlay-core";
export {
  createOverlay,
  type Overlay,
  type OverlayListener,
  type OverlayOptions,
  type OverlayState,
  type OverlayTrigger,
} from "./layer/create-overlay.js";
export {
  createPopover,
  createTooltip,
  createDialog,
  createContextMenu,
  type PopoverOptions,
  type TooltipOptions,
  type DialogOptions,
  type ContextMenuOptions,
  type PopoverController,
  type TooltipController,
  type DialogController,
  type ContextMenuController,
} from "./components/overlay-components.js";
export {
  initOverlays,
  type OverlayInstances,
} from "./declarative/init-overlays.js";
export {
  createFloating,
  type Floating,
  type FloatingOptions,
} from "./positioning/create-floating.js";

export type {
  DismissReason,
  Placement,
  PositionerOptions,
  PositionerResult,
  ReferenceElement,
} from "@zealakit/overlay-core";
