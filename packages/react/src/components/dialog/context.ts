"use client";

import { createContext, useContext } from "react";
import type { LayerStackHandle } from "@zealakit/overlay-core";

export type DialogChangeReason =
  | "trigger"
  | "outside-press"
  | "escape"
  | "close-button"
  | "programmatic";

export type DialogDirection = "ltr" | "rtl";

export type DialogContextValue = {
  isOpen: boolean;
  open(): void;
  close(reason?: DialogChangeReason): void;
  toggle(reason?: DialogChangeReason): void;
  triggerElement: Element | null;
  setTriggerElement(element: Element | null): void;
  triggerId: string;
  contentId: string;
  titleId: string;
  descriptionId: string;
  direction: DialogDirection;
  modal: boolean;
  nested: boolean;
  lockScroll: boolean;
  dismissOnEscape: boolean;
  dismissOnOutsidePress: boolean;
  parentLayer: LayerStackHandle | null;
};

export const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialogContext(part: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <Dialog>.`,
    );
  }
  return context;
}

export type DialogNestingContextValue = {
  reportNestedOpen(open: boolean): void;
};

/** Supplied by a DialogPopup to descendants so nested Dialog roots can report state. */
export const DialogNestingContext =
  createContext<DialogNestingContextValue | null>(null);

export type DialogContentContextValue = {
  setTitleId(id: string | null): void;
  setDescriptionId(id: string | null): void;
};

export const DialogContentContext =
  createContext<DialogContentContextValue | null>(null);

export function useDialogContentContext(
  part: string,
): DialogContentContextValue {
  const context = useContext(DialogContentContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <DialogPopup> or <DialogContent>.`,
    );
  }
  return context;
}

export type DialogPortalContextValue = {
  /** Top-level dialog portal wrapper, when rendered through DialogPortal. */
  root: HTMLElement | null;
};

export const DialogPortalContext = createContext<DialogPortalContextValue>({
  root: null,
});

export function useDialogPortalContext(): DialogPortalContextValue {
  return useContext(DialogPortalContext);
}
