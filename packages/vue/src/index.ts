export {
  useContextMenu,
  useDialog,
  useOverlayComponent,
  usePopover,
  useTooltip,
  type ContextMenuOptions,
  type DialogOptions,
  type PopoverOptions,
  type TooltipOptions,
  type UseContextMenuReturn,
  type UseDialogReturn,
  type UseOverlayComponentOptions,
  type UseOverlayComponentReturn,
  type UsePopoverReturn,
  type UseTooltipReturn,
} from "./composables/use-components.js";
export {
  useEscapeKey,
  type UseEscapeKeyOptions,
} from "./composables/use-escape-key.js";
export {
  useLayer,
  type UseLayerOptions,
  type UseLayerReturn,
} from "./composables/use-layer.js";
export {
  useOverlay,
  type OverlayStyles,
  type UseOverlayOptions,
  type UseOverlayReturn,
} from "./composables/use-overlay.js";
export {
  usePositioner,
  type UsePositionerOptions,
  type UsePositionerReturn,
} from "./composables/use-positioner.js";

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

export type {
  DismissReason,
  LayerStack,
  LayerStackHandle,
  Placement,
  PositionerOptions,
  PositionerResult,
} from "@zealakit/overlay-core";
