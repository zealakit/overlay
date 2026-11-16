"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isEscapeKey } from "@zealakit/overlay-core";
import { Popover } from "../popover/popover.js";
import {
  TooltipContext,
  type TooltipChangeReason,
  type TooltipContextValue,
  type TooltipDirection,
} from "./context.js";
import {
  TOOLTIP_DEFAULT_CLOSE_DELAY,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_SKIP_DELAY,
  useTooltipTiming,
} from "./provider.js";

export type TooltipProps = {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: TooltipChangeReason) => void;
  disabled?: boolean;
  /** Hover opening delay override. */
  delay?: number;
  /** Close delay override. */
  closeDelay?: number;
  /** Override the provider's hoverable-content setting. */
  disableHoverableContent?: boolean;
  /** Direction used for start/end alignment. Defaults to ltr. */
  dir?: TooltipDirection;
};

/**
 * Non-modal, informational Tooltip root.
 *
 * Owns timing, hover/focus intent, and tooltip-specific Escape/outside
 * handling. It does not register a blocking layer, trap focus, or assign
 * Dialog/Popover semantics.
 */
export function Tooltip({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  delay,
  closeDelay,
  disableHoverableContent,
  dir = "ltr",
}: TooltipProps) {
  const providedTiming = useTooltipTiming();
  const localSkipUntilRef = useRef(0);
  const localTiming = useMemo(
    () => ({
      delay: TOOLTIP_DEFAULT_DELAY,
      closeDelay: TOOLTIP_DEFAULT_CLOSE_DELAY,
      disableHoverableContent: false,
      getOpenDelay: (nextDelay: number) =>
        Date.now() < localSkipUntilRef.current ? 0 : nextDelay,
      markOpened: () => {
        localSkipUntilRef.current = Date.now() + TOOLTIP_DEFAULT_SKIP_DELAY;
      },
    }),
    [],
  );
  const timing = providedTiming ?? localTiming;
  const hoverDelay = delay ?? timing.delay;
  const hoverCloseDelay = closeDelay ?? timing.closeDelay;
  const hoverableContent = !(
    disableHoverableContent ?? timing.disableHoverableContent
  );

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const openState = isControlled ? controlledOpen : uncontrolledOpen;
  const effectiveOpen = openState && !disabled;
  const openRef = useRef(openState);
  openRef.current = openState;

  const onOpenChangeRef = useRef(onOpenChange);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerOverRef = useRef(false);
  const focusedRef = useRef(false);
  const contentHoveredRef = useRef(false);

  const [triggerElement, setTriggerElement] = useState<Element | null>(null);
  const [contentElement, setContentElement] = useState<Element | null>(null);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
  }, [clearCloseTimer, clearOpenTimer]);

  const setOpenState = useCallback(
    (next: boolean, reason: TooltipChangeReason) => {
      if (openRef.current === next) {
        return;
      }
      if (!isControlled) {
        setUncontrolledOpen(next);
        openRef.current = next;
      }
      onOpenChangeRef.current?.(next, reason);
    },
    [isControlled],
  );

  const closeNow = useCallback(
    (reason: TooltipChangeReason) => {
      clearTimers();
      contentHoveredRef.current = false;
      if (!openRef.current) {
        return;
      }
      setOpenState(false, reason);
    },
    [clearTimers, setOpenState],
  );

  const openNow = useCallback(
    (reason: TooltipChangeReason) => {
      clearTimers();
      if (disabled || openRef.current) {
        return;
      }
      timing.markOpened();
      setOpenState(true, reason);
    },
    [clearTimers, disabled, setOpenState, timing],
  );

  const scheduleOpen = useCallback(
    (reason: TooltipChangeReason) => {
      clearOpenTimer();
      clearCloseTimer();
      if (disabled || openRef.current) {
        return;
      }
      const wait = timing.getOpenDelay(hoverDelay);
      if (wait <= 0) {
        openNow(reason);
        return;
      }
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        openNow(reason);
      }, wait);
    },
    [clearCloseTimer, clearOpenTimer, disabled, hoverDelay, openNow, timing],
  );

  const scheduleClose = useCallback(
    (reason: TooltipChangeReason) => {
      clearOpenTimer();
      if (disabled || !openRef.current) {
        return;
      }
      if (hoverCloseDelay <= 0) {
        closeNow(reason);
        return;
      }
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        closeNow(reason);
      }, hoverCloseDelay);
    },
    [clearOpenTimer, closeNow, disabled, hoverCloseDelay],
  );

  const cancelClose = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const maybeClose = useCallback(
    (reason: TooltipChangeReason) => {
      if (
        pointerOverRef.current ||
        focusedRef.current ||
        (hoverableContent && contentHoveredRef.current)
      ) {
        return;
      }
      scheduleClose(reason);
    },
    [hoverableContent, scheduleClose],
  );

  const pointerEnter = useCallback(
    (pointerType: string) => {
      if (disabled || pointerType === "touch") {
        return;
      }
      pointerOverRef.current = true;
      scheduleOpen("hover");
    },
    [disabled, scheduleOpen],
  );

  const pointerLeave = useCallback(() => {
    pointerOverRef.current = false;
    maybeClose("hover");
  }, [maybeClose]);

  const focus = useCallback(() => {
    focusedRef.current = true;
    if (disabled) {
      return;
    }
    openNow("focus");
  }, [disabled, openNow]);

  const blur = useCallback(() => {
    focusedRef.current = false;
    maybeClose("focus");
  }, [maybeClose]);

  const contentEnter = useCallback(() => {
    if (!hoverableContent) {
      return;
    }
    contentHoveredRef.current = true;
    cancelClose();
  }, [cancelClose, hoverableContent]);

  const contentLeave = useCallback(() => {
    contentHoveredRef.current = false;
    maybeClose("hover");
  }, [maybeClose]);

  const click = useCallback(() => {
    if (openRef.current) {
      closeNow("trigger");
    }
  }, [closeNow]);

  const dismiss = useCallback(
    (reason: TooltipChangeReason) => {
      closeNow(reason);
    },
    [closeNow],
  );

  useEffect(() => {
    if (!effectiveOpen) {
      clearTimers();
      contentHoveredRef.current = false;
      return;
    }
    timing.markOpened();
  }, [clearTimers, effectiveOpen, timing]);

  useEffect(() => {
    if (!disabled) {
      return;
    }
    clearTimers();
    pointerOverRef.current = false;
    contentHoveredRef.current = false;
    if (openRef.current) {
      closeNow("programmatic");
    }
  }, [clearTimers, closeNow, disabled]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!effectiveOpen) {
      return;
    }
    const documentRef =
      triggerElement?.ownerDocument ??
      contentElement?.ownerDocument ??
      (typeof document !== "undefined" ? document : null);
    if (!documentRef) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || !isEscapeKey(event)) {
        return;
      }
      event.preventDefault();
      closeNow("escape");
    };

    const handlePointerDown = (event: PointerEvent): void => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (
        triggerElement?.contains(target) ||
        contentElement?.contains(target)
      ) {
        return;
      }
      closeNow("outside-press");
    };

    documentRef.addEventListener("keydown", handleKeyDown, true);
    documentRef.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      documentRef.removeEventListener("keydown", handleKeyDown, true);
      documentRef.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [closeNow, contentElement, effectiveOpen, triggerElement]);

  const context = useMemo<TooltipContextValue>(
    () => ({
      isOpen: effectiveOpen,
      disabled,
      direction: dir,
      hoverableContent,
      triggerElement,
      contentElement,
      setTriggerElement,
      setContentElement,
      pointerEnter,
      pointerLeave,
      focus,
      blur,
      contentEnter,
      contentLeave,
      click,
      dismiss,
    }),
    [
      blur,
      click,
      contentElement,
      contentEnter,
      contentLeave,
      dir,
      disabled,
      dismiss,
      effectiveOpen,
      focus,
      hoverableContent,
      pointerEnter,
      pointerLeave,
      triggerElement,
    ],
  );

  return (
    <TooltipContext.Provider value={context}>
      <Popover
        open={effectiveOpen}
        dir={dir}
        dismissOnEscape={false}
        dismissOnOutsidePress={false}
      >
        {children}
      </Popover>
    </TooltipContext.Provider>
  );
}
