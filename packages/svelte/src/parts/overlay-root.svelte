<script lang="ts">
import { untrack } from "svelte";
import {
  createOverlayController,
  type OverlayController,
} from "@zealakit/overlay-core";
import { setOverlayContext } from "./context.js";
import type { OverlayRootProps } from "./types.js";

let {
  kind,
  open = $bindable(),
  defaultOpen = false,
  disabled = false,
  onOpenChange,
  placement,
  offset,
  alignOffset,
  flip,
  shift,
  padding,
  boundary,
  strategy,
  autoUpdate,
  dir,
  dismissOnEscape = true,
  dismissOnOutsidePress = true,
  portal = true,
  animation,
  arrow = false,
  arrowSize = 8,
  arrowPadding = 0,
  delay = 500,
  closeDelay = 100,
  hoverableContent = true,
  modal = true,
  lockScroll,
  trapFocus,
  initialFocus,
  restoreFocus = true,
  children,
}: OverlayRootProps = $props();

let triggerEl = $state.raw<HTMLElement | null>(null);
let contentEl = $state.raw<HTMLElement | null>(null);
let backdropEl = $state.raw<HTMLElement | null>(null);
let arrowEl = $state.raw<HTMLElement | null>(null);
let titleId = $state.raw<string | null>(null);
let descriptionId = $state.raw<string | null>(null);
let controller = $state.raw<OverlayController | null>(null);
let isOpen = $state(untrack(() => open ?? defaultOpen));

const arrowOptions = () =>
  arrow && arrowEl
    ? { element: arrowEl, size: arrowSize, padding: arrowPadding }
    : null;

$effect(() => {
  const trigger = triggerEl;
  const content = contentEl;
  const backdrop = backdropEl;
  if (!trigger || !content) {
    return;
  }
  const next = untrack(() =>
    createOverlayController({
      kind,
      trigger,
      content,
      backdrop,
      open,
      defaultOpen,
      disabled,
      placement,
      offset,
      alignOffset,
      flip,
      shift,
      padding,
      boundary,
      strategy,
      autoUpdate,
      dir,
      dismissOnEscape,
      dismissOnOutsidePress,
      portal:
        portal === false ? null : portal === true ? document.body : portal,
      animation,
      arrow: arrowOptions(),
      delay,
      closeDelay,
      hoverableContent,
      modal,
      lockScroll,
      trapFocus,
      initialFocus,
      restoreFocus,
      onOpenChange: (value, reason) => {
        isOpen = value;
        if (open !== undefined) {
          open = value;
        }
        onOpenChange?.(value, reason);
      },
    }),
  );
  controller = next;
  isOpen = next.isOpen;
  const stop = next.subscribe((state) => {
    isOpen = state.isOpen;
  });
  return () => {
    stop();
    next.destroy();
    controller = null;
  };
});

$effect(() => {
  const value = open;
  untrack(() => {
    if (value !== undefined) {
      controller?.setOpen(value);
    }
  });
});

$effect(() => {
  const patch = {
    placement,
    offset,
    alignOffset,
    flip,
    shift,
    padding,
    boundary,
    strategy,
    autoUpdate,
    dir,
    animation: animation ?? false,
  };
  untrack(() => controller?.setOptions(patch));
});

$effect(() => {
  const next = arrowOptions();
  untrack(() => controller?.setOptions({ arrow: next }));
});

setOverlayContext({
  get kind() {
    return kind;
  },
  get isOpen() {
    return isOpen;
  },
  get titleId() {
    return titleId;
  },
  get descriptionId() {
    return descriptionId;
  },
  setTrigger: (element) => (triggerEl = element),
  setContent: (element) => (contentEl = element),
  setBackdrop: (element) => (backdropEl = element),
  setArrow: (element) => (arrowEl = element),
  setTitleId: (id) => (titleId = id),
  setDescriptionId: (id) => (descriptionId = id),
  open: (reason) => controller?.open(reason),
  close: (reason) => controller?.close(reason),
  toggle: (reason) => controller?.toggle(reason),
});
</script>

{@render children?.({ open: isOpen })}
