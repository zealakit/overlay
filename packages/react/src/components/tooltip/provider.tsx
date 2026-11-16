"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export const TOOLTIP_DEFAULT_DELAY = 500;
export const TOOLTIP_DEFAULT_CLOSE_DELAY = 100;
export const TOOLTIP_DEFAULT_SKIP_DELAY = 300;

export type TooltipTiming = {
  delay: number;
  closeDelay: number;
  disableHoverableContent: boolean;
  getOpenDelay(delay: number): number;
  markOpened(): void;
};

export const TooltipTimingContext = createContext<TooltipTiming | null>(null);

export type TooltipProviderProps = {
  children?: ReactNode;
  /** Hover opening delay in milliseconds. Defaults to 500. */
  delay?: number;
  /** Delay before closing after pointer/focus leaves. Defaults to 100. */
  closeDelay?: number;
  /** Window after an open Tooltip where the next Tooltip skips the opening delay. */
  skipDelayDuration?: number;
  /** Disable hoverable content for descendant Tooltips. */
  disableHoverableContent?: boolean;
};

/**
 * Optional provider for shared Tooltip timing. Timing state is scoped to this
 * provider; there is no application-wide singleton.
 */
export function TooltipProvider({
  children,
  delay = TOOLTIP_DEFAULT_DELAY,
  closeDelay = TOOLTIP_DEFAULT_CLOSE_DELAY,
  skipDelayDuration = TOOLTIP_DEFAULT_SKIP_DELAY,
  disableHoverableContent = false,
}: TooltipProviderProps) {
  const skipUntilRef = useRef(0);

  const value = useMemo<TooltipTiming>(
    () => ({
      delay,
      closeDelay,
      disableHoverableContent,
      getOpenDelay(nextDelay) {
        return Date.now() < skipUntilRef.current ? 0 : nextDelay;
      },
      markOpened() {
        skipUntilRef.current = Date.now() + skipDelayDuration;
      },
    }),
    [closeDelay, delay, disableHoverableContent, skipDelayDuration],
  );

  return (
    <TooltipTimingContext.Provider value={value}>
      {children}
    </TooltipTimingContext.Provider>
  );
}

export function useTooltipTiming(): TooltipTiming | null {
  return useContext(TooltipTimingContext);
}
