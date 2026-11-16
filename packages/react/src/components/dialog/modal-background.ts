"use client";

import { useEffect } from "react";
import { acquireModalBackground } from "@zealakit/overlay-core";

/**
 * Mark all body-level background siblings inert while a modal dialog is open.
 * Dialog portal roots (including other open dialogs) are preserved so this does
 * not fight nested dialog lifecycles or sibling overlays rendered inside the
 * dialog portal.
 */
export function useModalBackground(
  root: Element | null,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !root?.isConnected) {
      return;
    }
    const documentRef = root.ownerDocument;
    if (!documentRef?.body) {
      return;
    }
    return acquireModalBackground(documentRef, [root]);
  }, [enabled, root]);
}
