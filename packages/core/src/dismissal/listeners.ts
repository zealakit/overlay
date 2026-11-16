import { isEscapeKey } from "../events/keyboard.js";
import { isPointerOutside } from "../events/pointer.js";
import { createDisposer } from "../lifecycle/disposer.js";
import { listen } from "../lifecycle/events.js";
import type { DismissReason } from "../types/dismissal.js";
import type { ReferenceElement } from "../types/element.js";
import { isBrowser, isElement } from "../utils/dom.js";

export type DismissListenerOptions = {
  /** Resolved lazily so adapters can pass refs whose target changes. */
  floating: () => Element | null | undefined;
  reference?: () => ReferenceElement | null | undefined;
  onDismiss: (reason: DismissReason) => void;
  escapeKey?: boolean;
  outsidePress?: boolean;
};

function getElement(
  value: ReferenceElement | null | undefined,
): Element | null {
  if (!value) {
    return null;
  }
  return isElement(value) ? value : (value.contextElement ?? null);
}

/**
 * Attach document-level Escape and outside-press dismissal.
 *
 * Presses on the reference are intentionally ignored here: references usually
 * toggle the layer themselves, and reporting them as "outside" would fight
 * that toggle. Secondary mouse buttons never dismiss.
 */
export function listenForDismiss({
  floating,
  reference,
  onDismiss,
  escapeKey = true,
  outsidePress = true,
}: DismissListenerOptions): () => void {
  if ((!escapeKey && !outsidePress) || !isBrowser()) {
    return () => {};
  }

  const ownerDocument = floating()?.ownerDocument ?? document;
  const disposer = createDisposer();

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (isEscapeKey(event)) {
      onDismiss("escape-key");
    }
  };

  const handlePointerDown = (event: PointerEvent): void => {
    const floatingElement = floating() ?? null;
    const referenceElement = getElement(reference?.());

    if (isPointerOutside(event, [floatingElement, referenceElement])) {
      onDismiss("outside-press");
    }
  };

  if (escapeKey) {
    disposer.add(
      listen<KeyboardEvent>(ownerDocument, "keydown", handleKeyDown),
    );
  }
  if (outsidePress) {
    disposer.add(
      listen<PointerEvent>(
        ownerDocument,
        "pointerdown",
        handlePointerDown,
        true,
      ),
    );
  }

  return () => disposer.dispose();
}
