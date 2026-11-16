import type { DismissReason } from "../types/dismissal.js";
import type {
  Layer,
  LayerConfig,
  LayerEvent,
  LayerListener,
  LayerStatus,
  ResolvedLayerConfig,
} from "../types/layer.js";

export const DEFAULT_LAYER_CONFIG: ResolvedLayerConfig = {
  defaultOpen: false,
  dismissOnEscape: true,
  dismissOnOutsidePress: true,
};

export type CreateLayerOptions = LayerConfig;

function resolveConfig(config: LayerConfig): ResolvedLayerConfig {
  return {
    defaultOpen: config.defaultOpen ?? DEFAULT_LAYER_CONFIG.defaultOpen,
    dismissOnEscape:
      config.dismissOnEscape ?? DEFAULT_LAYER_CONFIG.dismissOnEscape,
    dismissOnOutsidePress:
      config.dismissOnOutsidePress ??
      DEFAULT_LAYER_CONFIG.dismissOnOutsidePress,
  };
}

/**
 * Create a framework-free open/closed layer.
 *
 * The layer does not attach DOM listeners; adapters translate `config` into
 * their own dismissal wiring and call `close(reason)` when a dismissal happens.
 */
export function createLayer(config: LayerConfig = {}): Layer {
  const resolved = Object.freeze(resolveConfig(config));
  const listeners = new Set<LayerListener>();
  let status: LayerStatus = resolved.defaultOpen ? "open" : "closed";
  let destroyed = false;

  const emit = (event: LayerEvent): void => {
    for (const listener of [...listeners]) {
      listener(event);
    }
  };

  const open = (): void => {
    if (destroyed || status === "open") {
      return;
    }
    status = "open";
    emit({ type: "open", status: "open" });
  };

  const close = (reason: DismissReason = "imperative"): void => {
    if (status === "closed") {
      return;
    }
    status = "closed";
    emit({ type: "close", status: "closed", reason });
  };

  const toggle = (): void => {
    if (status === "open") {
      close();
    } else {
      open();
    }
  };

  return {
    get status() {
      return status;
    },
    config: resolved,
    open,
    close,
    toggle,
    subscribe(listener: LayerListener) {
      if (destroyed) {
        return () => {};
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy() {
      if (destroyed) {
        return;
      }
      close();
      destroyed = true;
      listeners.clear();
    },
  };
}
