import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import type {
  DismissReason,
  LayerStack,
  Placement,
  PositionerOptions,
  PositionerResult,
  Strategy,
} from "@zealakit/overlay-core";
import { useLayer } from "./use-layer.js";
import { usePositioner } from "./use-positioner.js";

export type UseOverlayOptions = PositionerOptions & {
  defaultOpen?: boolean;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  /** Extra elements that belong to the layer interaction boundary. */
  boundaries?: readonly (Element | null)[];
  onOpenChange?: (open: boolean, reason?: DismissReason) => void;
  /** Share a layer stack explicitly; defaults to a per-document shared stack. */
  stack?: LayerStack;
};

export type OverlayStyles = {
  position: Strategy;
  left: string;
  top: string;
};

export type UseOverlayReturn = {
  isOpen: Ref<boolean>;
  /** Placement after the latest measurement (or the requested placement). */
  placement: ComputedRef<Placement>;
  referenceRef: Ref<HTMLElement | null>;
  floatingRef: Ref<HTMLElement | null>;
  floatingStyles: ComputedRef<OverlayStyles>;
  open(): void;
  close(reason?: DismissReason): void;
  toggle(): void;
  update(): Promise<PositionerResult | null>;
};

/**
 * Uncontrolled composable overlay state: positioning plus layer registration
 * while open. Effects and watchers are owned by the underlying composables, so
 * scope disposal cleans everything up.
 */
export function useOverlay(options: UseOverlayOptions = {}): UseOverlayReturn {
  const {
    defaultOpen = false,
    dismissOnEscape = true,
    dismissOnOutsidePress = true,
    boundaries,
    onOpenChange,
    stack,
    ...positioning
  } = options;

  const isOpen = ref(defaultOpen);
  const referenceRef = ref<HTMLElement | null>(null);
  const floatingRef = ref<HTMLElement | null>(null);

  const positioner = usePositioner({
    ...positioning,
    reference: referenceRef,
    floating: floatingRef,
  });

  const open = (): void => {
    if (isOpen.value) {
      return;
    }
    isOpen.value = true;
    onOpenChange?.(true);
  };

  const close = (reason: DismissReason = "imperative"): void => {
    if (!isOpen.value) {
      return;
    }
    isOpen.value = false;
    onOpenChange?.(false, reason);
  };

  const toggle = (): void => {
    if (isOpen.value) {
      close("imperative");
    } else {
      open();
    }
  };

  useLayer({
    element: floatingRef,
    reference: referenceRef,
    boundaries,
    dismissOnEscape,
    dismissOnOutsidePress,
    stack,
    disabled: computed(() => !isOpen.value),
    onDismiss: close,
  });

  const placement = computed<Placement>(
    () =>
      positioner.result.value?.placement ?? positioning.placement ?? "bottom",
  );

  const floatingStyles = computed<OverlayStyles>(() => {
    const result = positioner.result.value;
    if (!result) {
      return { position: "fixed", left: "0px", top: "0px" };
    }
    return {
      position: result.strategy,
      left: `${result.x}px`,
      top: `${result.y}px`,
    };
  });

  return {
    isOpen,
    placement,
    referenceRef,
    floatingRef,
    floatingStyles,
    open,
    close,
    toggle,
    update: positioner.update,
  };
}
