"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type PortalProps = {
  children: ReactNode;
  /** Defaults to `document.body`. */
  container?: Element | null;
  disabled?: boolean;
};

/**
 * Render children into a portal target after mount.
 *
 * Returns `null` on the server and during the first client render, which keeps
 * SSR markup stable. Prefer this over touching `document` during render.
 */
export function Portal({ children, container, disabled = false }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (disabled || !mounted) {
    return null;
  }

  return createPortal(children, container ?? document.body);
}
