"use client";

import {
  forwardRef,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Slot, composeRefs } from "../slot.js";
import { useContextMenuContext } from "./context.js";
import type { ContextMenuDataAttributes } from "./types.js";

export type ContextMenuTriggerProps = ComponentPropsWithoutRef<"div"> &
  ContextMenuDataAttributes & {
    asChild?: boolean;
    /** Disable this trigger without disabling other ContextMenu triggers. */
    disabled?: boolean;
  };

const KEYBOARD_CONTEXT_MENU_WINDOW = 500;

/**
 * Right-click/keyboard context-menu target. It intentionally renders a
 * focusable generic element by default rather than a button: a ContextMenu is
 * not a click-triggered menu. Consumers can supply role/label or use asChild.
 */
export const ContextMenuTrigger = forwardRef<
  HTMLElement,
  ContextMenuTriggerProps
>(function ContextMenuTrigger(
  {
    asChild = false,
    disabled = false,
    onContextMenu,
    onKeyDown,
    tabIndex,
    children,
    ...rest
  },
  forwardedRef,
) {
  const menu = useContextMenuContext("ContextMenuTrigger");
  const keyboardInvocationRef = useRef(0);
  const refs = useMemo(
    () => composeRefs(forwardedRef, menu.setTriggerElement),
    [forwardedRef, menu.setTriggerElement],
  );

  const handleContextMenu = (event: ReactMouseEvent<HTMLElement>): void => {
    if (
      event.button === 0 &&
      keyboardInvocationRef.current > 0 &&
      Date.now() - keyboardInvocationRef.current < KEYBOARD_CONTEXT_MENU_WINDOW
    ) {
      keyboardInvocationRef.current = 0;
      event.preventDefault();
      return;
    }
    onContextMenu?.(event as ReactMouseEvent<HTMLDivElement>);
    if (event.defaultPrevented || disabled || menu.disabled) {
      return;
    }
    event.preventDefault();
    keyboardInvocationRef.current = 0;
    menu.openAt({ x: event.clientX, y: event.clientY }, "trigger");
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    onKeyDown?.(event as ReactKeyboardEvent<HTMLDivElement>);
    if (event.defaultPrevented || disabled || menu.disabled) {
      return;
    }
    const isContextMenuKey = event.key === "ContextMenu";
    const isShiftF10 = event.shiftKey && event.key === "F10";
    if (!isContextMenuKey && !isShiftF10) {
      return;
    }
    event.preventDefault();
    keyboardInvocationRef.current = Date.now();
    menu.openAt(null, "trigger");
  };

  const shared = {
    ...rest,
    id: rest.id ?? menu.triggerId,
    tabIndex: tabIndex ?? 0,
    "aria-haspopup": "menu" as const,
    "aria-expanded": menu.isOpen,
    "aria-controls": menu.isOpen ? menu.contentId : undefined,
    "data-state": menu.isOpen ? "open" : "closed",
    "data-context-menu-trigger": "",
    onContextMenu: handleContextMenu,
    onKeyDown: handleKeyDown,
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
    <div {...shared} ref={refs}>
      {children}
    </div>
  );
});
