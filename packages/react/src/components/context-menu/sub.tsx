"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type {
  AnimationSetting,
  DismissReason,
  PositionerBoundary,
  Strategy,
} from "@zealakit/overlay-core";
import { Slot, composeRefs } from "../slot.js";
import {
  OverlayPresenceContext,
  useOverlayPresence,
} from "../../animation/presence.js";
import { MenuSurface } from "./menu-surface.js";
import {
  ContextMenuSubContext,
  useContextMenuContext,
  useContextMenuSubContext,
  type ContextMenuSubContextValue,
} from "./context.js";
import type {
  ContextMenuAlign,
  ContextMenuDataAttributes,
  ContextMenuCollisionAvoidance,
  ContextMenuSide,
} from "./types.js";

const SUBMENU_CLOSE_DELAY = 100;

export type ContextMenuSubProps = {
  children?: ReactNode;
  defaultOpen?: boolean;
};

/** Uncontrolled submenu state. It inherits direction and layer context. */
export function ContextMenuSub({
  children,
  defaultOpen = false,
}: ContextMenuSubProps) {
  const menu = useContextMenuContext("ContextMenuSub");
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [triggerElement, setTriggerElement] = useState<Element | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const clearClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    clearClose();
    setIsOpen(true);
  }, [clearClose]);

  const close = useCallback(() => {
    clearClose();
    setIsOpen(false);
  }, [clearClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [close, isOpen, open]);

  const scheduleClose = useCallback(() => {
    clearClose();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setIsOpen(false);
    }, SUBMENU_CLOSE_DELAY);
  }, [clearClose]);

  const cancelClose = useCallback(() => {
    clearClose();
  }, [clearClose]);

  useEffect(() => {
    return () => {
      clearClose();
    };
  }, [clearClose]);

  const contextValue = useMemo<ContextMenuSubContextValue>(
    () => ({
      isOpen,
      direction: menu.direction,
      triggerElement,
      setTriggerElement,
      triggerId: `${id}-trigger`,
      contentId: `${id}-content`,
      open,
      close,
      toggle,
      scheduleClose,
      cancelClose,
    }),
    [
      cancelClose,
      close,
      id,
      isOpen,
      menu.direction,
      open,
      scheduleClose,
      toggle,
      triggerElement,
    ],
  );

  return (
    <ContextMenuSubContext.Provider value={contextValue}>
      {children}
    </ContextMenuSubContext.Provider>
  );
}

export type ContextMenuSubTriggerProps = ComponentPropsWithoutRef<"div"> &
  ContextMenuDataAttributes & {
    asChild?: boolean;
    disabled?: boolean;
  };

export const ContextMenuSubTrigger = forwardRef<
  HTMLElement,
  ContextMenuSubTriggerProps
>(function ContextMenuSubTrigger(
  {
    asChild = false,
    disabled = false,
    onPointerEnter,
    onPointerLeave,
    onClick,
    onKeyDown,
    children,
    ...rest
  },
  forwardedRef,
) {
  const sub = useContextMenuSubContext("ContextMenuSubTrigger");
  const refs = useMemo(
    () => composeRefs(forwardedRef, sub.setTriggerElement),
    [forwardedRef, sub.setTriggerElement],
  );

  const handlePointerEnter = (event: ReactPointerEvent<HTMLElement>): void => {
    onPointerEnter?.(event as ReactPointerEvent<HTMLDivElement>);
    if (event.defaultPrevented || disabled) {
      return;
    }
    sub.cancelClose();
    sub.open();
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>): void => {
    onPointerLeave?.(event as ReactPointerEvent<HTMLDivElement>);
    if (event.defaultPrevented || disabled) {
      return;
    }
    sub.scheduleClose();
  };

  const handleClick = (event: ReactMouseEvent<HTMLElement>): void => {
    onClick?.(event as ReactMouseEvent<HTMLDivElement>);
    if (event.defaultPrevented || disabled) {
      return;
    }
    sub.toggle();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    onKeyDown?.(event as ReactKeyboardEvent<HTMLDivElement>);
    if (event.defaultPrevented || disabled) {
      return;
    }
    const openKey = sub.direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const closeKey = sub.direction === "rtl" ? "ArrowRight" : "ArrowLeft";

    if (event.key === openKey) {
      event.preventDefault();
      event.stopPropagation();
      sub.cancelClose();
      sub.open();
      return;
    }
    if (event.key === closeKey && sub.isOpen) {
      event.preventDefault();
      event.stopPropagation();
      sub.close();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      sub.open();
    }
  };

  const shared = {
    ...rest,
    role: "menuitem" as const,
    tabIndex: -1,
    id: rest.id ?? sub.triggerId,
    "aria-haspopup": "menu" as const,
    "aria-expanded": sub.isOpen,
    "aria-controls": sub.isOpen ? sub.contentId : undefined,
    "aria-disabled": disabled ? true : undefined,
    "data-state": sub.isOpen ? "open" : "closed",
    "data-disabled": disabled ? "" : undefined,
    "data-context-menu-subtrigger": "",
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };

  if (asChild) {
    return (
      <Slot {...shared} ref={refs}>
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

export type ContextMenuSubContentProps = ComponentPropsWithoutRef<"div"> & {
  [key: `data-${string}`]: string | number | boolean | undefined;
  side?: ContextMenuSide;
  align?: ContextMenuAlign;
  sideOffset?: number;
  alignOffset?: number;
  collisionBoundary?: PositionerBoundary;
  collisionPadding?: number;
  collisionAvoidance?: ContextMenuCollisionAvoidance;
  positionMethod?: Strategy;
  portal?: boolean | Element | null;
  /** Fade/custom enter and exit animation. Disabled by default; pass true or a config. */
  animation?: AnimationSetting;
};

export const ContextMenuSubContent = forwardRef<
  HTMLDivElement,
  ContextMenuSubContentProps
>(function ContextMenuSubContent(
  {
    side,
    align = "start",
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary,
    collisionPadding = 0,
    collisionAvoidance,
    positionMethod,
    portal = true,
    animation,
    ...rest
  },
  forwardedRef,
) {
  const sub = useContextMenuSubContext("ContextMenuSubContent");
  const resolvedSide = side ?? (sub.direction === "rtl" ? "left" : "right");
  const placement = (
    align === "center" ? resolvedSide : `${resolvedSide}-${align}`
  ) as `${ContextMenuSide}-${ContextMenuAlign}`;

  const handleDismiss = useCallback(
    (_reason: DismissReason) => {
      sub.close();
    },
    [sub],
  );

  const handleSubmenuKeyDown = (
    event: ReactKeyboardEvent<HTMLElement>,
  ): boolean => {
    const closeKey = sub.direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key !== closeKey) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    sub.close();
    if (sub.triggerElement instanceof HTMLElement) {
      sub.triggerElement.focus();
    }
    return true;
  };

  const presence = useOverlayPresence(sub.isOpen, animation);
  if (!presence.present) {
    return null;
  }

  return (
    <OverlayPresenceContext.Provider value={presence}>
      <MenuSurface
        {...rest}
        ref={forwardedRef}
        reference={sub.triggerElement}
        boundaryReference={sub.triggerElement}
        focusRestoreTarget={sub.triggerElement}
        menuId={sub.contentId}
        labelledBy={sub.triggerId}
        placement={placement}
        offset={sideOffset}
        alignOffset={alignOffset}
        padding={collisionPadding}
        boundary={collisionBoundary}
        strategy={positionMethod}
        flip={collisionAvoidance?.flip ?? true}
        shift={collisionAvoidance?.shift ?? true}
        portal={portal}
        dir={sub.direction}
        submenu
        open={sub.isOpen}
        onDismiss={handleDismiss}
        onSubmenuKeyDown={handleSubmenuKeyDown}
        onPointerEnterSurface={() => {
          sub.cancelClose();
        }}
        onPointerLeaveSurface={() => {
          sub.scheduleClose();
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
    </OverlayPresenceContext.Provider>
  );
});
