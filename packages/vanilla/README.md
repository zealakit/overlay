# @zealakit/overlay-vanilla

Imperative DOM adapter for Zealakit Overlay. No framework runtime; all positioning,
collision handling, and layer ordering come from `@zealakit/overlay-core`.

## Installation

```bash
npm install @zealakit/overlay-vanilla
```

Core is installed automatically. No framework peer is required. ESM-only.

```ts
import {
  createFloating,
  createLayerStack,
  createOverlay,
} from "@zealakit/overlay-vanilla";
```

## Public API

| Export | Purpose |
| --- | --- |
| `createFloating(options)` | Wraps core's positioner; applies `position`/`left`/`top`/`data-placement` by default, exposes `setReference`, `setFloating`, `setOptions`, `update`, `subscribe`, `dispose` |
| `createLayerStack(options?)` | Shared layer registry for one document: ordering, parent/child, topmost, Escape/outside routing, listener cleanup |
| `createOverlay(options)` | Low-level controller: positioning + layer registration + trigger + portal + hidden/`data-state` handling |
| `createPopover(options)` / `createTooltip(options)` / `createDialog(options)` / `createContextMenu(options)` | High-level DOM controllers with ARIA, positioning, layer/dismissal, focus, portal, dialog modal/scroll behavior, tooltip timing, and menu keyboard navigation |
| `getFocusableElements`, `isFocusable`, `focusElement`, `focusFirst`, `getActiveElement`, `restoreFocus`, `createFocusContainment` | Focus primitives for popovers/dialogs built on top |

Types: `Floating`, `FloatingOptions`, `LayerHandle`, `LayerOptions`, `LayerStack`,
`Overlay`, `OverlayOptions`, plus re-exported core types (`Placement`,
`PositionerOptions`, `PositionerResult`, `DismissReason`, `ReferenceElement`).

## Positioning

```ts
const floating = createFloating({
  reference: trigger,
  floating: panel,
  placement: "bottom-start",
  offset: 8,
  padding: 8,
  autoUpdate: true,
});

// Styles are applied automatically; subscribe for results or custom UI.
floating.subscribe(({ x, y, placement }) => {
  status.textContent = `${Math.round(x)},${Math.round(y)} · ${placement}`;
});

floating.setOptions({ placement: "top" });
floating.setReference(nextTrigger);
floating.dispose();
```

`update()` resolves `null` for missing or detached elements, so callers can treat the
result as optional. Set `applyStyles: false` to write styles yourself.

## Layers

```ts
const stack = createLayerStack(); // one per document

const layer = stack.register({
  element: panel,
  reference: trigger,
  boundaries: [externalToggle], // optional extra interaction boundary
  dismissOnEscape: true,
  dismissOnOutsidePress: true,
  onDismiss: (reason) => close(reason),
});

layer.dispose();
stack.dispose();
```

- A single `keydown`/`pointerdown` pair is attached while any layer needs it —
  multiple layers do not add duplicate global listeners.
- Only the topmost layer receives Escape/outside interactions; per-layer flags opt out.
- Clicks on the layer's `element`, `reference`, or explicit `boundaries` never count as
  outside. Boundary changes are supplied at registration time.
- Parent-child layers are supported (`parent`); handles must belong to the same stack, and
  removing a parent removes descendants.
- Layers registered without an element never report outside.

## Overlay controller

```ts
const overlay = createOverlay({
  reference: trigger,
  floating: panel,
  stack,              // share one stack across overlays (recommended)
  placement: "bottom-start",
  offset: 8,
  portal: document.body,
  onOpenChange: (open) => trigger.setAttribute("aria-expanded", String(open)),
});

overlay.destroy();
```

`createOverlay` hides the floating element while closed and restores its DOM position on
destroy when a portal target was used. Without an explicit `stack`, overlays share a
reference-counted default stack for their document, so multiple overlays still attach only
one keyboard/pointer listener pair.

### High-level component controllers

```ts
const popover = createPopover({
  trigger,
  content,
  placement: "bottom-start",
  offset: 8,
  portal: document.body,
});

popover.open();
popover.close();
popover.setOpen(controlledOpen);
popover.setOptions({ placement: "top" });
popover.subscribe(({ isOpen, placement }) => {});
popover.destroy();
```

`createTooltip`, `createDialog`, and `createContextMenu` share the same controller shape.
Dialog supports `modal`, `lockScroll`, backdrop, initial/final focus, and focus containment.
ContextMenu supports pointer coordinates through `openAt({x,y})`, Context Menu/Shift+F10,
basic menu roving navigation/typeahead, and standard item close policy.
All controllers are uncontrolled by default; pass `open` plus `setOpen()`/`onOpenChange` for
controlled use. Complex public compound APIs (submenus, advanced Dialog parts, tooltip
provider skip timing) are not reproduced in this adapter.

## SSR and cleanup

Importing the package is safe without browser globals. `createOverlay` throws only when
called without a DOM. `createFloating()`/`createLayerStack()` are constructible on the
server and do nothing until elements are supplied. Every controller has an idempotent
`dispose()`/`destroy()` that detaches listeners and stops observers.

## Tests

```bash
pnpm --filter @zealakit/overlay-vanilla run test
```

Node's test runner with `happy-dom`, covering positioning integration, option updates,
element swaps, detached nodes, layer ordering/parent-child, outside/Escape routing,
single-listener sharing, opt-outs, focus helpers, and disposal.
