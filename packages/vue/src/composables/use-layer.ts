import {
  computed,
  getCurrentInstance,
  getCurrentScope,
  onMounted,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
} from "vue";
import type { MaybeRefOrGetter, ShallowRef } from "vue";
import {
  type DismissReason,
  type LayerStack,
  type LayerStackHandle,
  type LayerStackLease,
  acquireSharedLayerStack,
} from "@zealakit/overlay-core";

export type UseLayerOptions = {
  element?: MaybeRefOrGetter<Element | null | undefined>;
  reference?: MaybeRefOrGetter<Element | null | undefined>;
  /** Extra elements that belong to the interaction boundary. */
  boundaries?: MaybeRefOrGetter<readonly (Element | null)[] | null | undefined>;
  parent?: MaybeRefOrGetter<LayerStackHandle | null | undefined>;
  dismissOnEscape?: MaybeRefOrGetter<boolean | undefined>;
  dismissOnOutsidePress?: MaybeRefOrGetter<boolean | undefined>;
  onDismiss?: (reason: DismissReason) => void;
  /** Share a stack explicitly; defaults to a per-document shared stack. */
  stack?: MaybeRefOrGetter<LayerStack | null | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
};

export type UseLayerReturn = {
  id: Readonly<ShallowRef<string | null>>;
  isTopmost: Readonly<ShallowRef<boolean>>;
  handle: Readonly<ShallowRef<LayerStackHandle | null>>;
  /** Idempotent; also runs automatically on scope disposal. */
  dispose: () => void;
};

type RegistrationSnapshot = {
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

function sameSnapshot(
  first: RegistrationSnapshot,
  second: RegistrationSnapshot,
): boolean {
  return (
    first.element === second.element &&
    first.reference === second.reference &&
    first.boundaries === second.boundaries &&
    first.parent === second.parent &&
    first.stack === second.stack &&
    first.dismissOnEscape === second.dismissOnEscape &&
    first.dismissOnOutsidePress === second.dismissOnOutsidePress
  );
}

/**
 * Register a layer in a shared stack.
 *
 * Reactive element/parent/policy changes re-register only when one of those
 * values actually changes. Registration is torn down on scope disposal, and a
 * `dispose()` escape hatch is returned for use outside a Vue scope.
 */
export function useLayer(options: UseLayerOptions = {}): UseLayerReturn {
  const element = computed(() => toValue(options.element) ?? null);
  const reference = computed(() => toValue(options.reference) ?? null);
  const boundaries = computed(() => toValue(options.boundaries) ?? null);
  const parent = computed(() => toValue(options.parent) ?? null);
  const stack = computed(() => toValue(options.stack) ?? null);
  const disabled = computed(() => toValue(options.disabled) ?? false);
  const dismissOnEscape = computed(
    () => toValue(options.dismissOnEscape) ?? true,
  );
  const dismissOnOutsidePress = computed(
    () => toValue(options.dismissOnOutsidePress) ?? true,
  );

  const id = shallowRef<string | null>(null);
  const isTopmost = shallowRef(false);
  const handle = shallowRef<LayerStackHandle | null>(null);

  let lease: LayerStackLease | null = null;
  let layerHandle: LayerStackHandle | null = null;
  let stopStack: (() => void) | null = null;
  let lastSnapshot: RegistrationSnapshot | null = null;
  let disposed = false;

  const teardown = (): void => {
    stopStack?.();
    stopStack = null;
    layerHandle?.dispose();
    layerHandle = null;
    lease?.release();
    lease = null;
    id.value = null;
    isTopmost.value = false;
    handle.value = null;
    lastSnapshot = null;
  };

  const sync = (): void => {
    if (disposed) {
      return;
    }

    const elementValue = element.value;
    const referenceValue = reference.value;
    const boundariesValue = boundaries.value;
    const parentValue = parent.value;
    const stackValue = stack.value;
    const escapeValue = dismissOnEscape.value;
    const outsideValue = dismissOnOutsidePress.value;

    if (disabled.value || (!elementValue && !referenceValue)) {
      if (lastSnapshot !== null || layerHandle !== null) {
        teardown();
      }
      return;
    }

    const snapshot: RegistrationSnapshot = {
      element: elementValue,
      reference: referenceValue,
      boundaries: boundariesValue,
      parent: parentValue,
      stack: stackValue,
      dismissOnEscape: escapeValue,
      dismissOnOutsidePress: outsideValue,
    };
    if (lastSnapshot !== null && sameSnapshot(lastSnapshot, snapshot)) {
      return;
    }

    teardown();

    let activeStack: LayerStack;
    if (stackValue) {
      activeStack = stackValue;
    } else {
      const documentRef = resolveDocument(elementValue, referenceValue);
      if (!documentRef) {
        return;
      }
      lease = acquireSharedLayerStack(documentRef);
      activeStack = lease.stack;
    }

    try {
      layerHandle = activeStack.register({
        element: elementValue,
        reference: referenceValue,
        parent: parentValue,
        dismissOnEscape: escapeValue,
        dismissOnOutsidePress: outsideValue,
        onDismiss: (reason) => options.onDismiss?.(reason),
      });
    } catch (error) {
      lease?.release();
      lease = null;
      throw error;
    }

    lastSnapshot = snapshot;
    id.value = layerHandle.id;
    isTopmost.value = layerHandle.isTopmost;
    handle.value = layerHandle;
    stopStack = activeStack.subscribe(() => {
      isTopmost.value = layerHandle?.isTopmost ?? false;
    });
  };

  const stopSources = watch(
    [
      element,
      reference,
      boundaries,
      parent,
      stack,
      disabled,
      dismissOnEscape,
      dismissOnOutsidePress,
    ],
    sync,
    { flush: "post" },
  );

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    stopSources();
    teardown();
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
    id: id as Readonly<ShallowRef<string | null>>,
    isTopmost: isTopmost as Readonly<ShallowRef<boolean>>,
    handle: handle as Readonly<ShallowRef<LayerStackHandle | null>>,
    dispose,
  };
}
