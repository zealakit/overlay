import {
  type Placement,
  type PopoverController,
  createFloating,
  initOverlays,
} from "@zealakit/overlay-vanilla";
import "./styles.css";
import "./popover-examples.css";
import "./tooltip-examples.css";
import "./dialog-examples.css";
import "./context-menu-examples.css";
import "./arrow-animation-examples.css";

function query<T extends Element>(
  selector: string,
  root: ParentNode = document,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Example markup is missing ${selector}`);
  }
  return element;
}

// Markup such as <div data-overlay="popover"> becomes a controller. See the
// package README for the data-* attributes.
const overlays = initOverlays();

const overlay = (id: string): PopoverController => {
  const controller = overlays.get(id);
  if (!controller) {
    throw new Error(`No overlay with id ${id}`);
  }
  return controller;
};

/* -------------------------------------------------------------------------- */
/* Placement playground (createFloating)                                      */
/* -------------------------------------------------------------------------- */

const PLACEMENTS = {
  top: ["top-start", "top", "top-end"],
  right: ["right-start", "right", "right-end"],
  bottom: ["bottom-start", "bottom", "bottom-end"],
  left: ["left-start", "left", "left-end"],
} as const;

let playgroundPlacement: Placement = "bottom";
let playgroundOpen = true;
const pgGrid = query<HTMLElement>("#pg-grid");
const pgReference = query<HTMLButtonElement>("#pg-reference");
const pgPreview = query<HTMLElement>("#placement-preview");
const railButtons = new Map<Placement, HTMLButtonElement>();

for (const [side, placements] of Object.entries(PLACEMENTS)) {
  const rail = document.createElement("fieldset");
  rail.className = `placement-rail placement-rail-${side}`;
  rail.innerHTML = `<legend class="visually-hidden">${side} placements</legend>`;
  for (const placement of placements) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "placement-button";
    button.textContent = placement;
    button.addEventListener("click", () => {
      playgroundPlacement = placement;
      syncPlayground();
      void playground.update();
    });
    railButtons.set(placement, button);
    rail.append(button);
  }
  pgGrid.prepend(rail);
}

const playground = createFloating({
  reference: pgReference,
  floating: pgPreview,
  placement: playgroundPlacement,
  offset: 10,
  padding: 12,
});

let renderedPlacement: string = playgroundPlacement;

function syncPlayground(): void {
  for (const [placement, button] of railButtons) {
    button.dataset.active = String(placement === playgroundPlacement);
    button.setAttribute(
      "aria-pressed",
      String(placement === playgroundPlacement),
    );
  }
  query("#pg-placement").textContent = renderedPlacement;
  query("#pg-label").textContent = renderedPlacement;
  pgPreview.dataset.placement = renderedPlacement;
  const requested = query<HTMLElement>("#pg-requested");
  requested.hidden = renderedPlacement === playgroundPlacement;
  requested.textContent = `requested ${playgroundPlacement}`;
  playground.setOptions({ placement: playgroundPlacement });
}

playground.subscribe((result) => {
  renderedPlacement = result.placement;
  query("#pg-placement").textContent = renderedPlacement;
  query("#pg-label").textContent = renderedPlacement;
  pgPreview.dataset.placement = renderedPlacement;
  const requested = query<HTMLElement>("#pg-requested");
  requested.hidden = renderedPlacement === playgroundPlacement;
  requested.textContent = `requested ${playgroundPlacement}`;
});

function setPlaygroundOpen(open: boolean): void {
  playgroundOpen = open;
  pgPreview.hidden = !open;
  pgReference.setAttribute("aria-expanded", String(open));
  query("#pg-hint").textContent = open ? "Click to close" : "Click to open";
  playground.setReference(open ? pgReference : null);
  if (open) {
    void playground.update();
  }
}
pgReference.addEventListener("click", () => setPlaygroundOpen(!playgroundOpen));
document.addEventListener("keydown", (event) => {
  if (playgroundOpen && event.key === "Escape") {
    setPlaygroundOpen(false);
  }
});
syncPlayground();

/* -------------------------------------------------------------------------- */
/* Arrow and animation                                                        */
/* -------------------------------------------------------------------------- */

const aa = {
  arrow: query<HTMLInputElement>("#aa-arrow"),
  animate: query<HTMLInputElement>("#aa-animate"),
  type: query<HTMLSelectElement>("#aa-type"),
  direction: query<HTMLSelectElement>("#aa-direction"),
  easing: query<HTMLSelectElement>("#aa-easing"),
  duration: query<HTMLInputElement>("#aa-duration"),
};

// Custom animation: grow from the anchor with a small overshoot.
const customAnimation = {
  enter: (context: { transformOrigin: string }) => [
    { opacity: 0, scale: "0.6", transformOrigin: context.transformOrigin },
    {
      opacity: 1,
      scale: "1.06",
      offset: 0.7,
      transformOrigin: context.transformOrigin,
    },
    { opacity: 1, scale: "1", transformOrigin: context.transformOrigin },
  ],
};

const arrowSizes: Record<string, number> = {
  "aa-popover": 14,
  "aa-tooltip": 11,
};

function syncArrowAnimation(): void {
  query("#aa-duration-label").textContent = `${aa.duration.value}ms`;
  for (const id of ["aa-popover", "aa-tooltip"]) {
    const host = query<HTMLElement>(`#${id}`);
    const element = query<HTMLElement>("[data-arrow]", host);
    overlay(id).setOptions({
      arrow: aa.arrow.checked ? { element, size: arrowSizes[id] } : null,
      animation: aa.animate.checked
        ? {
            type: aa.type.value as "fade",
            direction: aa.direction.value as "auto",
            easing: aa.easing.value as "linear",
            duration: Number(aa.duration.value),
            ...(aa.type.value === "custom" ? { custom: customAnimation } : {}),
          }
        : false,
    });
  }
}
for (const control of Object.values(aa)) {
  control.addEventListener("input", syncArrowAnimation);
  control.addEventListener("change", syncArrowAnimation);
}
syncArrowAnimation();

/* -------------------------------------------------------------------------- */
/* Popover cards                                                              */
/* -------------------------------------------------------------------------- */

// B. Alignment and placement
const SIDES = ["top", "right", "bottom", "left"] as const;
const ALIGNS = ["start", "center", "end"] as const;
let plSide: (typeof SIDES)[number] = "bottom";
let plAlign: (typeof ALIGNS)[number] = "center";
const picker = query<HTMLElement>("#pl-picker");
const pickerButtons: HTMLButtonElement[] = [];
for (const side of SIDES) {
  for (const align of ALIGNS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${side}-${align}`;
    button.addEventListener("click", () => {
      plSide = side;
      plAlign = align;
      syncPlacementCard();
    });
    pickerButtons.push(button);
    picker.append(button);
  }
}
function syncPlacementCard(): void {
  query("#pl-label").textContent = `${plSide} / ${plAlign}`;
  for (const button of pickerButtons) {
    button.dataset.active = String(
      button.textContent === `${plSide}-${plAlign}`,
    );
  }
  overlay("pl-overlay").setOptions({
    placement: `${plSide}-${plAlign}` as Placement,
  });
}
syncPlacementCard();

// C. Form
query<HTMLFormElement>("#pop-form").addEventListener("submit", (event) => {
  event.preventDefault();
  query("#pop-form-status").textContent = "Submitted — the popover stays open.";
});

// K. Controlled state
const controlledHost = query<HTMLElement>("#ctl-overlay");
const controlledLog = query("#ctl-log");
controlledHost.addEventListener("overlay-change", (event) => {
  const { open, reason } = (
    event as CustomEvent<{ open: boolean; reason: string }>
  ).detail;
  controlledLog.textContent = `${open ? "open" : "closed"} · ${reason}`;
});
query("#ctl-open").addEventListener("click", () =>
  overlay("ctl-overlay").open(),
);
query("#ctl-close").addEventListener("click", () => {
  overlay("ctl-overlay").close();
  controlledLog.textContent = "closed · programmatic";
});

// L. Long and dynamic content
let itemCount = 8;
const longList = query<HTMLElement>("#long-list");
function renderItems(): void {
  longList.replaceChildren(
    ...Array.from({ length: itemCount }, (_, index) => {
      const item = document.createElement("li");
      item.textContent = `Item ${index + 1}`;
      return item;
    }),
  );
}
renderItems();
query("#long-add").addEventListener("click", () => {
  itemCount += 5;
  renderItems();
});
const longAsync = query<HTMLButtonElement>("#long-async");
longAsync.addEventListener("click", () => {
  longAsync.disabled = true;
  longAsync.textContent = "Loading…";
  window.setTimeout(() => {
    itemCount += 3;
    renderItems();
    longAsync.disabled = false;
    longAsync.textContent = "Load async items";
  }, 300);
});

/* -------------------------------------------------------------------------- */
/* Dialog cards                                                               */
/* -------------------------------------------------------------------------- */

// B. Form
query<HTMLFormElement>("#dlg-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const status = query("#dlg-status");
  const save = query<HTMLButtonElement>("#dlg-save");
  status.textContent = "Saving…";
  save.disabled = true;
  save.textContent = "Saving…";
  window.setTimeout(() => {
    status.textContent = "Saved successfully.";
    save.disabled = false;
    save.textContent = "Save";
  }, 700);
});

// C. Controlled
const dialogState = query("#dlg-ctl-state");
query("#dlg-ctl-open").addEventListener("click", () => {
  overlay("dlg-ctl").open();
  dialogState.textContent = "State: open";
});
query("#dlg-ctl").addEventListener("overlay-change", (event) => {
  const { open } = (event as CustomEvent<{ open: boolean }>).detail;
  dialogState.textContent = `State: ${open ? "open" : "closed"}`;
});

// J. Non-modal background action
let backgroundCount = 0;
const background = query<HTMLButtonElement>("#bg-count");
background.addEventListener("click", () => {
  backgroundCount += 1;
  background.textContent = `Background action (${backgroundCount})`;
});

/* -------------------------------------------------------------------------- */
/* ContextMenu cards                                                          */
/* -------------------------------------------------------------------------- */

query("#cm-basic").addEventListener("overlay-select", (event) => {
  const { item } = (event as CustomEvent<{ item: HTMLElement }>).detail;
  query("#cm-last").textContent =
    `Last action: ${item.textContent?.trim() ?? ""}`;
});
query("#cm-child-select").addEventListener("overlay-select", () => {
  overlay("child-dialog").open();
});

/* -------------------------------------------------------------------------- */
/* Hash navigation                                                            */
/* -------------------------------------------------------------------------- */

function scrollToHash(): void {
  const id = window.location.hash.replace(/^#/, "");
  if (id) {
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ block: "start" }),
    );
  }
}
scrollToHash();
window.addEventListener("hashchange", scrollToHash);

window.addEventListener(
  "pagehide",
  () => {
    overlays.destroy();
    playground.dispose();
  },
  { once: true },
);
