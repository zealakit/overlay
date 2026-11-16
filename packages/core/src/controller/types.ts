import type { LayerStack, LayerStackHandle } from "../types/layer.js";
import type { AnimationSetting } from "../types/animation.js";
import type {
  PositionerBoundary,
  PositionerResult,
} from "../types/positioner.js";
import type { DismissReason, Placement, Strategy } from "../types/index.js";
import type { Cleanup } from "../types/lifecycle.js";

export type OverlayControllerKind =
  | "popover"
  | "tooltip"
  | "dialog"
  | "context-menu";

export type OverlayChangeReason =
  | DismissReason
  | "trigger"
  | "select"
  | "programmatic";

export type OverlayFocusTarget = "container" | "first" | Element | null;

/** Consumer-owned arrow element positioned by the controller (popover/tooltip). */
export type OverlayArrowOptions = {
  element: HTMLElement;
  /** Edge length in pixels. Defaults to 8. */
  size?: number;
  /** Space kept between the arrow and the popup edges. Defaults to 0. */
  padding?: number;
};

export type OverlayControllerOptions = {
  kind: OverlayControllerKind;
  trigger: HTMLElement;
  content: HTMLElement;
  backdrop?: HTMLElement | null;
  /** Controlled visibility; use setOpen() to reflect external state. */
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  /**
   * Popover/dialog: toggle when the trigger is clicked. Defaults to true; set
   * false to drive open state yourself.
   */
  toggleOnTriggerClick?: boolean;
  onOpenChange?: (open: boolean, reason: OverlayChangeReason) => void;
  onSelect?: (item: HTMLElement, event: MouseEvent) => void;
  portal?: Element | null;
  stack?: LayerStack;
  parentLayer?: LayerStackHandle | null;
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
  /** Arrow element for popover/tooltip. Omitted or null hides the arrow. */
  arrow?: OverlayArrowOptions | null;
  /** Enter/exit animation. Disabled unless `true` or a config is passed. */
  animation?: AnimationSetting;
  dir?: "ltr" | "rtl";
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  modal?: boolean;
  lockScroll?: boolean;
  trapFocus?: boolean;
  initialFocus?: OverlayFocusTarget | boolean;
  finalFocus?: Element | null;
  restoreFocus?: boolean;
  /** Tooltip open/close delays. */
  delay?: number;
  closeDelay?: number;
  hoverableContent?: boolean;
  /** Dialog ARIA relationships. */
  labelledBy?: string;
  describedBy?: string;
};

export type OverlayControllerState = {
  isOpen: boolean;
  placement: Placement;
  point: { x: number; y: number } | null;
};

export type OverlayController = {
  readonly contentId: string;
  readonly isOpen: boolean;
  open(reason?: OverlayChangeReason): void;
  /** Set an explicit context-menu point (null anchors to the trigger). */
  openAt(
    point: { x: number; y: number } | null,
    reason?: OverlayChangeReason,
  ): void;
  close(reason?: OverlayChangeReason): void;
  toggle(reason?: OverlayChangeReason): void;
  /** Reflect controlled external visibility without emitting onOpenChange. */
  setOpen(open: boolean): void;
  setOptions(options: Partial<OverlayControllerOptions>): void;
  update(): Promise<PositionerResult | null>;
  subscribe(listener: (state: OverlayControllerState) => void): Cleanup;
  destroy(): void;
};
