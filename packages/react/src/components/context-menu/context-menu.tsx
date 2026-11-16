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
  ContextMenuContext,
  type ContextMenuChangeReason,
  type ContextMenuContextValue,
  type ContextMenuDirection,
  type ContextMenuPoint,
} from "./context.js";

export type ContextMenuProps = {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: ContextMenuChangeReason) => void;
  /** When disabled, native context menus are not suppressed. */
  disabled?: boolean;
  dir?: ContextMenuDirection;
  /** Optional parent layer; otherwise inherited from the enclosing overlay. */
  parentLayer?: LayerStackHandle | null;
};

/**
 * Headless context-menu root. Owns open state, the invocation anchor/point, and
 * generated IDs. It renders no DOM and does not register a layer until content
 * opens.
 */
export function ContextMenu({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  dir = "ltr",
  parentLayer,
}: ContextMenuProps) {
  const inheritedLayer = useContext(OverlayLayerContext);
  const resolvedParentLayer = parentLayer ?? inheritedLayer?.handle ?? null;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [point, setPoint] = useState<ContextMenuPoint | null>(null);
  const [triggerElement, setTriggerElement] = useState<Element | null>(null);
  const isControlled = controlledOpen !== undefined;
  const isOpenState = isControlled ? controlledOpen : uncontrolledOpen;
  const isOpen = isOpenState && !disabled;
  const onOpenChangeRef = useRef(onOpenChange);
  const id = useId();

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpenState) {
      setPoint(null);
    }
  }, [isOpenState]);

  const setOpenState = useCallback(
    (next: boolean, reason: ContextMenuChangeReason) => {
      if (next === isOpenState) {
        return;
      }
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChangeRef.current?.(next, reason);
    },
    [isControlled, isOpenState],
  );

  const openAt = useCallback(
    (
      nextPoint: ContextMenuPoint | null,
      reason: ContextMenuChangeReason = "trigger",
    ) => {
      if (disabled) {
        return;
      }
      setPoint(nextPoint);
      setOpenState(true, reason);
    },
    [disabled, setOpenState],
  );

  const close = useCallback(
    (reason: ContextMenuChangeReason = "programmatic") => {
      setOpenState(false, reason);
    },
    [setOpenState],
  );

  useEffect(() => {
    if (disabled && isOpenState) {
      setOpenState(false, "programmatic");
    }
  }, [disabled, isOpenState, setOpenState]);

  const contextValue = useMemo<ContextMenuContextValue>(
    () => ({
      isOpen,
      disabled,
      direction: dir,
      point,
      triggerElement,
      setTriggerElement,
      triggerId: `${id}-trigger`,
      contentId: `${id}-content`,
      parentLayer: resolvedParentLayer,
      openAt,
      close,
    }),
    [
      close,
      dir,
      disabled,
      id,
      isOpen,
      openAt,
      point,
      resolvedParentLayer,
      triggerElement,
    ],
  );

  return (
    <ContextMenuContext.Provider value={contextValue}>
      {children}
    </ContextMenuContext.Provider>
  );
}
