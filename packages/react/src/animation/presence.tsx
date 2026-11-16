"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
} from "react";
import {
  normalizeAnimationConfig,
  resolveAnimationDirection,
  type AnimationSetting,
  type ResolvedAnimationConfig,
} from "@zealakit/overlay-core";

export type OverlayPresentationPhase = "idle" | "enter" | "exit";

export type OverlayPresence = {
  present: boolean;
  phase: OverlayPresentationPhase;
  animation: ResolvedAnimationConfig;
  finishExit(): void;
};

export type OverlayPresenceContextValue = OverlayPresence;

/** Internal context shared by convenience Content trees and advanced parts. */
export const OverlayPresenceContext =
  createContext<OverlayPresenceContextValue | null>(null);

export function useOverlayPresenceContext(): OverlayPresenceContextValue | null {
  return useContext(OverlayPresenceContext);
}

/**
 * Hold a popup in the DOM while its exit animation runs. The element animation
 * is owned by useOverlayElementAnimation; this hook only owns open/exit state.
 */
export function useOverlayPresence(
  open: boolean,
  setting: AnimationSetting | undefined,
): OverlayPresence {
  const animation = useMemo(
    () => normalizeAnimationConfig(setting),
    [setting],
  );
  const [present, setPresent] = useState(open);
  const [phase, setPhase] = useState<OverlayPresentationPhase>(
    open && animation.enabled ? "enter" : "idle",
  );
  const openRef = useRef(open);
  openRef.current = open;

  // Derived state: opening must render the popup in the same pass so refs and
  // the enter animation have an element to work with.
  if (open && !present) {
    setPresent(true);
  }

  useEffect(() => {
    if (open) {
      setPhase(animation.enabled ? "enter" : "idle");
      return;
    }
    if (!present) {
      return;
    }
    if (!animation.enabled) {
      setPresent(false);
      setPhase("idle");
      return;
    }
    setPhase("exit");
  }, [animation.enabled, open, present]);

  const finishExit = useCallback(() => {
    if (openRef.current) {
      return;
    }
    setPresent(false);
    setPhase("idle");
  }, []);

  return { present, phase, animation, finishExit };
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  return reduced;
}

type ElementAnimationOptions = {
  element: HTMLElement | null;
  phase: OverlayPresentationPhase;
  animation: ResolvedAnimationConfig;
  placement?: string;
  onExitComplete: () => void;
};

const MOVE_DISTANCE = 4;

function enterOffset(
  direction: ReturnType<typeof resolveAnimationDirection>,
  distance: number,
): { x: number; y: number } {
  switch (direction) {
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
    case "up":
    default:
      return { x: 0, y: distance };
  }
}

/**
 * Execute built-in WAAPI fade or consumer CSS classes on the floating element.
 * Positioning uses left/top; this hook uses opacity/translate or CSS animation,
 * so it never competes with positioning coordinates.
 */
export function useOverlayElementAnimation({
  element,
  phase,
  animation,
  placement,
  onExitComplete,
}: ElementAnimationOptions): void {
  const reducedMotion = useReducedMotion();
  const finishRef = useRef(onExitComplete);
  finishRef.current = onExitComplete;
  const tokenRef = useRef(0);

  useEffect(() => {
    if (!element || phase === "idle" || !animation.enabled) {
      return;
    }

    const token = ++tokenRef.current;
    let cancelled = false;
    let frame: number | null = null;
    let webAnimation: Animation | null = null;
    let customClass: string | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = (): void => {
      if (cancelled || token !== tokenRef.current) {
        return;
      }
      if (phase === "exit") {
        finishRef.current();
        return;
      }
      webAnimation?.cancel();
      if (customClass) {
        element.classList.remove(customClass);
        customClass = null;
      }
    };

    const cleanup = (): void => {
      cancelled = true;
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
      }
      webAnimation?.cancel();
      if (customClass) {
        element.classList.remove(customClass);
      }
    };

    if (animation.type === "custom" && animation.custom) {
      customClass =
        phase === "enter" ? animation.custom.enter : animation.custom.exit;
      element.classList.add(customClass);

      const waitForAnimations = (): void => {
        if (cancelled) {
          return;
        }
        const animations =
          typeof element.getAnimations === "function"
            ? element.getAnimations()
            : [];
        if (animations.length === 0) {
          // Missing/empty custom CSS must not leave a popup permanently mounted.
          finish();
          return;
        }
        Promise.all(animations.map((item) => item.finished))
          .then(finish)
          .catch(() => {
            // A cancelled/replaced animation must not complete a newer phase.
          });
      };

      frame = requestAnimationFrame(waitForAnimations);
      return cleanup;
    }

    if (typeof element.animate !== "function") {
      // DOM test environments and legacy browsers may not implement WAAPI.
      finish();
      return cleanup;
    }

    const direction = resolveAnimationDirection(animation.direction, placement);
    const distance = reducedMotion ? 0 : MOVE_DISTANCE;
    const offset = enterOffset(direction, distance);
    const translate = `${offset.x}px ${offset.y}px`;
    const keyframes =
      phase === "enter"
        ? [
            { opacity: 0, translate },
            { opacity: 1, translate: "0px 0px" },
          ]
        : [
            { opacity: 1, translate: "0px 0px" },
            { opacity: 0, translate },
          ];

    webAnimation = element.animate(keyframes, {
      duration: animation.duration,
      delay: animation.delay,
      easing: animation.easing,
      fill: "both",
    });
    webAnimation.finished.then(finish).catch(() => {
      // Cancellation from a newer phase is expected.
    });
    return cleanup;
  }, [
    animation.custom?.enter,
    animation.custom?.exit,
    animation.delay,
    animation.direction,
    animation.duration,
    animation.easing,
    animation.enabled,
    animation.type,
    element,
    phase,
    placement,
    reducedMotion,
  ]);
}

export function useAnimatedRef(
  setElement: (element: HTMLElement | null) => void,
): RefCallback<HTMLElement> {
  return useCallback(
    (element: HTMLElement | null) => setElement(element),
    [setElement],
  );
}
