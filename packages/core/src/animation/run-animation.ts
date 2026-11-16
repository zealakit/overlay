import {
  isCustomClasses,
  resolveAnimationDirection,
  type AnimationContext,
  type CustomAnimationKeyframes,
  type CustomKeyframes,
  type ResolvedAnimationConfig,
} from "../types/animation.js";
import {
  createExpandKeyframes,
  createFadeKeyframes,
  FADE_MOVE_DISTANCE,
  getTransformOrigin,
  resolveExpandPlan,
  splitPlacement,
  type AnimationPhase,
} from "./keyframes.js";

export type RunOverlayAnimationOptions = {
  phase: AnimationPhase;
  config: ResolvedAnimationConfig;
  /** Final (collision-adjusted) placement; used for the "auto" direction. */
  placement?: string;
  /** Removes movement and keeps only the opacity change. */
  reducedMotion?: boolean;
};

export type OverlayAnimationHandle = {
  /** Resolves when the animation completes; never resolves once cancelled. */
  finished: Promise<void>;
  cancel(): void;
};

/** Lazily read the user's reduced-motion preference (SSR-safe). */
export function prefersReducedMotion(
  win: Window | null | undefined = typeof window === "undefined"
    ? undefined
    : window,
): boolean {
  if (!win || typeof win.matchMedia !== "function") {
    return false;
  }
  return win.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const IMMEDIATE: OverlayAnimationHandle = {
  finished: Promise.resolve(),
  cancel() {},
};

const ORIGIN_VARIABLE = "--overlay-transform-origin";

function isRtl(element: HTMLElement): boolean {
  const view = element.ownerDocument?.defaultView;
  return (
    element.dir === "rtl" ||
    (view ? view.getComputedStyle(element).direction === "rtl" : false)
  );
}

/**
 * Run an enter/exit animation on an element: the built-in `fade` or `expand`
 * (Web Animations API), consumer keyframes, or consumer CSS classes.
 * Positioning uses left/top; these use opacity/translate/scale or CSS
 * animation, so they never compete with positioning coordinates.
 *
 * While it runs, `--overlay-transform-origin` points at the anchor so custom
 * CSS can grow from the right edge too.
 */
export function runOverlayAnimation(
  element: HTMLElement,
  {
    phase,
    config,
    placement,
    reducedMotion = false,
  }: RunOverlayAnimationOptions,
): OverlayAnimationHandle {
  if (!config.enabled) {
    return IMMEDIATE;
  }

  let cancelled = false;
  let frame: number | null = null;
  let webAnimation: Animation | null = null;
  let customClass: string | null = null;
  let originSet = false;
  let previousOrigin = "";

  const rtl = isRtl(element);
  const split = splitPlacement(placement);
  const autoOrigin = getTransformOrigin(split.side, split.align, rtl);

  const setOrigin = (value: string): void => {
    previousOrigin = element.style.getPropertyValue(ORIGIN_VARIABLE);
    element.style.setProperty(ORIGIN_VARIABLE, value);
    originSet = true;
  };

  const cleanup = (): void => {
    if (frame !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(frame);
    }
    frame = null;
    webAnimation?.cancel();
    webAnimation = null;
    if (customClass) {
      element.classList.remove(customClass);
      customClass = null;
    }
    if (originSet) {
      if (previousOrigin) {
        element.style.setProperty(ORIGIN_VARIABLE, previousOrigin);
      } else {
        element.style.removeProperty(ORIGIN_VARIABLE);
      }
      originSet = false;
    }
  };

  const handle = (finished: Promise<void>): OverlayAnimationHandle => ({
    finished,
    cancel() {
      cancelled = true;
      cleanup();
    },
  });

  const custom = config.type === "custom" ? config.custom : null;

  if (custom && isCustomClasses(custom)) {
    const className = phase === "enter" ? custom.enter : custom.exit;
    setOrigin(autoOrigin);
    return handle(
      new Promise<void>((resolve) => {
        customClass = className;
        element.classList.add(className);
        const settle = (): void => {
          if (cancelled) {
            return;
          }
          // Remove the class after an enter animation; an exit keeps nothing
          // visible because the caller hides the element right afterwards.
          if (phase === "enter") {
            element.classList.remove(className);
            customClass = null;
          }
          resolve();
        };
        const wait = (): void => {
          if (cancelled) {
            return;
          }
          const animations =
            typeof element.getAnimations === "function"
              ? element.getAnimations()
              : [];
          if (animations.length === 0) {
            // Missing/empty custom CSS must not leave a popup mounted forever.
            settle();
            return;
          }
          Promise.all(animations.map((item) => item.finished))
            .then(settle)
            .catch(() => {
              // Cancelled or replaced animations must not complete a newer phase.
            });
        };
        if (typeof requestAnimationFrame === "function") {
          frame = requestAnimationFrame(wait);
        } else {
          wait();
        }
      }),
    );
  }

  if (typeof element.animate !== "function") {
    // DOM test environments and legacy browsers may not implement WAAPI.
    return IMMEDIATE;
  }

  let keyframes: Keyframe[];
  if (custom) {
    const context: AnimationContext = {
      phase,
      placement,
      side: split.side,
      align: split.align,
      transformOrigin: autoOrigin,
    };
    const resolve = (value: CustomKeyframes): Keyframe[] =>
      typeof value === "function" ? value(context) : value;
    const frames = custom as CustomAnimationKeyframes;
    keyframes =
      phase === "enter"
        ? resolve(frames.enter)
        : frames.exit
          ? resolve(frames.exit)
          : [...resolve(frames.enter)].reverse();
    setOrigin(autoOrigin);
  } else if (config.type === "expand") {
    const plan = resolveExpandPlan({
      placement,
      direction: config.direction,
      rtl,
    });
    keyframes = createExpandKeyframes(phase, plan, reducedMotion);
    setOrigin(plan.transformOrigin);
  } else {
    keyframes = createFadeKeyframes(
      phase,
      resolveAnimationDirection(config.direction, placement),
      reducedMotion ? 0 : FADE_MOVE_DISTANCE,
    );
  }

  const animation = element.animate(keyframes, {
    duration: config.duration,
    delay: config.delay,
    easing: config.easing,
    fill: "both",
  });
  webAnimation = animation;
  return handle(
    new Promise<void>((resolve) => {
      animation.finished
        .then(() => {
          if (!cancelled) {
            resolve();
          }
        })
        .catch(() => {
          // Cancellation from a newer phase is expected.
        });
    }),
  );
}
