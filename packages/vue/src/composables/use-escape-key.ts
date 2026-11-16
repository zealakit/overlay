import { getCurrentScope, onScopeDispose, toValue, watchEffect } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { isEscapeKey, listen } from "@zealakit/overlay-core";

export type UseEscapeKeyOptions = {
  enabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Defaults to the global document. */
  target?: MaybeRefOrGetter<Document | HTMLElement | null | undefined>;
};

/**
 * Call `handler` when Escape is pressed on the target.
 *
 * The listener is attached in a `watchEffect` with automatic cleanup; scope
 * disposal stops it, and `dispose()` is returned for callers outside a scope.
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  options: UseEscapeKeyOptions = {},
): () => void {
  const stop = watchEffect(
    (onCleanup) => {
      if (!(toValue(options.enabled) ?? true)) {
        return;
      }

      const target =
        toValue(options.target) ??
        (typeof document !== "undefined" ? document : null);
      if (!target) {
        return;
      }

      onCleanup(
        listen<KeyboardEvent>(target, "keydown", (event) => {
          if (isEscapeKey(event)) {
            handler(event);
          }
        }),
      );
    },
    { flush: "post" },
  );

  if (getCurrentScope()) {
    onScopeDispose(stop);
  }

  return stop;
}
