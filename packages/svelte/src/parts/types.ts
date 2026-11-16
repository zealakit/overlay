import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type {
  AnimationSetting,
  OverlayChangeReason,
  OverlayControllerKind,
  Placement,
  PositionerBoundary,
  Strategy,
} from "@zealakit/overlay-core";

export type OverlayRootProps = {
  kind: OverlayControllerKind;
  /** Controlled visibility. Use `bind:open` to keep it in sync. */
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean, reason: OverlayChangeReason) => void;
  placement?: Placement;
  offset?: number;
  alignOffset?: number;
  flip?: boolean;
  shift?: boolean;
  padding?: number;
  boundary?: PositionerBoundary;
  strategy?: Strategy;
  autoUpdate?: boolean;
  dir?: "ltr" | "rtl";
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  /** `true` portals to `document.body`, an element selects a container. */
  portal?: boolean | HTMLElement;
  animation?: AnimationSetting;
  arrow?: boolean;
  arrowSize?: number;
  arrowPadding?: number;
  /** Tooltip only. */
  delay?: number;
  closeDelay?: number;
  hoverableContent?: boolean;
  /** Dialog only. */
  modal?: boolean;
  lockScroll?: boolean;
  /** Popover and Dialog. */
  trapFocus?: boolean;
  initialFocus?: boolean | "container" | "first" | Element | null;
  restoreFocus?: boolean;
  children?: Snippet<[{ open: boolean }]>;
};

type Common = Omit<OverlayRootProps, "kind">;
type TooltipOnly = "delay" | "closeDelay" | "hoverableContent";
type DialogOnly = "modal" | "lockScroll";
type FocusOnly = "trapFocus" | "initialFocus" | "restoreFocus";

export type PopoverProps = Omit<Common, TooltipOnly | DialogOnly>;
export type TooltipProps = Omit<
  Common,
  DialogOnly | FocusOnly | "arrow" | "arrowSize" | "arrowPadding"
> &
  Pick<Common, "arrow" | "arrowSize" | "arrowPadding">;
export type DialogProps = Omit<
  Common,
  TooltipOnly | "arrow" | "arrowSize" | "arrowPadding"
>;
export type ContextMenuProps = Omit<
  Common,
  TooltipOnly | DialogOnly | FocusOnly | "arrow" | "arrowSize" | "arrowPadding"
>;

/** Props for a part that renders one element. */
export type PartProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLAttributes<T>,
  "children"
> & {
  /** Tag to render. */
  as?: string;
  type?: string;
  children?: Snippet<[{ open: boolean }]>;
};
