import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
  useId,
  type Component,
  type InjectionKey,
  type PropType,
  type Ref,
  type ShallowRef,
} from "vue";
import type {
  AnimationSetting,
  OverlayChangeReason,
  OverlayControllerKind,
  Placement,
  PositionerBoundary,
  Strategy,
} from "@zealakit/overlay-core";
import { useOverlayComponent } from "../composables/use-overlay-component.js";

type ElementRef = ShallowRef<HTMLElement | null>;
type Tag = string | Component;

/** State shared by every part of one overlay (Popover, Tooltip, Dialog, ContextMenu). */
export type OverlayPartsContext = {
  kind: OverlayControllerKind;
  isOpen: Ref<boolean>;
  triggerEl: ElementRef;
  contentEl: ElementRef;
  backdropEl: ElementRef;
  arrowEl: ElementRef;
  titleId: ShallowRef<string | null>;
  descriptionId: ShallowRef<string | null>;
  open(reason?: OverlayChangeReason): void;
  close(reason?: OverlayChangeReason): void;
  toggle(reason?: OverlayChangeReason): void;
};

const contextKeys = new Map<string, InjectionKey<OverlayPartsContext>>();

function contextKey(prefix: string): InjectionKey<OverlayPartsContext> {
  let key = contextKeys.get(prefix);
  if (!key) {
    key = Symbol(prefix);
    contextKeys.set(prefix, key);
  }
  return key;
}

function toElement(value: unknown): HTMLElement | null {
  if (!value) {
    return null;
  }
  const candidate = (value as { $el?: unknown }).$el ?? value;
  return candidate instanceof HTMLElement ? candidate : null;
}

const optionalBoolean = { type: Boolean, default: undefined };

const rootProps = {
  open: optionalBoolean,
  defaultOpen: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placement: String as PropType<Placement>,
  offset: Number,
  alignOffset: Number,
  flip: optionalBoolean,
  shift: optionalBoolean,
  padding: Number,
  boundary: [String, Object] as PropType<PositionerBoundary>,
  strategy: String as PropType<Strategy>,
  autoUpdate: optionalBoolean,
  dir: String as PropType<"ltr" | "rtl">,
  dismissOnEscape: { type: Boolean, default: true },
  dismissOnOutsidePress: { type: Boolean, default: true },
  portal: {
    type: [Boolean, Object] as PropType<boolean | HTMLElement>,
    default: true,
  },
  animation: {
    type: [Boolean, Object] as PropType<AnimationSetting>,
    default: undefined,
  },
  arrow: { type: Boolean, default: false },
  arrowSize: { type: Number, default: 8 },
  arrowPadding: { type: Number, default: 0 },
} as const;

const kindProps = {
  popover: {
    trapFocus: optionalBoolean,
    initialFocus: {
      type: [Boolean, String, Object] as PropType<
        boolean | "container" | "first" | Element | null
      >,
      default: undefined,
    },
    restoreFocus: { type: Boolean, default: true },
  },
  tooltip: {
    delay: { type: Number, default: 500 },
    closeDelay: { type: Number, default: 100 },
    hoverableContent: { type: Boolean, default: true },
  },
  dialog: {
    modal: { type: Boolean, default: true },
    lockScroll: optionalBoolean,
    trapFocus: optionalBoolean,
    initialFocus: {
      type: [Boolean, String, Object] as PropType<
        boolean | "container" | "first" | Element | null
      >,
      default: undefined,
    },
    restoreFocus: { type: Boolean, default: true },
  },
  "context-menu": {},
} as const;

function createRoot(prefix: string, kind: OverlayControllerKind) {
  const key = contextKey(prefix);
  return defineComponent({
    name: prefix,
    props: { ...rootProps, ...kindProps[kind] },
    emits: {
      "update:open": (_open: boolean) => true,
      openChange: (_open: boolean, _reason: OverlayChangeReason) => true,
    },
    setup(props, { slots, emit, expose }) {
      // Props differ per kind, so read them loosely.
      // biome-ignore lint/suspicious/noExplicitAny: kind-specific prop sets
      const p = props as unknown as Record<string, any>;
      const triggerEl: ElementRef = shallowRef(null);
      const contentEl: ElementRef = shallowRef(null);
      const backdropEl: ElementRef = shallowRef(null);
      const arrowEl: ElementRef = shallowRef(null);
      const titleId = shallowRef<string | null>(null);
      const descriptionId = shallowRef<string | null>(null);

      const overlay = useOverlayComponent(kind, {
        trigger: triggerEl,
        content: contentEl,
        backdrop: backdropEl,
        open: () => p.open,
        placement: () => p.placement,
        offset: () => p.offset,
        alignOffset: () => p.alignOffset,
        flip: () => p.flip,
        shift: () => p.shift,
        padding: () => p.padding,
        boundary: () => p.boundary,
        strategy: () => p.strategy,
        autoUpdate: () => p.autoUpdate,
        dir: () => p.dir,
        animation: () => p.animation,
        arrow: () =>
          p.arrow
            ? {
                element: arrowEl,
                size: () => p.arrowSize,
                padding: () => p.arrowPadding,
              }
            : null,
        // Read once when the controller is created (client only).
        get defaultOpen() {
          return p.defaultOpen;
        },
        get disabled() {
          return p.disabled;
        },
        get dismissOnEscape() {
          return p.dismissOnEscape;
        },
        get dismissOnOutsidePress() {
          return p.dismissOnOutsidePress;
        },
        get portal() {
          if (typeof document === "undefined" || p.portal === false) {
            return null;
          }
          return p.portal === true ? document.body : p.portal;
        },
        get delay() {
          return p.delay;
        },
        get closeDelay() {
          return p.closeDelay;
        },
        get hoverableContent() {
          return p.hoverableContent;
        },
        get modal() {
          return p.modal;
        },
        get lockScroll() {
          return p.lockScroll;
        },
        get trapFocus() {
          return p.trapFocus;
        },
        get initialFocus() {
          return p.initialFocus;
        },
        get restoreFocus() {
          return p.restoreFocus;
        },
        onOpenChange(open, reason) {
          emit("update:open", open);
          emit("openChange", open, reason);
        },
      });

      provide(key, {
        kind,
        isOpen: overlay.isOpen,
        triggerEl,
        contentEl,
        backdropEl,
        arrowEl,
        titleId,
        descriptionId,
        open: overlay.open,
        close: overlay.close,
        toggle: overlay.toggle,
      });
      expose({
        open: overlay.open,
        close: overlay.close,
        toggle: overlay.toggle,
        update: overlay.update,
      });

      return () => slots.default?.({ open: overlay.isOpen.value });
    },
  });
}

function useContext(prefix: string, part: string): OverlayPartsContext {
  const context = inject(contextKey(prefix), null);
  if (!context) {
    throw new Error(`[overlay-vue] <${part}> must be used inside <${prefix}>.`);
  }
  return context;
}

function createElementPart(
  prefix: string,
  part: string,
  options: {
    defaultTag: Tag;
    slot: "triggerEl" | "contentEl" | "backdropEl" | "arrowEl";
    attrs?: (context: OverlayPartsContext) => Record<string, unknown>;
  },
) {
  return defineComponent({
    name: part,
    inheritAttrs: false,
    props: {
      as: {
        type: [String, Object] as PropType<Tag>,
        default: options.defaultTag,
      },
    },
    setup(props, { slots, attrs }) {
      const context = useContext(prefix, part);
      const setRef = (value: unknown): void => {
        context[options.slot].value = toElement(value);
      };
      onBeforeUnmount(() => {
        context[options.slot].value = null;
      });
      return () =>
        h(
          props.as,
          { ...options.attrs?.(context), ...attrs, ref: setRef },
          slots.default?.({ open: context.isOpen.value }),
        );
    },
  });
}

function createLabelPart(
  prefix: string,
  part: string,
  tag: string,
  field: "titleId" | "descriptionId",
) {
  return defineComponent({
    name: part,
    inheritAttrs: false,
    setup(_props, { slots, attrs }) {
      const context = useContext(prefix, part);
      const generated = useId();
      const id = (): string => (attrs.id as string | undefined) ?? generated;
      onMounted(() => {
        context[field].value = id();
      });
      onBeforeUnmount(() => {
        context[field].value = null;
      });
      return () => h(tag, { ...attrs, id: id() }, slots.default?.());
    },
  });
}

function createCloseButton(prefix: string, part: string) {
  return defineComponent({
    name: part,
    inheritAttrs: false,
    props: {
      as: { type: [String, Object] as PropType<Tag>, default: "button" },
    },
    setup(props, { slots, attrs }) {
      const context = useContext(prefix, part);
      return () =>
        h(
          props.as,
          {
            type: props.as === "button" ? "button" : undefined,
            ...attrs,
            onClick: (event: MouseEvent) => {
              (attrs.onClick as ((event: MouseEvent) => void) | undefined)?.(
                event,
              );
              if (!event.defaultPrevented) {
                context.close("programmatic");
              }
            },
          },
          slots.default?.(),
        );
    },
  });
}

function createPlainPart(
  part: string,
  tag: string,
  extra?: Record<string, unknown>,
) {
  return defineComponent({
    name: part,
    inheritAttrs: false,
    props: { as: { type: [String, Object] as PropType<Tag>, default: tag } },
    setup(props, { slots, attrs }) {
      return () => h(props.as, { ...extra, ...attrs }, slots.default?.());
    },
  });
}

/** Parts shared by Popover, Tooltip, and Dialog: root, trigger, content, arrow. */
function createBaseParts(
  prefix: string,
  kind: OverlayControllerKind,
  triggerTag: Tag,
  contentAttrs?: (context: OverlayPartsContext) => Record<string, unknown>,
) {
  return {
    Root: createRoot(prefix, kind),
    Trigger: createElementPart(prefix, `${prefix}Trigger`, {
      defaultTag: triggerTag,
      slot: "triggerEl",
      attrs: () =>
        triggerTag === "button" ? { type: "button" } : { tabindex: 0 },
    }),
    Content: createElementPart(prefix, `${prefix}Content`, {
      defaultTag: "div",
      slot: "contentEl",
      attrs: (context) => ({
        // Rendered once; the controller owns `hidden` afterwards.
        hidden: true,
        ...contentAttrs?.(context),
      }),
    }),
  };
}

const labelAttrs = (context: OverlayPartsContext): Record<string, unknown> => ({
  "aria-labelledby": context.titleId.value ?? undefined,
  "aria-describedby": context.descriptionId.value ?? undefined,
});

const popoverBase = createBaseParts("Popover", "popover", "button", labelAttrs);
export const Popover = popoverBase.Root;
export const PopoverTrigger = popoverBase.Trigger;
export const PopoverContent = popoverBase.Content;
export const PopoverArrow = createElementPart("Popover", "PopoverArrow", {
  defaultTag: "div",
  slot: "arrowEl",
  attrs: () => ({ "aria-hidden": "true" }),
});
export const PopoverHeader = createPlainPart("PopoverHeader", "div");
export const PopoverTitle = createLabelPart(
  "Popover",
  "PopoverTitle",
  "h2",
  "titleId",
);
export const PopoverDescription = createLabelPart(
  "Popover",
  "PopoverDescription",
  "p",
  "descriptionId",
);
export const PopoverClose = createCloseButton("Popover", "PopoverClose");

const tooltipBase = createBaseParts("Tooltip", "tooltip", "button");
export const Tooltip = tooltipBase.Root;
export const TooltipTrigger = tooltipBase.Trigger;
export const TooltipContent = tooltipBase.Content;
export const TooltipArrow = createElementPart("Tooltip", "TooltipArrow", {
  defaultTag: "div",
  slot: "arrowEl",
  attrs: () => ({ "aria-hidden": "true" }),
});

const dialogBase = createBaseParts("Dialog", "dialog", "button", labelAttrs);
export const Dialog = dialogBase.Root;
export const DialogTrigger = dialogBase.Trigger;
export const DialogContent = dialogBase.Content;
export const DialogBackdrop = createElementPart("Dialog", "DialogBackdrop", {
  defaultTag: "div",
  slot: "backdropEl",
  attrs: () => ({ hidden: true, "aria-hidden": "true" }),
});
export const DialogHeader = createPlainPart("DialogHeader", "div");
export const DialogFooter = createPlainPart("DialogFooter", "div");
export const DialogTitle = createLabelPart(
  "Dialog",
  "DialogTitle",
  "h2",
  "titleId",
);
export const DialogDescription = createLabelPart(
  "Dialog",
  "DialogDescription",
  "p",
  "descriptionId",
);
export const DialogClose = createCloseButton("Dialog", "DialogClose");

const contextMenuBase = createBaseParts("ContextMenu", "context-menu", "div");
export const ContextMenu = contextMenuBase.Root;
export const ContextMenuTrigger = contextMenuBase.Trigger;
export const ContextMenuContent = contextMenuBase.Content;
export const ContextMenuGroup = createPlainPart("ContextMenuGroup", "div", {
  role: "group",
});
export const ContextMenuLabel = createPlainPart("ContextMenuLabel", "div");
export const ContextMenuSeparator = createPlainPart(
  "ContextMenuSeparator",
  "hr",
);
export const ContextMenuShortcut = createPlainPart(
  "ContextMenuShortcut",
  "span",
  { "aria-hidden": "true" },
);

export const ContextMenuItem = defineComponent({
  name: "ContextMenuItem",
  inheritAttrs: false,
  props: {
    disabled: { type: Boolean, default: false },
    closeOnSelect: { type: Boolean, default: true },
    as: { type: [String, Object] as PropType<Tag>, default: "div" },
  },
  emits: { select: (_event: MouseEvent) => true },
  setup(props, { slots, attrs, emit }) {
    useContext("ContextMenu", "ContextMenuItem");
    return () =>
      h(
        props.as,
        {
          role: "menuitem",
          tabindex: -1,
          ...attrs,
          "aria-disabled": props.disabled ? "true" : undefined,
          "data-disabled": props.disabled ? "" : undefined,
          "data-keep-open": props.closeOnSelect ? undefined : "",
          onClick: (event: MouseEvent) => {
            if (props.disabled) {
              event.preventDefault();
              return;
            }
            emit("select", event);
          },
        },
        slots.default?.(),
      );
  },
});
