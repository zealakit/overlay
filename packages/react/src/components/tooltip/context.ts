"use client";

import { createContext, useContext } from "react";

export type TooltipDirection = "ltr" | "rtl";

export type TooltipChangeReason =
  | "hover"
  | "focus"
  | "escape"
  | "outside-press"
  | "trigger"
  | "programmatic";

export type TooltipContextValue = {
  isOpen: boolean;
  disabled: boolean;
  direction: TooltipDirection;
  hoverableContent: boolean;
  triggerElement: Element | null;
  contentElement: Element | null;
  setTriggerElement(element: Element | null): void;
  setContentElement(element: Element | null): void;
  pointerEnter(pointerType: string): void;
  pointerLeave(): void;
  focus(): void;
  blur(): void;
  contentEnter(): void;
  contentLeave(): void;
  click(): void;
  dismiss(reason: TooltipChangeReason): void;
};

export const TooltipContext = createContext<TooltipContextValue | null>(null);

export function useTooltipContext(part: string): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <Tooltip>.`,
    );
  }
  return context;
}
