import type { Cleanup, Disposer } from "../types/lifecycle.js";

/**
 * Collect cleanup functions and dispose them in reverse order.
 *
 * Disposal is idempotent. Adding a cleanup after disposal runs it immediately,
 * which makes late async work safe.
 */
export function createDisposer(): Disposer {
  const cleanups = new Set<Cleanup>();
  let disposed = false;

  return {
    get isDisposed() {
      return disposed;
    },
    add(cleanup) {
      if (disposed) {
        cleanup();
        return () => {};
      }

      let active = true;
      const entry: Cleanup = () => {
        if (!active) {
          return;
        }
        active = false;
        cleanups.delete(entry);
        cleanup();
      };

      cleanups.add(entry);
      return entry;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;

      for (const cleanup of [...cleanups].reverse()) {
        cleanups.delete(cleanup);
        cleanup();
      }
      cleanups.clear();
    },
  };
}
