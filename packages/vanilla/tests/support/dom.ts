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

/** happy-dom reports zero-sized layout; give positioning a deterministic box. */
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

export function resetDom(): void {
  document.body.replaceChildren();
  setViewport(1280, 720);
}

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

export function dispatchEscape(target: EventTarget = document): Event {
  const event = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
  });
  target.dispatchEvent(event);
  return event;
}

export type ListenerCounts = {
  keydownAdds: number;
  pointerdownAdds: number;
  keydownRemoves: number;
  pointerdownRemoves: number;
};

export function trackDocumentListeners(): {
  counts: ListenerCounts;
  restore(): void;
} {
  const doc = document as unknown as {
    addEventListener: (...args: unknown[]) => void;
    removeEventListener: (...args: unknown[]) => void;
  };
  const originalAdd = doc.addEventListener.bind(doc);
  const originalRemove = doc.removeEventListener.bind(doc);
  const counts: ListenerCounts = {
    keydownAdds: 0,
    pointerdownAdds: 0,
    keydownRemoves: 0,
    pointerdownRemoves: 0,
  };

  doc.addEventListener = (type, ...rest) => {
    if (type === "keydown") {
      counts.keydownAdds += 1;
    }
    if (type === "pointerdown") {
      counts.pointerdownAdds += 1;
    }
    originalAdd(type, ...rest);
  };
  doc.removeEventListener = (type, ...rest) => {
    if (type === "keydown") {
      counts.keydownRemoves += 1;
    }
    if (type === "pointerdown") {
      counts.pointerdownRemoves += 1;
    }
    originalRemove(type, ...rest);
  };

  return {
    counts,
    restore() {
      doc.addEventListener = originalAdd;
      doc.removeEventListener = originalRemove;
    },
  };
}
