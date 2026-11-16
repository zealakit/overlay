# @zealakit/overlay-core

Framework-independent foundation for floating, layered UI. No React, Vue, Svelte, or DOM
access at module load — only types, lifecycle contracts, and functions you invoke explicitly.

Adapters (`vanilla`, `react`, `vue`, `svelte`) depend on this package; it never depends on them.

## Installation

```bash
npm install @zealakit/overlay-core
```

ESM-only. The package has one runtime dependency (`@floating-ui/dom`) and no framework peer.

## Responsibilities

| Area | What it provides |
| --- | --- |
| Element references | Nullable element types, lazy getters, detached-element checks |
| Lifecycle | `Cleanup`, `Disposer`, event-listener and resize-observer helpers |
| Events | Pointer, keyboard, focus, and outside-interaction predicates |
| Layer lifecycle | `createLayer` — open/closed state + subscription |
| Layer stack | `createLayerManager` (ordering), `createLayerStack` (shared listeners/routing), and `acquireSharedLayerStack()` for one cross-adapter per-document stack |
| Positioning | Collision-aware `createPositioner`, plus low-level placement math |
| Focus | Focusable-element lookup, safe focus/restore, active-element resolution, and focus containment |
| Scroll locking | Reference-counted modal body scroll lock with scrollbar compensation |
| DOM overlay controller | Shared, framework-neutral open/position/layer/dismiss/focus behavior used by the Vanilla/Vue/Svelte adapters |

## Public API

Everything below is exported from the package root. Anything not listed is internal and may
change without notice.

### Element references

| Export | Purpose |
| --- | --- |
| `ReferenceElement`, `VirtualElement`, `FloatingElement` | Anchor and floating element contracts (virtual anchors supported) |
| `ElementRef`, `ElementGetter`, `ElementSource` | Nullable refs and refs that change over time |
| `resolveElement(source)` | Resolve an element or getter to the current element |
| `isConnected(element)` | True when the element is attached to its document |
| `getRect(element)`, `isElement(value)`, `isBrowser()` | Small DOM guards and measurement helper |

`VirtualElement` only promises `{ x, y, width, height }` from `getBoundingClientRect()`.
The positioning engine adapter expands that to the engine's coordinate shape, so consumers
never depend on engine types.

### Overlay controller

| Export | Purpose |
| --- | --- |
| `createOverlayController(options)` | Framework-neutral DOM controller for Popover, Tooltip, Dialog, and ContextMenu behavior. Manages open state, layer registration, dismissal, focus, positioning, portal transport, dialog modal/scroll/inert behavior, tooltip timing, and basic context-menu keyboard navigation. |

Adapters expose idiomatic wrappers around this shared controller:
Vanilla factories (`createPopover`, etc.), Vue composables (`usePopover`, etc.), and Svelte
controller stores (`createPopover`, etc.). React keeps its compound-component implementation.

All adapters use `acquireSharedLayerStack(document)` by default, so overlays from different
frameworks on the same page share one ordering stack and one keyboard/pointer listener pair.
Custom layers can still pass an explicit stack.

### Scroll locking

| Export | Purpose |
| --- | --- |
| `lockBodyScroll(document?)` | Reference-counted modal body lock; first call captures inline overflow/padding styles, nested calls share the lock, and the final cleanup restores them |

### Lifecycle

| Export | Purpose |
| --- | --- |
| `Cleanup` | Idempotent cleanup function type |
| `createDisposer()` | Collect cleanups; dispose in reverse order; safe to call twice |
| `listen(target, type, handler, options)` | Add/remove an event listener with a cleanup |
| `observeResize(elements, callback)` | ResizeObserver lifecycle with a no-op fallback |

Adding a cleanup to a disposed `Disposer` runs it immediately, so late async work cannot leak
listeners. `listen` and `observeResize` accept nullish targets/elements and degrade to no-ops.

### Events

| Export | Purpose |
| --- | --- |
| `isEscapeKey(event)`, `isActivationKey(event)` | Keyboard predicates (Escape/Esc; Enter/Space) |
| `isPrimaryPointer(event)` | Primary button of the primary pointer |
| `isOutsidePress(event, elements)` | Target outside every element (`composedPath`, then `contains`) |
| `isPointerOutside(event, elements)` | Primary-button outside press; right/middle clicks do not dismiss |
| `isFocusInside(element, target)`, `isFocusOutside(event, elements)` | Focus-contained checks based on `relatedTarget` |

`listenForDismiss({ floating, reference, onDismiss })` builds on these for Escape and
outside-press dismissal.

### Focus

| Export | Purpose |
| --- | --- |
| `getFocusableElements(container)` | Focusable elements in DOM order, skipping disabled/hidden/inert/aria-hidden/`display:none`/`visibility:hidden` nodes |
| `isFocusable(element)` | Focusability check used by the lookup |
| `focusElement(element)` | Focus a connected element and report whether focus moved (shadow-root aware) |
| `focusFirst(container)` | Focus the first focusable descendant, trying later candidates if earlier ones cannot take focus |
| `getActiveElement(root?)` | Deepest active element, including open shadow roots |
| `restoreFocus(element)` | Safe restore for a previously captured element |
| `createFocusContainment(options)` | Focus-trap primitive: Tab wrapping, focus escape redirect, optional initial focus and restoration |

`createFocusContainment()` is a primitive, not a Dialog. It never sets roles, ARIA
attributes, or `inert`. Focusable elements are queried on demand so dynamic content works
without a MutationObserver:

```ts
const containment = createFocusContainment({
  container: panel,
  initialFocus: "first",
  restoreFocus: true,
  onEscape: () => close(),
});

containment.setEnabled(false); // restores focus when restoreFocus is true
containment.suspend();         // yield to a nested child without restoring
containment.resume();          // reattach without recapturing focus
containment.dispose();
```

For nested layers, `suspend()` the parent while the child is active and `resume()` afterward;
`suspend()` neither restores nor moves focus. Alternatively provide `shouldContain(event)` so
the active child layer keeps control.

Focus restoration on layer close is component policy:

```ts
const returnTo = getActiveElement();
const layer = stack.register({
  element: panel,
  reference: trigger,
  onDismiss: () => {
    close();
    restoreFocus(returnTo);
  },
});
``` Focus restoration/containment policy belongs to the
component; layers themselves do not move focus.

### Layers

`createLayer()` manages one open/closed layer state machine (no DOM, no listeners beyond its
own subscribers).

`createLayerManager()` manages ordering and parent/child links. `createLayerStack()` adds the
shared interaction layer used by adapters:

```ts
const stack = createLayerStack();
const parent = stack.register({ element: () => parentEl, reference: trigger });
const child = stack.register({ parent: parent, element: () => childEl });

stack.getTopmost(); // child
stack.subscribe((entries) => console.log(entries));

parent.dispose(); // removes parent and descendants
```

`createLayerStackRegistry()` provides reference-counted stacks per document so independent
components share one listener pair and release it when the last consumer unmounts.

Rules:

- Registration order is stack order (bottom → top); `getTopmost()` is the active layer.
- A child requires an existing parent; unknown parents and duplicate ids throw.
- Unregistering a parent removes its descendant layers.
- Outside detection checks the layer element, reference, explicit extra `boundaries`, and
  descendant layer elements; layers registered without any boundary never report outside.
- Only the topmost layer receives Escape/outside interactions. Parent layers are not notified
  when a child is topmost, so child interactions are not treated as parent-outside presses.
- Escape/outside defaults are `true` per layer; set `dismissOnEscape` or
  `dismissOnOutsidePress` to `false` to opt out.
- Escape ignores composing events and events already `defaultPrevented`. Outside handling uses
  primary `pointerdown`; right/middle clicks and secondary pointers do not dismiss.
- Removing a parent removes descendants; closing a child leaves the parent registered.
- The manager/stack does not open, close, focus, render, or style anything.

### Interaction semantics

- Only the topmost registered layer is routed Escape/outside. Parent layers do not interpret a
  child's content as outside, and closing a child leaves the parent registered.
- `dismissOnEscape`/`dismissOnOutsidePress` default to `true` per layer and can be disabled
  independently. A topmost layer that opts out does not fall through to a parent layer.
- Escape ignores IME composition and `defaultPrevented` events. Outside uses primary
  `pointerdown` (touch produces pointer events); secondary buttons/pointers do not dismiss.
- The interaction boundary is the layer element, reference, optional `boundaries`, and
  descendant layer elements. Without any boundary, outside never fires.
- Shadow DOM targets are handled through `composedPath()`. Detached boundary elements simply
  cannot contain an event, so they do not block outside detection.
- The stack does not call `preventDefault` or `stopPropagation`. Consumers can prevent an event
  before it reaches the document listener to suppress dismissal.
- Focus is not changed by layer registration, ordering, dismissal, or positioning.

### Accessibility responsibilities

Infrastructure (Core/adapters) owns:

- Layer ordering, topmost interaction routing, configurable dismissal.
- Pointer/Escape predicates, focusable-element detection, safe focus/restore, focus
  containment.
- Collision-aware positioning with no focus movement on updates.

Components/consumers own:

- Semantic roles (`dialog`, `tooltip`, `menu`), `aria-*` relationships, names, and descriptions.
- `aria-expanded`/`aria-controls`/`aria-haspopup` on triggers.
- Focus policy (initial focus, containment, restoration) using the primitives above.
- Hiding inactive content (`hidden`, conditional rendering, `inert`) and scroll locking.
- Deciding whether Escape/outside should close a given layer. The library does not inject ARIA
  attributes or roles automatically.

### Positioning

`createPositioner()` is the collision-aware session API:

```ts
const positioner = createPositioner({
  reference: button,
  floating: panel,
  placement: "bottom-start",
  offset: 8,
  padding: 8,
});

const unsubscribe = positioner.subscribe(({ x, y, placement, strategy }) => {
  panel.style.position = strategy;
  panel.style.left = `${x}px`;
  panel.style.top = `${y}px`;
  panel.dataset.placement = placement;
});

positioner.setReference(nextButton);
positioner.setOptions({ placement: "top" });
await positioner.update();
positioner.dispose();
```

| Option | Default | Meaning |
| --- | --- | --- |
| `placement` | `"bottom"` | Preferred placement (flipped when it overflows) |
| `offset` | `0` | Gap on the main axis |
| `alignOffset` | `0` | Shift on the alignment axis |
| `flip` | `true` | Flip to the opposite side on overflow |
| `shift` | `true` | Shift to stay inside the boundary |
| `padding` | `0` | Collision padding from boundary edges |
| `boundary` | `"clippingAncestors"` | Element, `"clippingAncestors"`, or `"viewport"` |
| `strategy` | `"fixed"` | CSS positioning strategy |
| `autoUpdate` | `true` | Recompute on scroll, resize, and layout shifts |

Behavior guarantees:

- `update()` resolves `null` when there is no reference/floating element, either is detached,
  or a newer update superseded it.
- Subscribers only receive results for the latest measurement.
- Positioning never focuses elements, mutates ARIA, or changes hidden state.
- `dispose()` is idempotent, stops auto-update, drops subscriptions, and makes further
  `update()` calls resolve `null`.

Low-level exports remain available for simple, non-collision math and for the current
adapters: `computePosition`, `resolvePlacementCoordinates`, `parsePlacement`, `watchPosition`,
`DEFAULT_PLACEMENT`, `DEFAULT_OFFSET`.

## Positioning architecture

```
adapter ──> createPositioner() ──> engine adapter ──> @floating-ui/dom
                 │
                 └── PositionerResult { x, y, placement, strategy }
```

- The engine is an implementation detail. Adapters must not import `@floating-ui/*`.
- `Placement` accepts center aliases (`"bottom-center"`); `createPositioner` normalizes them
  (`"bottom"`) before computing.
- `boundary: "viewport"` maps to the engine's clipping-ancestors boundary with a viewport root.
- Why Floating UI: see [ADR 0001](https://github.com/zealakit/overlay/blob/main/docs/adr/0001-positioning-engine.md).

The synchronous `computePosition()` helper remains available for simple, single-placement
calculations without collision handling; adapters use `createPositioner()`.

## SSR constraints

- Importing the package must not throw without `window`/`document`; this is covered by a test
  that imports the built package in a bare Node process.
- No browser globals are read at module initialization. DOM work happens only inside functions
  you call.
- `createPositioner()` with null elements is safe on the server; `update()` resolves `null`.
- `listenForDismiss`, `watchPosition`, and `observeResize` no-op without a browser DOM.

## Testing

```bash
pnpm --filter @zealakit/overlay-core run test
```

Tests use the Node test runner with `happy-dom` as the only DOM dependency (no test framework
install). The suite covers layer registration/ordering/parent-child removal, outside detection,
disposer idempotency, event predicates, positioning options/results/flip/shift, detached
elements, disposal, and SSR import safety.
