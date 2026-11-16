"use client";

import { createContext } from "react";
import type { LayerStackHandle } from "@zealakit/overlay-core";

export type OverlayLayerContextValue = {
  handle: LayerStackHandle | null;
  isTopmost: boolean;
};

/** Shared parent-layer context for nested popovers and dialogs. */
export const OverlayLayerContext =
  createContext<OverlayLayerContextValue | null>(null);

/**
 * Portal target supplied by an open modal Dialog popup. Nested Popover and
 * Tooltip portals default into this element so they remain inside the dialog's
 * interaction/focus boundary instead of becoming body-level siblings.
 */
export const OverlayPortalContainerContext = createContext<Element | null>(
  null,
);
