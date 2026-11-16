import { getContext, setContext } from "svelte";
import type {
  OverlayChangeReason,
  OverlayControllerKind,
} from "@zealakit/overlay-core";

/** State shared by every part of one overlay root. */
export type OverlayPartsContext = {
  readonly kind: OverlayControllerKind;
  readonly isOpen: boolean;
  readonly titleId: string | null;
  readonly descriptionId: string | null;
  setTrigger(element: HTMLElement | null): void;
  setContent(element: HTMLElement | null): void;
  setBackdrop(element: HTMLElement | null): void;
  setArrow(element: HTMLElement | null): void;
  setTitleId(id: string | null): void;
  setDescriptionId(id: string | null): void;
  open(reason?: OverlayChangeReason): void;
  close(reason?: OverlayChangeReason): void;
  toggle(reason?: OverlayChangeReason): void;
};

const key = Symbol("zealakit-overlay");

export function setOverlayContext(context: OverlayPartsContext): void {
  setContext(key, context);
}

export function getOverlayContext(part: string): OverlayPartsContext {
  const context = getContext<OverlayPartsContext | undefined>(key);
  if (!context) {
    throw new Error(
      `[overlay-svelte] <${part}> must be used inside an overlay root such as <Popover>.`,
    );
  }
  return context;
}

let counter = 0;

/** Client-only id; parts assign it after mount so SSR output stays stable. */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
