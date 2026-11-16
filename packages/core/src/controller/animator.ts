import {
  prefersReducedMotion,
  runOverlayAnimation,
  type OverlayAnimationHandle,
} from "../animation/index.js";
import {
  normalizeAnimationConfig,
  type AnimationSetting,
  type ResolvedAnimationConfig,
} from "../types/animation.js";
import type { ControllerHost } from "./host.js";

export type OverlayAnimator = {
  readonly enabled: boolean;
  /** True when the next positioned result should start the enter animation. */
  pendingEnter: boolean;
  setConfig(setting: AnimationSetting | undefined): void;
  playEnter(placement?: string): void;
  cancelEnter(): void;
  /** Finish a running exit immediately. */
  settleExit(): void;
  startExit(placement: string | undefined): void;
};

/**
 * Enter/exit animation of the content (and fade of the backdrop).
 *
 * `onExitFinished` runs once the exit completes or is settled early.
 */
export function createOverlayAnimator(
  host: ControllerHost,
  initialSetting: AnimationSetting | undefined,
  isDestroyed: () => boolean,
  onExitFinished: () => void,
): OverlayAnimator {
  let config: ResolvedAnimationConfig =
    normalizeAnimationConfig(initialSetting);
  let enterHandles: OverlayAnimationHandle[] = [];
  let finalizeExit: (() => void) | null = null;

  const backdropConfig = (): ResolvedAnimationConfig => ({
    ...config,
    type: "fade",
    custom: null,
  });

  const animator: OverlayAnimator = {
    get enabled() {
      return config.enabled;
    },
    pendingEnter: false,
    setConfig(setting) {
      config = normalizeAnimationConfig(setting);
    },
    cancelEnter() {
      animator.pendingEnter = false;
      for (const handle of enterHandles) {
        handle.cancel();
      }
      enterHandles = [];
      delete host.getOptions().content.dataset.animating;
    },
    playEnter(placement) {
      animator.pendingEnter = false;
      if (isDestroyed() || !config.enabled) {
        return;
      }
      animator.cancelEnter();
      const reducedMotion = prefersReducedMotion(host.doc.defaultView);
      const { content, backdrop } = host.getOptions();
      content.dataset.animating = "enter";
      const handles = [
        runOverlayAnimation(content, {
          phase: "enter",
          config,
          placement,
          reducedMotion,
        }),
      ];
      if (backdrop) {
        // The backdrop only fades; it never travels with the panel.
        handles.push(
          runOverlayAnimation(backdrop, {
            phase: "enter",
            config: backdropConfig(),
            reducedMotion: true,
          }),
        );
      }
      enterHandles = handles;
      void Promise.all(handles.map((handle) => handle.finished)).then(() => {
        if (enterHandles === handles) {
          enterHandles = [];
          delete content.dataset.animating;
        }
      });
    },
    settleExit() {
      const finalize = finalizeExit;
      finalizeExit = null;
      finalize?.();
    },
    startExit(placement) {
      const { content, backdrop } = host.getOptions();
      const reducedMotion = prefersReducedMotion(host.doc.defaultView);
      content.dataset.state = "closed";
      content.dataset.closed = "";
      delete content.dataset.open;
      content.dataset.animating = "exit";
      if (backdrop) {
        backdrop.dataset.state = "closed";
      }
      const handles = [
        runOverlayAnimation(content, {
          phase: "exit",
          config,
          placement,
          reducedMotion,
        }),
      ];
      if (backdrop) {
        handles.push(
          runOverlayAnimation(backdrop, {
            phase: "exit",
            config: backdropConfig(),
            reducedMotion: true,
          }),
        );
      }
      let done = false;
      const finalize = (): void => {
        if (done) {
          return;
        }
        done = true;
        for (const handle of handles) {
          handle.cancel();
        }
        finalizeExit = null;
        onExitFinished();
      };
      finalizeExit = finalize;
      void Promise.all(handles.map((handle) => handle.finished)).then(() => {
        if (finalizeExit === finalize) {
          finalize();
        }
      });
    },
  };

  return animator;
}
