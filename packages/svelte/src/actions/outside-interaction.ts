import type { Action } from "svelte/action";
import {
  isOutsidePress,
  isPrimaryPointer,
  listen,
} from "@zealakit/overlay-core";

export type OutsideInteractionActionParams = {
  handler: (event: Event) => void;
  /** Additional elements that count as "inside"; the action node is always inside. */
  elements?: readonly (Element | null | undefined)[];
  /** Trigger element that should not count as outside. */
  reference?: Element | null;
  enabled?: boolean;
  /** Event type(s) attached to the document. Defaults to `pointerdown`. */
  eventType?: string | readonly string[];
  /** Target for the listener. Defaults to the global document. */
  target?: Document | HTMLElement | null;
  capture?: boolean;
};

function isPrimary(event: Event): boolean {
  if (event.type.startsWith("pointer")) {
    return isPrimaryPointer(event as PointerEvent);
  }
  if (event.type === "mousedown" || event.type === "click") {
    return (event as MouseEvent).button === 0;
  }
  return true;
}

function eventTypesOf(
  value: OutsideInteractionActionParams["eventType"],
): string[] {
  if (!value) {
    return ["pointerdown"];
  }
  return [...new Set(typeof value === "string" ? [value] : value)];
}

/**
 * `use:outsideInteraction` — call `handler` when a primary press happens
 * outside the node and its configured elements/reference.
 *
 * Layer actions already route outside interaction through the shared stack;
 * this utility covers interactions that are not layers.
 */
export const outsideInteraction: Action<
  HTMLElement,
  OutsideInteractionActionParams | undefined
> = (node, params) => {
  let current = params;
  let cleanups: Array<() => void> = [];
  let attachedTarget: EventTarget | null = null;
  let attachedTypes = "";
  let attachedCapture = true;

  const detach = (): void => {
    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups = [];
    attachedTarget = null;
    attachedTypes = "";
  };

  const attach = (): void => {
    detach();

    if (!current || current.enabled === false) {
      return;
    }

    const target =
      current.target ?? (typeof document !== "undefined" ? document : null);
    if (!target) {
      return;
    }

    const types = eventTypesOf(current.eventType);
    const typesKey = types.join(",");
    const capture = current.capture ?? true;
    if (
      attachedTarget === target &&
      attachedTypes === typesKey &&
      attachedCapture === capture
    ) {
      return;
    }
    attachedTarget = target;
    attachedTypes = typesKey;
    attachedCapture = capture;
    const listener = (event: Event): void => {
      if (!isPrimary(event)) {
        return;
      }

      const elements = [node, ...(current?.elements ?? [])];
      if (current?.reference) {
        elements.push(current.reference);
      }

      if (isOutsidePress(event, elements)) {
        current?.handler(event);
      }
    };

    for (const type of types) {
      cleanups.push(listen(target, type, listener, capture));
    }
  };

  attach();

  return {
    update(next) {
      current = next;
      attach();
    },
    destroy() {
      detach();
    },
  };
};
