"use client";

import { createContext, useContext } from "react";
import type { LayerStackHandle } from "@zealakit/overlay-core";

export type ContextMenuDirection = "ltr" | "rtl";

export type ContextMenuChangeReason =
  | "trigger"
  | "outside-press"
  | "escape"
  | "select"
  | "programmatic";

export type ContextMenuPoint = {
  x: number;
  y: number;
};

export type ContextMenuContextValue = {
  isOpen: boolean;
  disabled: boolean;
  direction: ContextMenuDirection;
  point: ContextMenuPoint | null;
  triggerElement: Element | null;
  setTriggerElement(element: Element | null): void;
  triggerId: string;
  contentId: string;
  parentLayer: LayerStackHandle | null;
  openAt(
    point: ContextMenuPoint | null,
    reason?: ContextMenuChangeReason,
  ): void;
  close(reason?: ContextMenuChangeReason): void;
};

export const ContextMenuContext = createContext<ContextMenuContextValue | null>(
  null,
);

export function useContextMenuContext(part: string): ContextMenuContextValue {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <ContextMenu>.`,
    );
  }
  return context;
}

export type ContextMenuSubContextValue = {
  isOpen: boolean;
  direction: ContextMenuDirection;
  triggerElement: Element | null;
  setTriggerElement(element: Element | null): void;
  triggerId: string;
  contentId: string;
  open(): void;
  close(): void;
  toggle(): void;
  scheduleClose(): void;
  cancelClose(): void;
};

export const ContextMenuSubContext =
  createContext<ContextMenuSubContextValue | null>(null);

export function useContextMenuSubContext(
  part: string,
): ContextMenuSubContextValue {
  const context = useContext(ContextMenuSubContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <ContextMenuSub>.`,
    );
  }
  return context;
}

export type ContextMenuGroupContextValue = {
  setLabelId(id: string | null): void;
};

export const ContextMenuGroupContext =
  createContext<ContextMenuGroupContextValue | null>(null);

export type ContextMenuRadioGroupContextValue = {
  value: string | undefined;
  setValue(value: string): void;
};

export const ContextMenuRadioGroupContext =
  createContext<ContextMenuRadioGroupContextValue | null>(null);

export function useContextMenuRadioGroup(
  part: string,
): ContextMenuRadioGroupContextValue {
  const context = useContext(ContextMenuRadioGroupContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <ContextMenuRadioGroup>.`,
    );
  }
  return context;
}
