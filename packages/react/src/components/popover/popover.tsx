"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useContext,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import type { LayerStackHandle } from "@zealakit/overlay-core";
import { OverlayLayerContext } from "../overlay-context.js";
import {
  PopoverContext,
  type PopoverChangeReason,
  type PopoverContextValue,
  type PopoverDirection,
  usePopoverContext,
} from "./context.js";
import { Slot, composeRefs } from "../slot.js";

export type PopoverProps = {
  children?: ReactNode;
  /** Controlled visibility. When set, the Popover does not own the state. */
  open?: boolean;
  /** Initial visibility in uncontrolled mode. Defaults to false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: PopoverChangeReason) => void;
  /** Defaults to true. */
  dismissOnEscape?: boolean;
  /** Defaults to true. */
  dismissOnOutsidePress?: boolean;
  /** Direction used for start/end alignment. Defaults to ltr. */
  dir?: PopoverDirection;
  /** Optional parent layer for integration with a Dialog/other layer. */
  parentLayer?: LayerStackHandle | null;
};

/**
 * Headless, non-modal Popover root.
 *
 * Owns controlled/uncontrolled open state and generates the trigger/content
 * relationship IDs. It renders no DOM.
 */
export function Popover({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  dismissOnEscape = true,
  dismissOnOutsidePress = true,
  dir = "ltr",
  parentLayer,
}: PopoverProps) {
  const inheritedLayer = useContext(OverlayLayerContext);
  const resolvedParentLayer = parentLayer ?? inheritedLayer?.handle ?? null;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const onOpenChangeRef = useRef(onOpenChange);
  const id = useId();

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const setOpen = useCallback(
    (next: boolean, reason: PopoverChangeReason) => {
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
    (reason: PopoverChangeReason = "programmatic") => {
      setOpen(false, reason);
    },
    [setOpen],
  );

  const toggle = useCallback(
    (reason: PopoverChangeReason = "trigger") => {
      setOpen(!isOpen, reason);
    },
    [isOpen, setOpen],
  );

  const [triggerElement, setTriggerElement] = useState<Element | null>(null);
  const contextValue = useMemo<PopoverContextValue>(
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
      open,
      resolvedParentLayer,
      toggle,
      triggerElement,
    ],
  );

  return (
    <PopoverContext.Provider value={contextValue}>
      {children}
    </PopoverContext.Provider>
  );
}

export type PopoverTriggerProps = ComponentPropsWithoutRef<"button"> & {
  /** Merge trigger behavior onto the single child element instead of wrapping it. */
  asChild?: boolean;
};

/**
 * Trigger button. Renders a native button by default. With `asChild`, the
 * consumer's button/link receives the behavior, refs, ARIA, and handlers
 * without an extra wrapper.
 */
export const PopoverTrigger = forwardRef<HTMLElement, PopoverTriggerProps>(
  function PopoverTrigger(
    { asChild = false, disabled = false, onClick, type, id, children, ...rest },
    forwardedRef,
  ) {
    const popover = usePopoverContext("PopoverTrigger");
    const handleClick: MouseEventHandler<HTMLElement> = (event) => {
      onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented || disabled) {
        return;
      }
      popover.toggle("trigger");
    };
    const refs = useMemo(
      () => composeRefs(forwardedRef, popover.setTriggerElement),
      [forwardedRef, popover.setTriggerElement],
    );
    const shared = {
      ...rest,
      id: id ?? popover.triggerId,
      "aria-expanded": popover.isOpen,
      "aria-controls": popover.isOpen ? popover.contentId : undefined,
      onClick: handleClick,
    };

    if (asChild) {
      return (
        <Slot
          {...shared}
          {...(disabled ? { disabled: true, "aria-disabled": true } : {})}
          ref={refs}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        {...shared}
        ref={refs}
        type={type ?? "button"}
        disabled={disabled}
      >
        {children}
      </button>
    );
  },
);
