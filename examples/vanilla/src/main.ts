import {
  type LayerHandle,
  type Placement,
  createContextMenu,
  createDialog,
  createFloating,
  createLayerStack,
  createOverlay,
  createPopover,
  createTooltip,
  focusElement,
  focusFirst,
} from "@zealakit/overlay-vanilla";
import "./styles.css";

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Example markup is missing ${selector}`);
  }
  return element;
}

// One stack per document, shared by every layer in this page.
const stack = createLayerStack();
const placements: Placement[] = [
  "bottom-start",
  "bottom-end",
  "top-start",
  "right-start",
];

/* -------------------------------------------------------------------------- */
/* 1–2. Floating positioning with dynamic updates                             */
/* -------------------------------------------------------------------------- */

const floatingTrigger = query<HTMLButtonElement>("#floating-trigger");
const floatingPanel = query<HTMLDivElement>("#floating-panel");
const floatingStatus = query<HTMLParagraphElement>("#floating-status");
const cycleButton = query<HTMLButtonElement>("#cycle-placement");
const disposeButton = query<HTMLButtonElement>("#dispose-demo");
const closeFloating = query<HTMLButtonElement>("#close-floating");

const floating = createFloating({
  reference: floatingTrigger,
  floating: floatingPanel,
  placement: placements[0],
  offset: 8,
  padding: 8,
});

floating.subscribe((result) => {
  floatingStatus.textContent = `x=${Math.round(result.x)} y=${Math.round(result.y)} placement=${result.placement}`;
});

let open = false;
let layerHandle: LayerHandle | null = null;

function setFloatingOpen(next: boolean): void {
  if (next === open) {
    return;
  }
  open = next;
  floatingPanel.hidden = !open;
  floatingPanel.dataset.state = open ? "open" : "closed";
  floatingTrigger.setAttribute("aria-expanded", String(open));

  if (open) {
    layerHandle = stack.register({
      element: floatingPanel,
      reference: floatingTrigger,
      onDismiss: () => setFloatingOpen(false),
    });
    focusFirst(floatingPanel);
  } else {
    layerHandle?.dispose();
    layerHandle = null;
    focusElement(floatingTrigger);
  }
}

floatingTrigger.addEventListener("click", () => {
  setFloatingOpen(!open);
});

closeFloating.addEventListener("click", () => {
  setFloatingOpen(false);
});

let placementIndex = 0;
cycleButton.addEventListener("click", () => {
  placementIndex = (placementIndex + 1) % placements.length;
  const placement = placements[placementIndex];
  if (!placement) {
    return;
  }

  cycleButton.textContent = `Placement: ${placement}`;
  floating.setOptions({ placement });
});

disposeButton.addEventListener("click", () => {
  setFloatingOpen(false);
  floating.dispose();
  disposeButton.disabled = true;
  cycleButton.disabled = true;
  floatingTrigger.disabled = true;
  floatingStatus.textContent = "Floating controller disposed";
});

/* -------------------------------------------------------------------------- */
/* 3–6. Overlay controller: layers, outside, Escape, cleanup                  */
/* -------------------------------------------------------------------------- */

const overlayTrigger = query<HTMLButtonElement>("#overlay-trigger");
const overlayPanel = query<HTMLDivElement>("#overlay-panel");
const destroyButton = query<HTMLButtonElement>("#destroy-overlay");

const overlay = createOverlay({
  reference: overlayTrigger,
  floating: overlayPanel,
  stack,
  placement: "bottom-start",
  offset: 8,
  portal: document.body,
  onOpenChange: (isOpen) => {
    overlayTrigger.setAttribute("aria-expanded", String(isOpen));
  },
});

overlayTrigger.setAttribute("aria-expanded", "false");

destroyButton.addEventListener("click", () => {
  overlay.destroy();
  destroyButton.disabled = true;
  overlayTrigger.disabled = true;
});

window.addEventListener(
  "pagehide",
  () => {
    setFloatingOpen(false);
    floating.dispose();
    overlay.destroy();
    stack.dispose();
  },
  { once: true },
);

/* -------------------------------------------------------------------------- */
/* 7–14. High-level component controllers                                     */
/* -------------------------------------------------------------------------- */

const highLevel = [
  ["hl-popover-trigger", HTMLButtonElement],
  ["hl-popover-content", HTMLDivElement],
  ["hl-popover-close", HTMLButtonElement],
  ["hl-tooltip-trigger", HTMLButtonElement],
  ["hl-tooltip-content", HTMLDivElement],
  ["hl-dialog-trigger", HTMLButtonElement],
  ["hl-dialog-backdrop", HTMLDivElement],
  ["hl-dialog-content", HTMLDivElement],
  ["hl-dialog-close", HTMLButtonElement],
  ["hl-nested-trigger", HTMLButtonElement],
  ["hl-nested-content", HTMLDivElement],
  ["hl-nested-close", HTMLButtonElement],
  ["hl-context-target", HTMLDivElement],
  ["hl-context-content", HTMLDivElement],
  ["hl-controlled-open", HTMLButtonElement],
  ["hl-controlled-close", HTMLButtonElement],
  ["hl-controlled-trigger", HTMLButtonElement],
  ["hl-controlled-content", HTMLDivElement],
  ["hl-controlled-state", HTMLParagraphElement],
  ["hl-rtl-trigger", HTMLButtonElement],
  ["hl-rtl-content", HTMLDivElement],
  ["hl-placement", HTMLButtonElement],
] as const;

const high = Object.fromEntries(
  highLevel.map(([id]) => [id, query<HTMLElement>(`#${id}`)]),
) as Record<(typeof highLevel)[number][0], HTMLElement>;

const popover = createPopover({
  trigger: high["hl-popover-trigger"],
  content: high["hl-popover-content"],
  placement: "bottom-start",
  offset: 8,
  portal: document.body,
});
high["hl-popover-close"].addEventListener("click", () => popover.close());
const highPlacements: Placement[] = [
  "bottom-start",
  "bottom-end",
  "top",
  "right",
];
let highPlacementIndex = 0;
high["hl-placement"].addEventListener("click", () => {
  highPlacementIndex = (highPlacementIndex + 1) % highPlacements.length;
  const placement = highPlacements[highPlacementIndex] ?? "bottom-start";
  high["hl-placement"].textContent = `Placement: ${placement}`;
  popover.setOptions({ placement });
});

const tooltip = createTooltip({
  trigger: high["hl-tooltip-trigger"],
  content: high["hl-tooltip-content"],
  placement: "top",
  offset: 6,
  delay: 200,
  closeDelay: 80,
  portal: document.body,
});

const dialog = createDialog({
  trigger: high["hl-dialog-trigger"],
  content: high["hl-dialog-content"],
  backdrop: high["hl-dialog-backdrop"],
  portal: document.body,
  modal: true,
  labelledBy: "hl-dialog-title",
});
high["hl-dialog-close"].addEventListener("click", () => dialog.close());

const nestedPopover = createPopover({
  trigger: high["hl-nested-trigger"],
  content: high["hl-nested-content"],
  placement: "bottom-start",
  offset: 6,
});
high["hl-nested-close"].addEventListener("click", () => nestedPopover.close());

const contextMenu = createContextMenu({
  trigger: high["hl-context-target"],
  content: high["hl-context-content"],
  portal: document.body,
  placement: "bottom-start",
  onSelect: (item) => {
    if (item.getAttribute("aria-disabled") === "true") {
      return;
    }
    high["hl-context-target"].textContent = `Selected: ${item.textContent}`;
  },
});

const controlledPopover = createPopover({
  trigger: high["hl-controlled-trigger"],
  content: high["hl-controlled-content"],
  placement: "bottom-start",
  offset: 8,
  portal: document.body,
  open: false,
  onOpenChange: (open) => {
    controlledPopover.setOpen(open);
    high["hl-controlled-state"].textContent = open ? "open" : "closed";
  },
});
high["hl-controlled-open"].addEventListener("click", () => {
  controlledPopover.setOpen(true);
  high["hl-controlled-state"].textContent = "open";
});
high["hl-controlled-close"].addEventListener("click", () => {
  controlledPopover.setOpen(false);
  high["hl-controlled-state"].textContent = "closed";
});

const rtlPopover = createPopover({
  trigger: high["hl-rtl-trigger"],
  content: high["hl-rtl-content"],
  placement: "bottom-start",
  dir: "rtl",
  offset: 8,
  portal: document.body,
});
rtlPopover.setOptions({ dir: "rtl" });

window.addEventListener(
  "pagehide",
  () => {
    popover.destroy();
    tooltip.destroy();
    dialog.destroy();
    nestedPopover.destroy();
    contextMenu.destroy();
    controlledPopover.destroy();
    rtlPopover.destroy();
  },
  { once: true },
);
