<script lang="ts">
import { onDestroy, onMount } from "svelte";
import type { Placement } from "@zealakit/overlay-svelte";
import {
  createContextMenu,
  createDialog,
  createPopover,
  createTooltip,
  type ContextMenuController,
  type DialogController,
  type PopoverController,
  type TooltipController,
} from "@zealakit/overlay-svelte";

let popoverTrigger: HTMLButtonElement;
let popoverContent: HTMLDivElement;
let tooltipTrigger: HTMLButtonElement;
let tooltipContent: HTMLDivElement;
let dialogTrigger: HTMLButtonElement;
let dialogBackdrop: HTMLDivElement;
let dialogContent: HTMLDivElement;
let nestedTrigger: HTMLButtonElement;
let nestedContent: HTMLDivElement;
let contextTarget: HTMLDivElement;
let contextContent: HTMLDivElement;
let controlledTrigger: HTMLButtonElement;
let controlledContent: HTMLDivElement;
let rtlTrigger: HTMLButtonElement;
let rtlContent: HTMLDivElement;

let popover: PopoverController | null = null;
let tooltip: TooltipController | null = null;
let dialog: DialogController | null = null;
let nested: PopoverController | null = null;
let contextMenu: ContextMenuController | null = null;
let controlled: PopoverController | null = null;
let rtl: PopoverController | null = null;

const placements: Placement[] = ["bottom-start", "bottom-end", "top", "right"];
let placement = $state<Placement>("bottom-start");
let placementIndex = 0;
let contextStatus = $state("Nothing selected");
let controlledOpen = $state(false);

onMount(() => {
  popover = createPopover({
    trigger: popoverTrigger,
    content: popoverContent,
    placement,
    offset: 8,
    portal: document.body,
  });
  tooltip = createTooltip({
    trigger: tooltipTrigger,
    content: tooltipContent,
    placement: "top",
    offset: 6,
    delay: 200,
    closeDelay: 80,
    portal: document.body,
  });
  dialog = createDialog({
    trigger: dialogTrigger,
    content: dialogContent,
    backdrop: dialogBackdrop,
    portal: document.body,
    modal: true,
    labelledBy: "svelte-dialog-title",
  });
  nested = createPopover({
    trigger: nestedTrigger,
    content: nestedContent,
    placement: "bottom-start",
    offset: 6,
  });
  contextMenu = createContextMenu({
    trigger: contextTarget,
    content: contextContent,
    portal: document.body,
    onSelect: (item) => {
      contextStatus = `Selected: ${item.textContent?.trim()}`;
    },
  });
  controlled = createPopover({
    trigger: controlledTrigger,
    content: controlledContent,
    placement: "bottom-start",
    portal: document.body,
    open: false,
    onOpenChange: (open) => {
      controlledOpen = open;
      controlled?.setOpen(open);
    },
  });
  rtl = createPopover({
    trigger: rtlTrigger,
    content: rtlContent,
    placement: "bottom-start",
    dir: "rtl",
    portal: document.body,
  });
});

onDestroy(() => {
  popover?.destroy();
  tooltip?.destroy();
  dialog?.destroy();
  nested?.destroy();
  contextMenu?.destroy();
  controlled?.destroy();
  rtl?.destroy();
});

const cyclePlacement = (): void => {
  placementIndex = (placementIndex + 1) % placements.length;
  placement = placements[placementIndex] ?? "bottom-start";
  popover?.setOptions({ placement });
};

const setControlledOpen = (open: boolean): void => {
  controlledOpen = open;
  controlled?.setOpen(open);
};
</script>

<section class="demo">
  <h2>9–16. High-level component controllers</h2>
  <p class="copy">
    <code>createPopover()</code>, <code>createTooltip()</code>,
    <code>createDialog()</code>, and <code>createContextMenu()</code> return
    Svelte-readable controllers with explicit lifecycle.
  </p>

  <div class="demo-grid">
    <div class="demo-card">
      <h3>Popover + placement</h3>
      <button id="hl-popover-trigger" bind:this={popoverTrigger} type="button">Open popover</button>
      <button id="hl-placement" type="button" onclick={cyclePlacement}>
        Placement: {placement}
      </button>
      <div id="hl-popover-content" bind:this={popoverContent} class="popover-surface" hidden>
        <p>Portaled Svelte popover.</p>
        <button type="button" onclick={() => popover?.close()}>Close</button>
      </div>
    </div>

    <div class="demo-card">
      <h3>Tooltip</h3>
      <button id="hl-tooltip-trigger" bind:this={tooltipTrigger} type="button">Hover or focus</button>
      <div id="hl-tooltip-content" bind:this={tooltipContent} class="tooltip-surface" hidden>
        A concise informational hint.
      </div>
    </div>

    <div class="demo-card">
      <h3>Dialog + nested popover</h3>
      <button id="hl-dialog-trigger" bind:this={dialogTrigger} type="button">Open dialog</button>
      <div id="hl-dialog-backdrop" bind:this={dialogBackdrop} class="dialog-backdrop" hidden></div>
      <div id="hl-dialog-content" bind:this={dialogContent} class="dialog-surface" hidden>
        <h2 id="svelte-dialog-title">Svelte dialog</h2>
        <p>Focus is contained; Escape and backdrop dismiss.</p>
        <button id="hl-nested-trigger" bind:this={nestedTrigger} type="button">Open nested popover</button>
        <div id="hl-nested-content" bind:this={nestedContent} class="popover-surface" hidden>
          <p>Nested popover inside the dialog.</p>
          <button type="button" onclick={() => nested?.close()}>Close nested</button>
        </div>
        <button type="button" onclick={() => dialog?.close()}>Close dialog</button>
      </div>
    </div>

    <div class="demo-card">
      <h3>ContextMenu</h3>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div id="hl-context-target" bind:this={contextTarget} class="context-target" tabindex="0">
        Right-click this target
      </div>
      <div id="hl-context-content" bind:this={contextContent} class="context-surface" hidden>
        <div role="menuitem" tabindex="-1">Copy</div>
        <div role="menuitem" tabindex="-1">Paste</div>
        <div role="menuitem" tabindex="-1" aria-disabled="true">Unavailable</div>
      </div>
      <p class="status">{contextStatus}</p>
    </div>

    <div class="demo-card">
      <h3>Controlled popover</h3>
      <button id="hl-controlled-open" type="button" onclick={() => setControlledOpen(true)}>Open</button>
      <button id="hl-controlled-close" type="button" onclick={() => setControlledOpen(false)}>Close</button>
      <button id="hl-controlled-trigger" bind:this={controlledTrigger} type="button">Toggle controlled</button>
      <p id="hl-controlled-state" class="status">{controlledOpen ? "open" : "closed"}</p>
      <div id="hl-controlled-content" bind:this={controlledContent} class="popover-surface" hidden>
        <p>Visibility is controlled by Svelte state.</p>
      </div>
    </div>

    <div class="demo-card">
      <h3>RTL popover</h3>
      <div dir="rtl">
        <button id="hl-rtl-trigger" bind:this={rtlTrigger} type="button">افتح</button>
        <div id="hl-rtl-content" bind:this={rtlContent} class="popover-surface" hidden>
          <p>محتوى من اليمين إلى اليسار.</p>
        </div>
      </div>
    </div>
  </div>
</section>
