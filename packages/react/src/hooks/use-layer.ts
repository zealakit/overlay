"use client";

import { useEffect, useRef, useState } from "react";
import {
  type DismissReason,
  type LayerStack,
  type LayerStackHandle,
  acquireSharedLayerStack,
} from "@zealakit/overlay-core";

export type UseLayerOptions = {
  /** Floating element used for outside-interaction detection. */
  element?: Element | null;
  /** Trigger element that should not count as "outside". */
  reference?: Element | null;
  /** Extra elements that belong to the interaction boundary. */
  boundaries?: readonly (Element | null)[];
  parent?: LayerStackHandle | null;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  onDismiss?: (reason: DismissReason) => void;
  /** Share a stack explicitly; defaults to a per-document shared stack. */
  stack?: LayerStack;
  disabled?: boolean;
};

export type UseLayerReturn = {
  id: string | null;
  isTopmost: boolean;
  /**
   * Registered handle. Use it as a `parent` for nested layers; the hook owns
   * its lifecycle and disposes it on cleanup.
   */
  handle: LayerStackHandle | null;
};

function resolveDocument(
  element: Element | null,
  reference: Element | null,
): Document | null {
  const existing = element?.ownerDocument ?? reference?.ownerDocument;
  if (existing) {
    return existing;
  }
  return typeof document !== "undefined" ? document : null;
}

/**
 * Register a layer in a shared stack.
 *
 * Registration happens in an effect, is repeated when the relevant inputs
 * change, and is disposed on cleanup — so Strict Mode double-invocation does
 * not leave duplicate layers or listeners behind.
 */
export function useLayer(options: UseLayerOptions = {}): UseLayerReturn {
  const {
    element = null,
    reference = null,
    boundaries,
    parent = null,
    dismissOnEscape = true,
    dismissOnOutsidePress = true,
    onDismiss,
    stack,
    disabled = false,
  } = options;

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const [handle, setHandle] = useState<LayerStackHandle | null>(null);
  const [isTopmost, setIsTopmost] = useState(false);

  useEffect(() => {
    if (disabled) {
      setHandle(null);
      setIsTopmost(false);
      return;
    }

    // Wait for at least one element so registration does not churn while
    // callback refs are attaching on mount.
    if (!element && !reference) {
      setHandle(null);
      setIsTopmost(false);
      return;
    }

    let activeStack: LayerStack;
    let lease = null;
    if (stack) {
      activeStack = stack;
    } else {
      const documentRef = resolveDocument(element, reference);
      if (!documentRef) {
        return;
      }
      lease = acquireSharedLayerStack(documentRef);
      activeStack = lease.stack;
    }

    const layerHandle = activeStack.register({
      element,
      reference,
      boundaries,
      parent,
      dismissOnEscape,
      dismissOnOutsidePress,
      onDismiss: (reason) => onDismissRef.current?.(reason),
    });

    setHandle(layerHandle);
    setIsTopmost(layerHandle.isTopmost);

    const unsubscribe = activeStack.subscribe(() => {
      setIsTopmost(layerHandle.isTopmost);
    });

    return () => {
      unsubscribe();
      layerHandle.dispose();
      lease?.release();
      setHandle(null);
      setIsTopmost(false);
    };
  }, [
    stack,
    disabled,
    element,
    reference,
    boundaries,
    parent,
    dismissOnEscape,
    dismissOnOutsidePress,
  ]);

  return { id: handle?.id ?? null, isTopmost, handle };
}
