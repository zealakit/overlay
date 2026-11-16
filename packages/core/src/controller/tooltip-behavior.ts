import type { ControllerHost } from "./host.js";

export type TooltipBehavior = {
  attach(): void;
  detach(): void;
  /** Cancel pending timers and forget hover state (called on every close). */
  reset(): void;
};

/** Hover/focus open-close timing for tooltips. */
export function createTooltipBehavior(host: ControllerHost): TooltipBehavior {
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let pointerOver = false;
  let focused = false;
  let contentHovered = false;

  const isTooltip = (): boolean => host.getOptions().kind === "tooltip";

  const clearTimers = (): void => {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const scheduleClose = (): void => {
    if (!isTooltip() || !host.isOpen()) {
      return;
    }
    clearTimers();
    const options = host.getOptions();
    const wait = options.closeDelay ?? 100;
    if (wait <= 0) {
      host.requestClose("programmatic");
      return;
    }
    closeTimer = setTimeout(() => {
      closeTimer = null;
      const current = host.getOptions();
      if (
        !pointerOver &&
        !focused &&
        (!(current.hoverableContent ?? true) || !contentHovered)
      ) {
        host.requestClose("programmatic");
      }
    }, wait);
  };

  const onPointerEnter = (event: PointerEvent): void => {
    if (!isTooltip() || host.isDisabled() || event.pointerType === "touch") {
      return;
    }
    pointerOver = true;
    clearTimers();
    const wait = host.getOptions().delay ?? 500;
    if (wait <= 0) {
      host.requestOpen("trigger");
      return;
    }
    openTimer = setTimeout(() => {
      openTimer = null;
      host.requestOpen("trigger");
    }, wait);
  };

  const onPointerLeave = (): void => {
    if (!isTooltip()) {
      return;
    }
    pointerOver = false;
    scheduleClose();
  };

  const onFocus = (): void => {
    if (!isTooltip() || host.isDisabled()) {
      return;
    }
    focused = true;
    clearTimers();
    host.requestOpen("trigger");
  };

  const onBlur = (): void => {
    if (!isTooltip()) {
      return;
    }
    focused = false;
    scheduleClose();
  };

  const onContentPointerEnter = (): void => {
    if (!isTooltip() || !(host.getOptions().hoverableContent ?? true)) {
      return;
    }
    contentHovered = true;
    clearTimers();
  };

  const onContentPointerLeave = (): void => {
    if (!isTooltip()) {
      return;
    }
    contentHovered = false;
    scheduleClose();
  };

  // Listeners are bound to the elements present when attach() runs.
  let bound: { trigger: HTMLElement; content: HTMLElement } | null = null;

  return {
    attach() {
      const { trigger, content } = host.getOptions();
      bound = { trigger, content };
      trigger.addEventListener("pointerenter", onPointerEnter);
      trigger.addEventListener("pointerleave", onPointerLeave);
      trigger.addEventListener("focus", onFocus);
      trigger.addEventListener("blur", onBlur);
      content.addEventListener("pointerenter", onContentPointerEnter);
      content.addEventListener("pointerleave", onContentPointerLeave);
    },
    detach() {
      if (!bound) {
        return;
      }
      const { trigger, content } = bound;
      bound = null;
      trigger.removeEventListener("pointerenter", onPointerEnter);
      trigger.removeEventListener("pointerleave", onPointerLeave);
      trigger.removeEventListener("focus", onFocus);
      trigger.removeEventListener("blur", onBlur);
      content.removeEventListener("pointerenter", onContentPointerEnter);
      content.removeEventListener("pointerleave", onContentPointerLeave);
    },
    reset() {
      clearTimers();
      contentHovered = false;
    },
  };
}
