"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LayerStackHandle } from "@zealakit/overlay-core";
import { OverlayLayerContext } from "../overlay-context.js";
import {
  DialogContext,
  DialogNestingContext,
  type DialogChangeReason,
  type DialogContextValue,
  type DialogDirection,
} from "./context.js";

export type DialogProps = {
  children?: ReactNode;
  /** Controlled visibility. When set, the Dialog does not own the state. */
  open?: boolean;
  /** Initial visibility in uncontrolled mode. Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: DialogChangeReason) => void;
  /** Defaults to true. */
  modal?: boolean;
  /** Lock document scrolling while modal. Defaults to modal. */
  lockScroll?: boolean;
  /** Defaults to true. */
  dismissOnEscape?: boolean;
  /** Defaults to true. */
  dismissOnOutsidePress?: boolean;
  dir?: DialogDirection;
  /** Optional explicit parent layer; otherwise inherited from the enclosing overlay. */
  parentLayer?: LayerStackHandle | null;
};

/**
 * Headless Dialog root. Owns controlled/uncontrolled state and the title,
 * description, trigger, and content IDs. It renders no DOM.
 */
export function Dialog({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  lockScroll,
  dismissOnEscape = true,
  dismissOnOutsidePress = true,
  dir = "ltr",
  parentLayer,
}: DialogProps) {
  const inheritedLayer = useContext(OverlayLayerContext);
  const nesting = useContext(DialogNestingContext);
  const resolvedParentLayer = parentLayer ?? inheritedLayer?.handle ?? null;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const onOpenChangeRef = useRef(onOpenChange);
  const id = useId();

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!nesting) {
      return;
    }
    if (isOpen) {
      nesting.reportNestedOpen(true);
    }
    return () => {
      if (isOpen) {
        nesting.reportNestedOpen(false);
      }
    };
  }, [isOpen, nesting]);

  const setOpen = useCallback(
    (next: boolean, reason: DialogChangeReason) => {
      if (next === isOpen) {
        return;
      }
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChangeRef.current?.(next, reason);
    },
    [isControlled, isOpen],
  );

  const open = useCallback(() => {
    setOpen(true, "programmatic");
  }, [setOpen]);

  const close = useCallback(
    (reason: DialogChangeReason = "programmatic") => {
      setOpen(false, reason);
    },
    [setOpen],
  );

  const toggle = useCallback(
    (reason: DialogChangeReason = "trigger") => {
      setOpen(!isOpen, reason);
    },
    [isOpen, setOpen],
  );

  const [triggerElement, setTriggerElement] = useState<Element | null>(null);
  const contextValue = useMemo<DialogContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      triggerElement,
      setTriggerElement,
      triggerId: `${id}-trigger`,
      contentId: `${id}-content`,
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      direction: dir,
      modal,
      nested: nesting !== null,
      lockScroll: lockScroll ?? modal,
      dismissOnEscape,
      dismissOnOutsidePress,
      parentLayer: resolvedParentLayer,
    }),
    [
      close,
      dir,
      dismissOnEscape,
      dismissOnOutsidePress,
      id,
      isOpen,
      lockScroll,
      modal,
      nesting,
      open,
      resolvedParentLayer,
      toggle,
      triggerElement,
    ],
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
}
