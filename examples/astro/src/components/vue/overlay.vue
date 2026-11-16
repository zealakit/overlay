<script setup lang="ts">
import {
  type UseOverlayComponentOptions,
  useOverlayComponent,
} from "@zealakit/overlay-vue";
import { computed, onMounted, ref, toValue, useSlots } from "vue";

/**
 * Example-only helper: one declarative wrapper over the Vue composables so the
 * cards read like the React compound components. Not part of the package.
 */
type Kind = "popover" | "tooltip" | "dialog" | "context-menu";
type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    kind: Kind;
    side?: Side;
    align?: Align;
    offset?: number;
    dir?: "ltr" | "rtl";
    /** Controlled state; leave undefined for uncontrolled. */
    open?: boolean;
    /** "body" (default), "inline", or an element to portal into. */
    portal?: "body" | "inline" | HTMLElement | null;
    flip?: boolean;
    shift?: boolean;
    modal?: boolean;
    dismissOnOutsidePress?: boolean;
    delay?: number;
    closeDelay?: number;
    contentClass?: string;
    viewportClass?: string;
    arrow?: boolean;
    arrowSize?: number;
    animation?: UseOverlayComponentOptions["animation"];
    /** Dialog only: render the dimmed backdrop. Defaults to the modal value. */
    backdrop?: boolean;
    label?: string;
  }>(),
  {
    side: undefined,
    align: undefined,
    offset: undefined,
    dir: undefined,
    open: undefined,
    portal: "body",
    flip: true,
    shift: true,
    modal: true,
    dismissOnOutsidePress: true,
    delay: undefined,
    closeDelay: undefined,
    arrow: false,
    arrowSize: 8,
    animation: undefined,
    backdrop: undefined,
    label: undefined,
  },
);

const emit = defineEmits<{
  "update:open": [open: boolean];
  select: [item: HTMLElement, event: MouseEvent];
}>();

const slots = useSlots();
const triggerHost = ref<HTMLElement | null>(null);
const triggerElement = ref<HTMLElement | null>(null);
const contentElement = ref<HTMLElement | null>(null);
const rootElement = ref<HTMLElement | null>(null);
const arrowElement = ref<HTMLElement | null>(null);

const isDialog = computed(() => props.kind === "dialog");
const isModalDialog = computed(() => isDialog.value && props.modal);
const showBackdrop = computed(() => props.backdrop ?? props.modal);

onMounted(() => {
  triggerElement.value = triggerHost.value?.firstElementChild
    ? (triggerHost.value.firstElementChild as HTMLElement)
    : triggerHost.value;
});

const placement = computed(() =>
  props.side
    ? (`${props.side}-${props.align ?? "center"}` as const)
    : undefined,
);

const overlay = useOverlayComponent(props.kind, {
  trigger: triggerElement,
  content: contentElement,
  backdrop: () => (isModalDialog.value ? rootElement.value : null),
  open: () => props.open,
  placement,
  offset: () => props.offset,
  dir: () => props.dir,
  flip: () => props.flip,
  shift: () => props.shift,
  modal: props.modal,
  dismissOnOutsidePress: props.dismissOnOutsidePress,
  delay: props.delay,
  closeDelay: props.closeDelay,
  portal:
    props.kind === "dialog" || props.portal === "inline"
      ? null
      : props.portal === "body"
        ? typeof document === "undefined"
          ? null
          : document.body
        : props.portal,
  arrow: () =>
    props.arrow ? { element: arrowElement, size: props.arrowSize } : null,
  animation: () => toValue(props.animation),
  onOpenChange: (open) => emit("update:open", open),
  onSelect: (item, event) => emit("select", item, event),
});

const close = (): void => overlay.close();
defineExpose({ open: () => overlay.open(), close, isOpen: overlay.isOpen });

const nonModalStyle = computed(() =>
  isDialog.value && !props.modal
    ? {
        position: "fixed" as const,
        right: "24px",
        bottom: "24px",
        zIndex: 72,
      }
    : undefined,
);
</script>

<template>
  <!-- Without a trigger slot (controlled usage) a hidden element stands in. -->
  <span
    ref="triggerHost"
    :style="slots.trigger ? 'display: contents' : 'display: none'"
  >
    <slot name="trigger" :is-open="overlay.isOpen.value" />
  </span>

  <div v-if="isModalDialog" ref="rootElement" hidden>
    <div v-if="showBackdrop" data-dialog-backdrop></div>
    <div data-dialog-viewport :class="viewportClass">
      <div
        ref="contentElement"
        hidden
        :class="contentClass"
        :aria-label="label"
        :dir="dir"
      >
        <slot :close="close" :is-open="overlay.isOpen.value" />
      </div>
    </div>
  </div>
  <div
    v-else
    ref="contentElement"
    hidden
    :class="contentClass"
    :style="nonModalStyle"
    :aria-label="label"
    :dir="dir"
  >
    <slot :close="close" :is-open="overlay.isOpen.value" />
    <span v-if="arrow" ref="arrowElement"></span>
  </div>
</template>
