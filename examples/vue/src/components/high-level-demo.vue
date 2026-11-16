<script setup lang="ts">
import { ref } from "vue";
import type { Placement } from "@zealakit/overlay-vue";
import {
  useContextMenu,
  useDialog,
  usePopover,
  useTooltip,
} from "@zealakit/overlay-vue";

const popoverTrigger = ref<HTMLElement | null>(null);
const popoverContent = ref<HTMLElement | null>(null);
const popover = usePopover({
  trigger: popoverTrigger,
  content: popoverContent,
  placement: "bottom-start",
  offset: 8,
  portal: document.body,
});
const placement = ref<Placement>("bottom-start");
const placements: Placement[] = ["bottom-start", "bottom-end", "top", "right"];
let placementIndex = 0;
const cyclePlacement = (): void => {
  placementIndex = (placementIndex + 1) % placements.length;
  placement.value = placements[placementIndex] ?? "bottom-start";
  popover.controller.value?.setOptions({ placement: placement.value });
};

const tooltipTrigger = ref<HTMLElement | null>(null);
const tooltipContent = ref<HTMLElement | null>(null);
useTooltip({
  trigger: tooltipTrigger,
  content: tooltipContent,
  placement: "top",
  offset: 6,
  delay: 200,
  closeDelay: 80,
  portal: document.body,
});

const dialogTrigger = ref<HTMLElement | null>(null);
const dialogBackdrop = ref<HTMLElement | null>(null);
const dialogContent = ref<HTMLElement | null>(null);
const dialog = useDialog({
  trigger: dialogTrigger,
  content: dialogContent,
  backdrop: dialogBackdrop,
  portal: document.body,
  modal: true,
  labelledBy: "vue-dialog-title",
});

const nestedTrigger = ref<HTMLElement | null>(null);
const nestedContent = ref<HTMLElement | null>(null);
const nested = usePopover({
  trigger: nestedTrigger,
  content: nestedContent,
  placement: "bottom-start",
  offset: 6,
});

const contextTarget = ref<HTMLElement | null>(null);
const contextContent = ref<HTMLElement | null>(null);
const contextStatus = ref("Nothing selected");
useContextMenu({
  trigger: contextTarget,
  content: contextContent,
  portal: document.body,
  onSelect: (item) => {
    contextStatus.value = `Selected: ${item.textContent?.trim()}`;
  },
});

const controlledOpen = ref(false);
const controlledTrigger = ref<HTMLElement | null>(null);
const controlledContent = ref<HTMLElement | null>(null);
const controlled = usePopover({
  trigger: controlledTrigger,
  content: controlledContent,
  placement: "bottom-start",
  portal: document.body,
  open: controlledOpen,
  onOpenChange: (open) => {
    controlledOpen.value = open;
  },
});
const setControlledOpen = (open: boolean): void => {
  controlledOpen.value = open;
  controlled.setOpen(open);
};

const rtlTrigger = ref<HTMLElement | null>(null);
const rtlContent = ref<HTMLElement | null>(null);
usePopover({
  trigger: rtlTrigger,
  content: rtlContent,
  placement: "bottom-start",
  dir: "rtl",
  portal: document.body,
});
</script>

<template>
  <section class="demo">
    <h2>9–16. High-level component composables</h2>
    <p class="copy">
      <code>usePopover()</code>, <code>useTooltip()</code>,
      <code>useDialog()</code>, and <code>useContextMenu()</code> manage DOM,
      layers, focus, and ARIA; consumers own markup and styling.
    </p>

    <div class="demo-grid">
      <div class="demo-card">
        <h3>Popover + placement</h3>
        <button id="hl-popover-trigger" ref="popoverTrigger" type="button">Open popover</button>
        <button id="hl-placement" type="button" @click="cyclePlacement">
          Placement: {{ placement }}
        </button>
        <div id="hl-popover-content" ref="popoverContent" class="popover-surface" hidden>
          <p>Portaled Vue popover.</p>
          <button type="button" @click="popover.close()">Close</button>
        </div>
      </div>

      <div class="demo-card">
        <h3>Tooltip</h3>
        <button id="hl-tooltip-trigger" ref="tooltipTrigger" type="button">Hover or focus</button>
        <div id="hl-tooltip-content" ref="tooltipContent" class="tooltip-surface" hidden>
          A concise informational hint.
        </div>
      </div>

      <div class="demo-card">
        <h3>Dialog + nested popover</h3>
        <button id="hl-dialog-trigger" ref="dialogTrigger" type="button">Open dialog</button>
        <div id="hl-dialog-backdrop" ref="dialogBackdrop" class="dialog-backdrop" hidden></div>
        <div id="hl-dialog-content" ref="dialogContent" class="dialog-surface" hidden>
          <h2 id="vue-dialog-title">Vue dialog</h2>
          <p>Focus is contained; Escape and backdrop dismiss.</p>
          <button id="hl-nested-trigger" ref="nestedTrigger" type="button">Open nested popover</button>
          <div id="hl-nested-content" ref="nestedContent" class="popover-surface" hidden>
            <p>Nested popover inside the dialog.</p>
            <button type="button" @click="nested.close()">Close nested</button>
          </div>
          <button type="button" @click="dialog.close()">Close dialog</button>
        </div>
      </div>

      <div class="demo-card">
        <h3>ContextMenu</h3>
        <div id="hl-context-target" ref="contextTarget" class="context-target" tabindex="0">
          Right-click this target
        </div>
        <div id="hl-context-content" ref="contextContent" class="context-surface" hidden>
          <div role="menuitem" tabindex="-1">Copy</div>
          <div role="menuitem" tabindex="-1">Paste</div>
          <div role="menuitem" tabindex="-1" aria-disabled="true">Unavailable</div>
        </div>
        <p class="status">{{ contextStatus }}</p>
      </div>

      <div class="demo-card">
        <h3>Controlled popover</h3>
        <button id="hl-controlled-open" type="button" @click="setControlledOpen(true)">Open</button>
        <button id="hl-controlled-close" type="button" @click="setControlledOpen(false)">Close</button>
        <button id="hl-controlled-trigger" ref="controlledTrigger" type="button">Toggle controlled</button>
        <p id="hl-controlled-state" class="status">{{ controlledOpen ? "open" : "closed" }}</p>
        <div id="hl-controlled-content" ref="controlledContent" class="popover-surface" hidden>
          <p>Visibility is controlled by Vue state.</p>
        </div>
      </div>

      <div class="demo-card">
        <h3>RTL popover</h3>
        <div dir="rtl">
          <button id="hl-rtl-trigger" ref="rtlTrigger" type="button">افتح</button>
          <div id="hl-rtl-content" ref="rtlContent" class="popover-surface" hidden>
            <p>محتوى من اليمين إلى اليسار.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
