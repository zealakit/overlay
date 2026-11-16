import {
  createOverlayController,
  type OverlayController,
  type OverlayControllerOptions,
} from "@zealakit/overlay-core";

type BaseOptions = Omit<
  OverlayControllerOptions,
  "kind" | "trigger" | "content"
> & {
  trigger: HTMLElement;
  content: HTMLElement;
};

export type PopoverOptions = BaseOptions;
export type TooltipOptions = BaseOptions;
export type DialogOptions = BaseOptions;
export type ContextMenuOptions = BaseOptions;

export type PopoverController = OverlayController;
export type TooltipController = OverlayController;
export type DialogController = OverlayController;
export type ContextMenuController = OverlayController;

export function createPopover(options: PopoverOptions): PopoverController {
  return createOverlayController({ ...options, kind: "popover" });
}

export function createTooltip(options: TooltipOptions): TooltipController {
  return createOverlayController({ ...options, kind: "tooltip" });
}

export function createDialog(options: DialogOptions): DialogController {
  return createOverlayController({ ...options, kind: "dialog" });
}

export function createContextMenu(
  options: ContextMenuOptions,
): ContextMenuController {
  return createOverlayController({ ...options, kind: "context-menu" });
}
