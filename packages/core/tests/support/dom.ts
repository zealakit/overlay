export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function toDomRect(box: Box): DOMRect {
  const rect = {
    ...box,
    top: box.y,
    left: box.x,
    right: box.x + box.width,
    bottom: box.y + box.height,
    toJSON: () => ({ ...box }),
  };
  return rect as DOMRect;
}

/**
 * Give an element deterministic geometry. happy-dom reports zero-sized rects,
 * and Floating UI also reads `offsetWidth`/`offsetHeight`.
 */
export function setBox(element: Element, box: Box): void {
  element.getBoundingClientRect = () => toDomRect(box);
  Object.defineProperty(element, "offsetWidth", {
    configurable: true,
    value: box.width,
  });
  Object.defineProperty(element, "offsetHeight", {
    configurable: true,
    value: box.height,
  });
}

export function setViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: height,
  });
}

/** Dispatch a pointer-like event that carries `button` and `isPrimary`. */
export function dispatchPointer(
  target: EventTarget,
  init: { type?: string; button?: number } = {},
): Event {
  const event = new window.Event(init.type ?? "pointerdown", {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "button", { value: init.button ?? 0 });
  Object.defineProperty(event, "isPrimary", { value: true });
  target.dispatchEvent(event);
  return event;
}

export function dispatchKey(
  target: EventTarget,
  init: {
    key?: string;
    shiftKey?: boolean;
    composing?: boolean;
  } = {},
): KeyboardEvent {
  const event = new window.KeyboardEvent("keydown", {
    key: init.key ?? "Escape",
    shiftKey: init.shiftKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "isComposing", {
    configurable: true,
    value: init.composing ?? false,
  });
  target.dispatchEvent(event);
  return event;
}

export function dispatchFocusIn(target: EventTarget): FocusEvent {
  const event = new window.FocusEvent("focusin", { bubbles: true });
  target.dispatchEvent(event);
  return event;
}
