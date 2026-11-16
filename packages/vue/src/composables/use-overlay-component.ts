import {
  getCurrentScope,
  onMounted,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from "vue";
import type {
  AnimationSetting,
  Placement,
  PositionerBoundary,
  Strategy,
} from "@zealakit/overlay-core";
import {
  createOverlayController,
  type OverlayArrowOptions,
  type OverlayChangeReason,
  type OverlayController,
  type OverlayControllerKind,
  type OverlayControllerOptions,
} from "@zealakit/overlay-core";

type ReactivePositioningOptions = {
  placement?: MaybeRefOrGetter<Placement | undefined>;
  offset?: MaybeRefOrGetter<number | undefined>;
  alignOffset?: MaybeRefOrGetter<number | undefined>;
  flip?: MaybeRefOrGetter<boolean | undefined>;
  shift?: MaybeRefOrGetter<boolean | undefined>;
  padding?: MaybeRefOrGetter<number | undefined>;
  boundary?: MaybeRefOrGetter<PositionerBoundary | undefined>;
  strategy?: MaybeRefOrGetter<Strategy | undefined>;
  autoUpdate?: MaybeRefOrGetter<boolean | undefined>;
  dir?: MaybeRefOrGetter<"ltr" | "rtl" | undefined>;
};

/** Reactive arrow configuration; bind `element` to a template ref. */
export type UseOverlayArrowOptions = {
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  size?: MaybeRefOrGetter<number | undefined>;
  padding?: MaybeRefOrGetter<number | undefined>;
};

export type UseOverlayComponentOptions = Omit<
  OverlayControllerOptions,
  | "kind"
  | "trigger"
  | "content"
  | "backdrop"
  | "open"
  | "placement"
  | "offset"
  | "alignOffset"
  | "flip"
  | "shift"
  | "padding"
  | "boundary"
  | "strategy"
  | "autoUpdate"
  | "dir"
  | "arrow"
  | "animation"
> &
  ReactivePositioningOptions & {
    trigger: MaybeRefOrGetter<HTMLElement | null | undefined>;
    content: MaybeRefOrGetter<HTMLElement | null | undefined>;
    backdrop?: MaybeRefOrGetter<HTMLElement | null | undefined>;
    open?: MaybeRefOrGetter<boolean | undefined>;
    /** Arrow for popover/tooltip. Hidden unless an element is provided. */
    arrow?: MaybeRefOrGetter<UseOverlayArrowOptions | null | undefined>;
    /** Enter/exit animation. Disabled unless `true` or a config is passed. */
    animation?: MaybeRefOrGetter<AnimationSetting | undefined>;
  };

export type UseOverlayComponentReturn = {
  isOpen: Ref<boolean>;
  controller: ShallowRef<OverlayController | null>;
  contentId: Ref<string | null>;
  open(reason?: OverlayChangeReason): void;
  close(reason?: OverlayChangeReason): void;
  toggle(reason?: OverlayChangeReason): void;
  setOpen(open: boolean): void;
  update: () => Promise<unknown>;
  dispose(): void;
};

export function useOverlayComponent(
  kind: OverlayControllerKind,
  options: UseOverlayComponentOptions,
): UseOverlayComponentReturn {
  const isOpen = ref(toValue(options.open) ?? options.defaultOpen ?? false);
  const controller = shallowRef<OverlayController | null>(null);
  const contentId = ref<string | null>(null);
  let unsubscribe: (() => void) | null = null;
  let disposed = false;

  const destroyController = (): void => {
    unsubscribe?.();
    unsubscribe = null;
    controller.value?.destroy();
    controller.value = null;
    contentId.value = null;
  };

  const resolveArrow = (): OverlayArrowOptions | null => {
    const arrow = toValue(options.arrow);
    const element = arrow ? toValue(arrow.element) : null;
    if (!arrow || !element) {
      return null;
    }
    return {
      element,
      size: toValue(arrow.size),
      padding: toValue(arrow.padding),
    };
  };

  const create = (): void => {
    if (disposed) {
      return;
    }
    const trigger = toValue(options.trigger);
    const content = toValue(options.content);
    if (!trigger || !content) {
      return;
    }
    destroyController();
    const initialOpen = toValue(options.open);
    const next = createOverlayController({
      ...options,
      kind,
      trigger,
      content,
      backdrop: toValue(options.backdrop) ?? null,
      open: initialOpen,
      placement: toValue(options.placement),
      offset: toValue(options.offset),
      alignOffset: toValue(options.alignOffset),
      flip: toValue(options.flip),
      shift: toValue(options.shift),
      padding: toValue(options.padding),
      boundary: toValue(options.boundary),
      strategy: toValue(options.strategy),
      autoUpdate: toValue(options.autoUpdate),
      dir: toValue(options.dir),
      arrow: resolveArrow(),
      animation: toValue(options.animation),
      onOpenChange(open, reason) {
        isOpen.value = open;
        options.onOpenChange?.(open, reason);
      },
    });
    controller.value = next;
    contentId.value = next.contentId;
    isOpen.value = next.isOpen;
    unsubscribe = next.subscribe((state) => {
      isOpen.value = state.isOpen;
    });
  };

  onMounted(create);

  watch(
    [
      () => toValue(options.trigger),
      () => toValue(options.content),
      () => toValue(options.backdrop),
    ],
    create,
    { flush: "post" },
  );

  watch(
    () => toValue(options.open),
    (next) => {
      if (next !== undefined) {
        controller.value?.setOpen(next);
      }
    },
    { flush: "post" },
  );

  watch(
    () => [
      toValue(options.placement),
      toValue(options.offset),
      toValue(options.alignOffset),
      toValue(options.flip),
      toValue(options.shift),
      toValue(options.padding),
      toValue(options.boundary),
      toValue(options.strategy),
      toValue(options.autoUpdate),
      toValue(options.dir),
    ],
    () => {
      controller.value?.setOptions({
        placement: toValue(options.placement),
        offset: toValue(options.offset),
        alignOffset: toValue(options.alignOffset),
        flip: toValue(options.flip),
        shift: toValue(options.shift),
        padding: toValue(options.padding),
        boundary: toValue(options.boundary),
        strategy: toValue(options.strategy),
        autoUpdate: toValue(options.autoUpdate),
        dir: toValue(options.dir),
      });
    },
    { flush: "post" },
  );

  watch(
    () => {
      const arrow = resolveArrow();
      return [arrow?.element, arrow?.size, arrow?.padding];
    },
    () => {
      controller.value?.setOptions({ arrow: resolveArrow() });
    },
    { flush: "post" },
  );

  watch(
    () => toValue(options.animation),
    (next) => {
      controller.value?.setOptions({ animation: next ?? false });
    },
    { flush: "post" },
  );

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    destroyController();
  };

  if (getCurrentScope()) {
    onScopeDispose(dispose);
  }

  return {
    isOpen,
    controller,
    contentId,
    open: (reason) => controller.value?.open(reason),
    close: (reason) => controller.value?.close(reason),
    toggle: (reason) => controller.value?.toggle(reason),
    setOpen: (next) => controller.value?.setOpen(next),
    update: () => controller.value?.update() ?? Promise.resolve(null),
    dispose,
  };
}

export type PopoverOptions = Omit<UseOverlayComponentOptions, "onSelect">;
export type TooltipOptions = PopoverOptions;
export type DialogOptions = PopoverOptions;
export type ContextMenuOptions = UseOverlayComponentOptions;

export type UsePopoverReturn = UseOverlayComponentReturn;
export type UseTooltipReturn = UseOverlayComponentReturn;
export type UseDialogReturn = UseOverlayComponentReturn;
export type UseContextMenuReturn = UseOverlayComponentReturn;

export function usePopover(options: PopoverOptions): UsePopoverReturn {
  return useOverlayComponent("popover", options);
}

export function useTooltip(options: TooltipOptions): UseTooltipReturn {
  return useOverlayComponent("tooltip", options);
}

export function useDialog(options: DialogOptions): UseDialogReturn {
  return useOverlayComponent("dialog", options);
}

export function useContextMenu(
  options: ContextMenuOptions,
): UseContextMenuReturn {
  return useOverlayComponent("context-menu", options);
}
