"use client";

import {
  forwardRef,
  useMemo,
  type ComponentPropsWithoutRef,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePopoverContext } from "../popover/context.js";
import { Slot, composeRefs } from "../slot.js";
import { useTooltipContext } from "./context.js";

export type TooltipTriggerProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

/**
 * Hover/focus trigger. It does not toggle on click and does not assign
 * aria-expanded or aria-haspopup; it adds aria-describedby while open.
 */
export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(
  function TooltipTrigger(
    {
      asChild = false,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      onClick,
      type,
      id,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const tooltip = useTooltipContext("TooltipTrigger");
    const popover = usePopoverContext("TooltipTrigger");
    const refs = useMemo(
      () =>
        composeRefs(
          forwardedRef,
          popover.setTriggerElement,
          tooltip.setTriggerElement,
        ),
      [forwardedRef, popover.setTriggerElement, tooltip.setTriggerElement],
    );

    const handlePointerEnter = (
      event: ReactPointerEvent<HTMLElement>,
    ): void => {
      onPointerEnter?.(event as ReactPointerEvent<HTMLButtonElement>);
      if (event.defaultPrevented) {
        return;
      }
      tooltip.pointerEnter(event.pointerType);
    };

    const handlePointerLeave = (
      event: ReactPointerEvent<HTMLElement>,
    ): void => {
      onPointerLeave?.(event as ReactPointerEvent<HTMLButtonElement>);
      if (event.defaultPrevented) {
        return;
      }
      tooltip.pointerLeave();
    };

    const handleFocus = (event: ReactFocusEvent<HTMLElement>): void => {
      onFocus?.(event as ReactFocusEvent<HTMLButtonElement>);
      if (event.defaultPrevented) {
        return;
      }
      tooltip.focus();
    };

    const handleBlur = (event: ReactFocusEvent<HTMLElement>): void => {
      onBlur?.(event as ReactFocusEvent<HTMLButtonElement>);
      if (event.defaultPrevented) {
        return;
      }
      tooltip.blur();
    };

    const handleClick = (event: ReactMouseEvent<HTMLElement>): void => {
      onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented) {
        return;
      }
      tooltip.click();
    };

    const describedBy =
      [rest["aria-describedby"], tooltip.isOpen ? popover.contentId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    const shared = {
      ...rest,
      id: id ?? popover.triggerId,
      "aria-describedby": describedBy,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
    };

    if (asChild) {
      return (
        <Slot {...shared} ref={refs}>
          {children}
        </Slot>
      );
    }

    return (
      <button {...shared} ref={refs} type={type ?? "button"}>
        {children}
      </button>
    );
  },
);
