import {
  computed,
  getCurrentInstance,
  getCurrentScope,
  onMounted,
  onScopeDispose,
  readonly,
  shallowRef,
  toValue,
  watch,
} from "vue";
import type { MaybeRefOrGetter, ShallowRef } from "vue";
import {
  type Placement,
  type Positioner,
  type PositionerOptions,
  type PositionerResult,
  createPositioner,
} from "@zealakit/overlay-core";

type MaybeOption<T> = MaybeRefOrGetter<T | undefined>;

export type UsePositionerOptions = {
  reference?: MaybeRefOrGetter<Element | null | undefined>;
  floating?: MaybeRefOrGetter<HTMLElement | null | undefined>;
  placement?: MaybeOption<Placement>;
  offset?: MaybeOption<number>;
  alignOffset?: MaybeOption<number>;
  flip?: MaybeOption<boolean>;
  shift?: MaybeOption<boolean>;
  padding?: MaybeOption<number>;
  boundary?: MaybeOption<PositionerOptions["boundary"]>;
  strategy?: MaybeOption<PositionerOptions["strategy"]>;
  autoUpdate?: MaybeOption<boolean>;
};

export type UsePositionerReturn = {
  result: Readonly<ShallowRef<PositionerResult | null>>;
  update: () => Promise<PositionerResult | null>;
  /** Idempotent; also runs automatically on scope disposal. */
  dispose: () => void;
};

function sameResult(
  previous: PositionerResult | null,
  next: PositionerResult,
): boolean {
  return (
    previous !== null &&
    previous.x === next.x &&
    previous.y === next.y &&
    previous.placement === next.placement &&
    previous.strategy === next.strategy
  );
}

/**
 * Vue positioning composable.
 *
 * A Core positioner is created lazily after elements are available and is
 * driven by shallow watchers on elements and individual options (no deep
 * watchers). Cleanup is tied to the active effect scope and is also exposed as
 * `dispose()` for callers outside a scope.
 */
export function usePositioner(
  options: UsePositionerOptions = {},
): UsePositionerReturn {
  const referenceElement = computed(() => toValue(options.reference) ?? null);
  const floatingElement = computed(() => toValue(options.floating) ?? null);
  const resolvedOptions = computed<PositionerOptions>(() => ({
    placement: toValue(options.placement),
    offset: toValue(options.offset),
    alignOffset: toValue(options.alignOffset),
    flip: toValue(options.flip),
    shift: toValue(options.shift),
    padding: toValue(options.padding),
    boundary: toValue(options.boundary),
    strategy: toValue(options.strategy),
    autoUpdate: toValue(options.autoUpdate),
  }));

  const positioner = shallowRef<Positioner | null>(null);
  const result = shallowRef<PositionerResult | null>(null);
  let unsubscribe: (() => void) | null = null;
  let lastReference: Element | null = null;
  let lastFloating: HTMLElement | null = null;
  let disposed = false;

  const ensurePositioner = (): Positioner => {
    const existing = positioner.value;
    if (existing) {
      return existing;
    }

    const created = createPositioner({
      ...resolvedOptions.value,
      reference: referenceElement.value,
      floating: floatingElement.value,
    });
    positioner.value = created;
    lastReference = referenceElement.value;
    lastFloating = floatingElement.value;

    unsubscribe = created.subscribe((next) => {
      if (!floatingElement.value) {
        return;
      }
      if (sameResult(result.value, next)) {
        return;
      }
      result.value = next;
    });

    return created;
  };

  const sync = (): void => {
    if (disposed) {
      return;
    }

    const reference = referenceElement.value;
    const floating = floatingElement.value;

    if (!reference && !floating) {
      if (positioner.value) {
        if (lastReference !== null) {
          lastReference = null;
          positioner.value.setReference(null);
        }
        if (lastFloating !== null) {
          lastFloating = null;
          positioner.value.setFloating(null);
        }
      }
      if (result.value !== null) {
        result.value = null;
      }
      return;
    }

    const active = ensurePositioner();
    if (reference !== lastReference) {
      lastReference = reference;
      active.setReference(reference);
    }
    if (floating !== lastFloating) {
      lastFloating = floating;
      active.setFloating(floating);
    }
  };

  const update = async (): Promise<PositionerResult | null> => {
    sync();
    return positioner.value?.update() ?? null;
  };

  const stopElements = watch([referenceElement, floatingElement], sync, {
    flush: "sync",
  });
  const stopOptions = watch(
    resolvedOptions,
    (next) => {
      positioner.value?.setOptions(next);
    },
    { flush: "post" },
  );

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;

    stopElements();
    stopOptions();
    unsubscribe?.();
    unsubscribe = null;
    positioner.value?.dispose();
    positioner.value = null;
    lastReference = null;
    lastFloating = null;
    result.value = null;
  };

  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    onMounted(sync);
  } else {
    sync();
  }

  if (getCurrentScope()) {
    onScopeDispose(dispose);
  }

  return {
    result: readonly(result) as Readonly<ShallowRef<PositionerResult | null>>,
    update,
    dispose,
  };
}
