"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, RefCallback } from "react";
import type {
  DismissReason,
  LayerStack,
  Placement,
  PositionerOptions,
  PositionerResult,
} from "@zealakit/overlay-core";
import { useLayer } from "./use-layer.js";
import { usePositioner } from "./use-positioner.js";

export type UseOverlayOptions = PositionerOptions & {
  defaultOpen?: boolean;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  /** Extra elements that belong to the layer interaction boundary. */
  boundaries?: readonly (Element | null)[];
  onOpenChange?: (open: boolean, reason?: DismissReason) => void;
  /** Share a layer stack explicitly; defaults to a per-document shared stack. */
  stack?: LayerStack;
};

export type UseOverlayReturn = {
  isOpen: boolean;
  /** Placement after the latest measurement (or the requested placement). */
  placement: Placement;
  referenceRef: RefCallback<Element>;
  floatingRef: RefCallback<HTMLElement>;
  referenceElement: Element | null;
  floatingElement: HTMLElement | null;
  floatingStyles: CSSProperties;
  open(): void;
  close(reason?: DismissReason): void;
  toggle(): void;
  update(): Promise<PositionerResult | null>;
};

/**
 * Uncontrolled overlay composition: positioning plus a layer registration
 * while open. DOM work happens in effects, so the hook is SSR-safe.
 */
export function useOverlay(options: UseOverlayOptions = {}): UseOverlayReturn {
  const {
    defaultOpen = false,
    dismissOnEscape = true,
    dismissOnOutsidePress = true,
    boundaries,
    onOpenChange,
    stack,
    ...positioning
  } = options;

  const positioner = usePositioner(positioning);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isOpenRef = useRef(isOpen);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const open = useCallback(() => {
    if (isOpenRef.current) {
      return;
    }
    isOpenRef.current = true;
    setIsOpen(true);
    onOpenChangeRef.current?.(true);
  }, []);

  const close = useCallback((reason: DismissReason = "imperative") => {
    if (!isOpenRef.current) {
      return;
    }
    isOpenRef.current = false;
    setIsOpen(false);
    onOpenChangeRef.current?.(false, reason);
  }, []);

  const toggle = useCallback(() => {
    if (isOpenRef.current) {
      close("imperative");
    } else {
      open();
    }
  }, [close, open]);

  useLayer({
    element: positioner.floatingElement,
    reference: positioner.referenceElement,
    boundaries,
    dismissOnEscape,
    dismissOnOutsidePress,
    stack,
    disabled: !isOpen,
    onDismiss: close,
  });

  const result = positioner.result;
  const floatingStyles: CSSProperties = result
    ? { position: result.strategy, left: result.x, top: result.y }
    : { position: "fixed", left: 0, top: 0 };

  return {
    isOpen,
    placement: result?.placement ?? positioning.placement ?? "bottom",
    referenceRef: positioner.referenceRef,
    floatingRef: positioner.floatingRef,
    referenceElement: positioner.referenceElement,
    floatingElement: positioner.floatingElement,
    floatingStyles,
    open,
    close,
    toggle,
    update: positioner.update,
  };
}
