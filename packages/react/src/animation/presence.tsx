"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  normalizeAnimationConfig,
  runOverlayAnimation,
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
  const animation = useMemo(() => normalizeAnimationConfig(setting), [setting]);
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

/**
 * Drive the core animation runner for the floating element. Positioning uses
 * left/top; the runner uses opacity/translate or CSS animation, so the two
 * never compete.
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

  // Primitive dependencies on purpose: inline `animation` objects change identity
  // every render and must not restart a running animation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    if (!element || phase === "idle" || !animation.enabled) {
      return;
    }
    const handle = runOverlayAnimation(element, {
      phase,
      config: animation,
      placement,
      reducedMotion,
    });
    if (phase === "exit") {
      void handle.finished.then(() => finishRef.current());
    }
    return () => handle.cancel();
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
