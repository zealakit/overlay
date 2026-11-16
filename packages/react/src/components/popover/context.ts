"use client";

import { createContext, useContext } from "react";
import type { LayerStackHandle } from "@zealakit/overlay-core";

export type PopoverChangeReason =
  | "trigger"
  | "outside-press"
  | "escape"
  | "close-button"
  | "programmatic";

export type PopoverDirection = "ltr" | "rtl";

export type PopoverContextValue = {
  isOpen: boolean;
  open(): void;
  close(reason?: PopoverChangeReason): void;
  toggle(reason?: PopoverChangeReason): void;
  triggerElement: Element | null;
  setTriggerElement(element: Element | null): void;
  triggerId: string;
  contentId: string;
  titleId: string;
  descriptionId: string;
  direction: PopoverDirection;
  dismissOnEscape: boolean;
  dismissOnOutsidePress: boolean;
  parentLayer: LayerStackHandle | null;
};

export const PopoverContext = createContext<PopoverContextValue | null>(null);

export function usePopoverContext(part: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <Popover>.`,
    );
  }
  return context;
}

export type PopoverContentContextValue = {
  setTitleId(id: string | null): void;
  setDescriptionId(id: string | null): void;
};

export const PopoverContentContext =
  createContext<PopoverContentContextValue | null>(null);

export function usePopoverContentContext(
  part: string,
): PopoverContentContextValue {
  const context = useContext(PopoverContentContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <PopoverPopup> or <PopoverContent>.`,
    );
  }
  return context;
}
