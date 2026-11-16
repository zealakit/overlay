"use client";

import {
  forwardRef,
  useMemo,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
  type MouseEventHandler,
} from "react";
import { useDialogContext } from "./context.js";
import { Slot, composeRefs } from "../slot.js";
import type { DialogDataAttributes } from "./content.js";

export type DialogTriggerProps = ComponentPropsWithoutRef<"button"> &
  DialogDataAttributes & {
    /** Merge trigger behavior onto the single child element instead of wrapping it. */
    asChild?: boolean;
  };

/** Button that toggles the Dialog and supplies dialog trigger ARIA. */
export const DialogTrigger = forwardRef<HTMLElement, DialogTriggerProps>(
  function DialogTrigger(
    { asChild = false, disabled = false, onClick, type, id, children, ...rest },
    forwardedRef,
  ) {
    const dialog = useDialogContext("DialogTrigger");
    const refs = useMemo(
      () => composeRefs(forwardedRef, dialog.setTriggerElement),
      [dialog.setTriggerElement, forwardedRef],
    );

    const handleClick: MouseEventHandler<HTMLElement> = (event) => {
      onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented || disabled) {
        return;
      }
      dialog.toggle("trigger");
    };

    const shared = {
      ...rest,
      id: id ?? dialog.triggerId,
      "aria-haspopup": "dialog" as const,
      "aria-expanded": dialog.isOpen,
      "aria-controls": dialog.isOpen ? dialog.contentId : undefined,
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
