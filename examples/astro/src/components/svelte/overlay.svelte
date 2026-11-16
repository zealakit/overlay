<script lang="ts">
import {
  type PopoverController,
  type PopoverOptions,
  createContextMenu,
  createDialog,
  createPopover,
  createTooltip,
} from "@zealakit/overlay-svelte";
import { type Snippet, untrack } from "svelte";

/**
 * Example-only helper: one declarative wrapper over the Svelte controllers so
 * the cards read like the React compound components. Not part of the package.
 */
type Kind = "popover" | "tooltip" | "dialog" | "context-menu";
type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

type Props = {
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
  animation?: PopoverOptions["animation"];
  /** Dialog only: render the dimmed backdrop. Defaults to the modal value. */
  backdrop?: boolean;
  label?: string;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: HTMLElement, event: MouseEvent) => void;
  trigger?: Snippet<[{ isOpen: boolean }]>;
  children?: Snippet<[{ close: () => void; isOpen: boolean }]>;
};

let {
  kind,
  side,
  align,
  offset,
  dir,
  open,
  portal = "body",
  flip = true,
  shift = true,
  modal = true,
  dismissOnOutsidePress = true,
  delay,
  closeDelay,
  contentClass,
  viewportClass,
  arrow = false,
  arrowSize = 8,
  animation,
  backdrop,
  label,
  onOpenChange,
  onSelect,
  trigger,
  children,
}: Props = $props();

let host = $state<HTMLElement | null>(null);
let triggerElement = $state<HTMLElement | null>(null);
let contentElement = $state<HTMLElement | null>(null);
let rootElement = $state<HTMLElement | null>(null);
let arrowElement = $state<HTMLElement | null>(null);
let controller = $state<PopoverController | null>(null);
let isOpen = $state(false);

const isDialog = $derived(kind === "dialog");
const isModalDialog = $derived(isDialog && modal);
const showBackdrop = $derived(backdrop ?? modal);
const placement = $derived(
  side ? (`${side}-${align ?? "center"}` as const) : undefined,
);
const arrowOption = $derived(
  arrow && arrowElement ? { element: arrowElement, size: arrowSize } : null,
);

$effect(() => {
  triggerElement = host?.firstElementChild
    ? (host.firstElementChild as HTMLElement)
    : host;
});

// Create once the elements exist; later prop changes go through setOptions.
$effect(() => {
  if (!triggerElement || !contentElement) {
    return;
  }
  const trigger = triggerElement;
  const content = contentElement;
  const root = isModalDialog ? rootElement : null;
  if (isModalDialog && !root) {
    return;
  }
  const next = untrack(() => {
    const factory = {
      popover: createPopover,
      tooltip: createTooltip,
      dialog: createDialog,
      "context-menu": createContextMenu,
    }[kind];
    return factory({
      trigger,
      content,
      backdrop: root,
      open,
      placement,
      offset,
      dir,
      flip,
      shift,
      modal,
      dismissOnOutsidePress,
      delay,
      closeDelay,
      portal:
        kind === "dialog" || portal === "inline"
          ? null
          : portal === "body"
            ? document.body
            : portal,
      arrow: arrowOption,
      animation,
      onOpenChange: (value: boolean) => onOpenChange?.(value),
      onSelect: (item: HTMLElement, event: MouseEvent) =>
        onSelect?.(item, event),
    });
  });
  controller = next;
  const unsubscribe = next.subscribe((state) => {
    isOpen = state.isOpen;
  });
  return () => {
    unsubscribe();
    next.destroy();
    controller = null;
  };
});

$effect(() => {
  controller?.setOptions({
    placement,
    offset,
    dir,
    flip,
    shift,
    animation: animation ?? false,
    arrow: arrowOption,
  });
});

$effect(() => {
  if (open !== undefined) {
    controller?.setOpen(open);
  }
});

const close = (): void => controller?.close();

const nonModalStyle = $derived(
  isDialog && !modal
    ? "position: fixed; right: 24px; bottom: 24px; z-index: 72;"
    : undefined,
);
</script>

<!-- Without a trigger snippet (controlled usage) a hidden element stands in. -->
<span bind:this={host} style={trigger ? "display: contents" : "display: none"}>
  {@render trigger?.({ isOpen })}
</span>

{#if isModalDialog}
  <div bind:this={rootElement} hidden>
    {#if showBackdrop}<div data-dialog-backdrop></div>{/if}
    <div data-dialog-viewport class={viewportClass}>
      <div
        bind:this={contentElement}
        hidden
        class={contentClass}
        aria-label={label}
        {dir}
      >
        {@render children?.({ close, isOpen })}
      </div>
    </div>
  </div>
{:else}
  <div
    bind:this={contentElement}
    hidden
    class={contentClass}
    style={nonModalStyle}
    aria-label={label}
    {dir}
  >
    {@render children?.({ close, isOpen })}
    {#if arrow}<span bind:this={arrowElement}></span>{/if}
  </div>
{/if}
