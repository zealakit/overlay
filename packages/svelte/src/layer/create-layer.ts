import type { Readable } from "svelte/store";
import {
  type DismissReason,
  type LayerStack,
  type LayerStackHandle,
  type LayerStackLease,
  acquireSharedLayerStack,
} from "@zealakit/overlay-core";

export type LayerOptions = {
  element?: Element | null;
  reference?: Element | null;
  /** Extra elements that belong to the interaction boundary. */
  boundaries?: readonly (Element | null)[] | null;
  parent?: LayerStackHandle | null;
  stack?: LayerStack | null;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  onDismiss?: (reason: DismissReason) => void;
  disabled?: boolean;
};

export type LayerState = {
  id: string | null;
  isTopmost: boolean;
  handle: LayerStackHandle | null;
};

export type LayerController = {
  subscribe: Readable<LayerState>["subscribe"];
  setOptions(options: Partial<LayerOptions>): void;
  dispose(): void;
};

type Snapshot = {
  element: Element | null;
  reference: Element | null;
  boundaries: readonly (Element | null)[] | null;
  parent: LayerStackHandle | null;
  stack: LayerStack | null;
  dismissOnEscape: boolean;
  dismissOnOutsidePress: boolean;
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

function sameBoundaries(
  first: readonly (Element | null)[] | null,
  second: readonly (Element | null)[] | null,
): boolean {
  if (first === second) {
    return true;
  }
  if (!first || !second || first.length !== second.length) {
    return false;
  }
  return first.every((element, index) => element === second[index]);
}

function sameSnapshot(first: Snapshot, second: Snapshot): boolean {
  return (
    first.element === second.element &&
    first.reference === second.reference &&
    sameBoundaries(first.boundaries, second.boundaries) &&
    first.parent === second.parent &&
    first.stack === second.stack &&
    first.dismissOnEscape === second.dismissOnEscape &&
    first.dismissOnOutsidePress === second.dismissOnOutsidePress
  );
}

/**
 * Imperative layer controller with a Svelte-readable state store.
 *
 * Uses the shared per-document stack registry by default; only the topmost
 * layer receives Escape/outside interactions, and cleanup is idempotent.
 */
export function createLayer(options: LayerOptions = {}): LayerController {
  let current: LayerOptions = { ...options };
  let state: LayerState = { id: null, isTopmost: false, handle: null };
  let lease: LayerStackLease | null = null;
  let layerHandle: LayerStackHandle | null = null;
  let stopStack: (() => void) | null = null;
  let lastSnapshot: Snapshot | null = null;
  let disposed = false;

  const listeners = new Set<(value: LayerState) => void>();

  const emit = (): void => {
    for (const listener of [...listeners]) {
      listener(state);
    }
  };

  const setState = (next: LayerState): void => {
    if (
      state.id === next.id &&
      state.isTopmost === next.isTopmost &&
      state.handle === next.handle
    ) {
      return;
    }
    state = next;
    emit();
  };

  const teardown = (): void => {
    stopStack?.();
    stopStack = null;
    layerHandle?.dispose();
    layerHandle = null;
    lease?.release();
    lease = null;
    lastSnapshot = null;
    setState({ id: null, isTopmost: false, handle: null });
  };

  const apply = (): void => {
    if (disposed) {
      return;
    }

    const element = current.element ?? null;
    const reference = current.reference ?? null;
    const boundaries = current.boundaries ?? null;
    const parent = current.parent ?? null;
    const stack = current.stack ?? null;
    const dismissOnEscape = current.dismissOnEscape ?? true;
    const dismissOnOutsidePress = current.dismissOnOutsidePress ?? true;

    if (current.disabled || (!element && !reference)) {
      if (lastSnapshot !== null || layerHandle !== null) {
        teardown();
      }
      return;
    }

    const snapshot: Snapshot = {
      element,
      reference,
      boundaries,
      parent,
      stack,
      dismissOnEscape,
      dismissOnOutsidePress,
    };
    if (lastSnapshot !== null && sameSnapshot(lastSnapshot, snapshot)) {
      return;
    }

    teardown();

    let activeStack: LayerStack;
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

    try {
      layerHandle = activeStack.register({
        element,
        reference,
        boundaries: boundaries ?? undefined,
        parent,
        dismissOnEscape,
        dismissOnOutsidePress,
        onDismiss: (reason) => current.onDismiss?.(reason),
      });
    } catch (error) {
      lease?.release();
      lease = null;
      throw error;
    }

    lastSnapshot = snapshot;
    setState({
      id: layerHandle.id,
      isTopmost: layerHandle.isTopmost,
      handle: layerHandle,
    });

    stopStack = activeStack.subscribe(() => {
      if (!layerHandle) {
        return;
      }
      setState({
        id: layerHandle.id,
        isTopmost: layerHandle.isTopmost,
        handle: layerHandle,
      });
    });
  };

  apply();

  return {
    subscribe(run) {
      run(state);
      listeners.add(run);
      return () => {
        listeners.delete(run);
      };
    },
    setOptions(next) {
      if (disposed) {
        return;
      }
      current = { ...current, ...next };
      apply();
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      teardown();
      listeners.clear();
    },
  };
}
