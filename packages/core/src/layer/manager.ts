import { isOutsidePress } from "../events/outside.js";
import type {
  LayerEntry,
  LayerHandle,
  LayerManager,
  LayerStackListener,
  RegisterLayerOptions,
} from "../types/layer.js";
import { resolveElement } from "../utils/element.js";

type InternalLayer = {
  id: string;
  parentId: string | null;
  element: (() => Element | null) | null;
};

function normalizeElement(
  source: RegisterLayerOptions["element"],
): (() => Element | null) | null {
  if (!source) {
    return null;
  }
  if (typeof source === "function") {
    return source;
  }
  const element = source;
  return () => element;
}

/**
 * Create a minimal layer stack.
 *
 * Layers are ordered by registration (bottom → top). A child layer belongs to
 * an existing parent; unregistering a parent also removes its descendants.
 * The manager does not open, close, focus, or render layers.
 */
export function createLayerManager(): LayerManager {
  const layers: InternalLayer[] = [];
  const listeners = new Set<LayerStackListener>();
  let nextId = 0;
  let disposed = false;

  const toEntry = (layer: InternalLayer): LayerEntry =>
    Object.freeze({ id: layer.id, parentId: layer.parentId });

  const getStack = (): readonly LayerEntry[] =>
    Object.freeze(layers.map(toEntry));

  const emit = (): void => {
    const stack = getStack();
    for (const listener of [...listeners]) {
      listener(stack);
    }
  };

  const find = (id: string): InternalLayer | undefined =>
    layers.find((layer) => layer.id === id);

  const collectElements = (id: string): Element[] => {
    const root = find(id);
    if (!root) {
      return [];
    }

    const ids = new Set<string>([root.id]);
    for (const layer of layers) {
      if (layer.parentId !== null && ids.has(layer.parentId)) {
        ids.add(layer.id);
      }
    }

    const elements: Element[] = [];
    for (const layer of layers) {
      if (!ids.has(layer.id)) {
        continue;
      }
      const element = resolveElement(layer.element);
      if (element) {
        elements.push(element);
      }
    }
    return elements;
  };

  const unregister = (id: string): boolean => {
    if (!find(id)) {
      return false;
    }

    const removed = new Set<string>([id]);
    for (const layer of layers) {
      if (layer.parentId !== null && removed.has(layer.parentId)) {
        removed.add(layer.id);
      }
    }

    for (let index = layers.length - 1; index >= 0; index -= 1) {
      const layer = layers[index];
      if (layer && removed.has(layer.id)) {
        layers.splice(index, 1);
      }
    }

    emit();
    return true;
  };

  const isOutside = (id: string, event: Event): boolean => {
    const elements = collectElements(id);
    if (elements.length === 0) {
      return false;
    }
    return isOutsidePress(event, elements);
  };

  return {
    get size() {
      return layers.length;
    },
    register(options: RegisterLayerOptions = {}) {
      if (disposed) {
        throw new Error("[overlay-core] Layer manager is disposed.");
      }

      const parentId = options.parentId ?? null;
      if (parentId !== null && !find(parentId)) {
        throw new Error(`[overlay-core] Unknown parent layer: "${parentId}".`);
      }

      nextId += 1;
      const id = options.id ?? `layer-${nextId}`;
      if (find(id)) {
        throw new Error(`[overlay-core] Duplicate layer id: "${id}".`);
      }

      const layer: InternalLayer = {
        id,
        parentId,
        element: normalizeElement(options.element),
      };
      layers.push(layer);
      emit();

      return {
        id,
        parentId,
        get isRegistered() {
          return find(id) !== undefined;
        },
        dispose() {
          unregister(id);
        },
      } satisfies LayerHandle;
    },
    unregister,
    get(id: string) {
      const layer = find(id);
      return layer ? toEntry(layer) : null;
    },
    getStack,
    getTopmost() {
      const top = layers[layers.length - 1];
      return top ? toEntry(top) : null;
    },
    isTopmost(id: string) {
      return layers[layers.length - 1]?.id === id;
    },
    isOutside,
    isOutsideActive(event: Event) {
      const top = layers[layers.length - 1];
      if (!top) {
        return false;
      }
      return isOutside(top.id, event);
    },
    subscribe(listener: LayerStackListener) {
      if (disposed) {
        return () => {};
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      layers.length = 0;
      listeners.clear();
    },
  } satisfies LayerManager;
}
