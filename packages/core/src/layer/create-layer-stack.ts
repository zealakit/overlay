import { isEscapeKey } from "../events/keyboard.js";
import { isPointerOutside } from "../events/pointer.js";
import { listen } from "../lifecycle/events.js";
import type { DismissReason } from "../types/dismissal.js";
import type { Cleanup } from "../types/lifecycle.js";
import { getGlobalState } from "../utils/global-state.js";
import type {
  LayerBoundarySource,
  LayerElementSource,
  LayerStack,
  LayerStackHandle,
  LayerStackLease,
  LayerStackListener,
  LayerStackOptions,
  LayerStackRegistration,
  LayerStackRegistry,
} from "../types/layer.js";
import { resolveElement } from "../utils/element.js";
import { createLayerManager } from "./manager.js";

type InternalLayer = {
  id: string;
  dismissOnEscape: boolean;
  dismissOnOutsidePress: boolean;
  onDismiss: ((reason: DismissReason) => void) | null;
  element: LayerElementSource;
  reference: LayerElementSource;
  boundaries: readonly LayerElementSource[];
};

/**
 * Shared stack for layered UI.
 *
 * A single set of document listeners is attached while at least one registered
 * layer has dismissal enabled. Escape and outside presses are routed to the
 * topmost layer only; per-layer flags decide whether it reacts.
 */
export function createLayerStack(options: LayerStackOptions = {}): LayerStack {
  const manager = createLayerManager();
  const layers = new Map<string, InternalLayer>();
  const handles = new Map<string, LayerStackHandle>();
  let activeDocument: Document | null = options.document ?? null;
  let detach: Cleanup | null = null;
  let disposed = false;

  const resolveDocument = (): Document | null => {
    if (activeDocument) {
      return activeDocument;
    }

    for (const layer of layers.values()) {
      const element =
        resolveElement(layer.element) ?? resolveElement(layer.reference);
      if (element) {
        activeDocument = element.ownerDocument;
        return activeDocument;
      }
    }

    if (typeof document !== "undefined") {
      activeDocument = document;
      return activeDocument;
    }

    return null;
  };

  const topLayer = (): InternalLayer | null => {
    const top = manager.getTopmost();
    return top ? (layers.get(top.id) ?? null) : null;
  };

  const resolveBoundaries = (
    source: LayerBoundarySource | undefined,
  ): readonly LayerElementSource[] => {
    if (!source) {
      return [];
    }
    if (Array.isArray(source)) {
      return source as readonly LayerElementSource[];
    }
    return [source as LayerElementSource];
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) {
      return;
    }

    const top = topLayer();
    if (!top?.dismissOnEscape || !isEscapeKey(event)) {
      return;
    }
    top.onDismiss?.("escape-key");
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.defaultPrevented) {
      return;
    }

    const top = topLayer();
    if (!top?.dismissOnOutsidePress) {
      return;
    }

    const elements: Element[] = [];
    const sources = [top.element, top.reference, ...top.boundaries];
    for (const source of sources) {
      const element = resolveElement(source);
      if (element && !elements.includes(element)) {
        elements.push(element);
      }
    }
    if (elements.length === 0) {
      return;
    }

    if (isPointerOutside(event, elements)) {
      top.onDismiss?.("outside-press");
    }
  };

  const detachListeners = (): void => {
    detach?.();
    detach = null;
  };

  const syncListeners = (): void => {
    const needed = [...layers.values()].some(
      (layer) => layer.dismissOnEscape || layer.dismissOnOutsidePress,
    );
    if (!needed) {
      detachListeners();
      return;
    }
    if (detach) {
      return;
    }

    const ownerDocument = resolveDocument();
    if (!ownerDocument) {
      return;
    }

    const offKeyDown = listen<KeyboardEvent>(
      ownerDocument,
      "keydown",
      handleKeyDown,
    );
    const offPointerDown = listen<PointerEvent>(
      ownerDocument,
      "pointerdown",
      handlePointerDown,
      true,
    );

    detach = () => {
      offKeyDown();
      offPointerDown();
    };
  };

  const remove = (id: string): boolean => {
    if (disposed || !layers.has(id)) {
      return false;
    }

    const removed = manager.unregister(id);
    const activeIds = new Set(manager.getStack().map((entry) => entry.id));
    for (const key of [...layers.keys()]) {
      if (!activeIds.has(key)) {
        layers.delete(key);
      }
    }
    for (const key of [...handles.keys()]) {
      if (!activeIds.has(key)) {
        handles.delete(key);
      }
    }

    syncListeners();
    return removed;
  };

  return {
    get size() {
      return layers.size;
    },
    register(layerOptions: LayerStackRegistration = {}) {
      if (disposed) {
        throw new Error("[overlay-core] Layer stack is disposed.");
      }

      const parent = layerOptions.parent ?? null;
      if (parent) {
        const known = handles.get(parent.id);
        if (!known) {
          throw new Error(
            `[overlay-core] Unknown parent layer: "${parent.id}".`,
          );
        }
        if (known !== parent) {
          throw new Error(
            "[overlay-core] Parent layer belongs to a different stack.",
          );
        }
      }

      const parentId = parent?.id ?? null;
      const coreHandle = manager.register({
        id: layerOptions.id,
        parentId,
        element: layerOptions.element ?? null,
      });

      const layer: InternalLayer = {
        id: coreHandle.id,
        dismissOnEscape: layerOptions.dismissOnEscape ?? true,
        dismissOnOutsidePress: layerOptions.dismissOnOutsidePress ?? true,
        onDismiss: layerOptions.onDismiss ?? null,
        element: layerOptions.element ?? null,
        reference: layerOptions.reference ?? null,
        boundaries: resolveBoundaries(layerOptions.boundaries),
      };
      layers.set(layer.id, layer);

      const handle: LayerStackHandle = {
        id: layer.id,
        parentId: coreHandle.parentId,
        get isRegistered() {
          return layers.has(layer.id) && manager.get(layer.id) !== null;
        },
        get isTopmost() {
          return manager.isTopmost(layer.id);
        },
        dispose() {
          remove(layer.id);
        },
      };
      handles.set(layer.id, handle);
      syncListeners();

      return handle;
    },
    getTopmost() {
      return manager.getTopmost();
    },
    isTopmost(id: string) {
      return manager.isTopmost(id);
    },
    subscribe(listener: LayerStackListener) {
      return manager.subscribe(listener);
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      detachListeners();
      layers.clear();
      handles.clear();
      manager.dispose();
    },
  };
}

/**
 * Create a per-document registry of reference-counted layer stacks.
 *
 * Adapters use one registry per module, so independent components on the same
 * document share one stack (and one listener pair) while still releasing it
 * when the last consumer unmounts.
 */
export function createLayerStackRegistry(): LayerStackRegistry {
  const stacks = new WeakMap<
    Document,
    { stack: LayerStack; references: number }
  >();

  return {
    acquire(documentRef: Document): LayerStackLease {
      const existing = stacks.get(documentRef);
      const entry = existing ?? {
        stack: createLayerStack({ document: documentRef }),
        references: 0,
      };
      if (!existing) {
        stacks.set(documentRef, entry);
      }
      entry.references += 1;

      let released = false;
      return {
        stack: entry.stack,
        release() {
          if (released) {
            return;
          }
          released = true;
          entry.references -= 1;
          if (entry.references === 0) {
            entry.stack.dispose();
            stacks.delete(documentRef);
          }
        },
      };
    },
  };
}

const sharedLayerStackRegistry = getGlobalState(
  "shared-layer-stack",
  createLayerStackRegistry,
);

/**
 * Shared per-document layer stack used by all adapters by default.
 *
 * Keeping this registry in Core means overlays from different adapters (for
 * example a React overlay and a Vue overlay on the same page) still share one
 * listener pair and one ordering stack.
 */
export function acquireSharedLayerStack(
  documentRef: Document,
): LayerStackLease {
  return sharedLayerStackRegistry.acquire(documentRef);
}
