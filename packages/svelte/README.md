# @zealakit/overlay-svelte

Idiomatic Svelte 5 actions and controllers for positioning, layers, outside interaction, and
Escape handling. Positioning and ordering come from `@zealakit/overlay-core`; no styles are
shipped.

## Installation

```bash
npm install @zealakit/overlay-svelte svelte
```

Peer dependency: Svelte `^5.0.0` (5.0.0 and current 5.x tested). Svelte 5 only. ESM-only.
Actions run only in the browser.

## Actions

```svelte
<script lang="ts">
  import { floating, layer, portal } from "@zealakit/overlay-svelte";

  let trigger: HTMLButtonElement;
  let panel: HTMLDivElement;
  let open = $state(false);
</script>

<button bind:this={trigger} onclick={() => (open = !open)}>Open</button>

<div
  use:portal
  use:floating={{ reference: trigger, placement: "bottom-start", offset: 8 }}
  use:layer={{ reference: trigger, disabled: !open, onDismiss: () => (open = false) }}
  hidden={!open}
/>
```

| Action | Responsibility |
| --- | --- |
| `use:floating` | Position the node against `reference`; applies `position`/`left`/`top`/`data-placement`; `onUpdate` receives results; `enabled: false` pauses. |
| `use:layer` | Register the node with the shared layer stack; configurable Escape/outside policies and extra `boundaries`; `onRegistered` exposes the handle; `onTopmostChange` reports ordering. |
| `use:outsideInteraction` | Standalone outside-press handler with configurable elements/reference, event type(s), target, capture, and `enabled`; layer actions already cover layered outside routing. |
| `use:escapeKey` | General-purpose Escape listener with `enabled` and `target`. |
| `use:portal` | Move the node to a portal target and restore it on destroy. |
| `use:overlay` | High-level open/closed composition of `floating` + `layer`. |

Action parameters are re-evaluated when Svelte updates the action. Mutating a parameter object
in place does **not** notify the action; pass a new object/expression (normal Svelte
reactivity). Positioning options and the reference element can change without recreating the
positioner.

## Controllers

For manual updates or binding the result into component state, use the factories:

```ts
import { createLayer, createPositioner } from "@zealakit/overlay-svelte";

const positioner = createPositioner({
  reference,
  floating: panel,
  placement: "bottom-start",
  autoUpdate: false,
});

const unsubscribe = positioner.subscribe((result) => {
  if (result) console.log(result.x, result.y);
});

await positioner.update();
positioner.setOptions({ placement: "top" });
positioner.dispose();

const layer = createLayer({ element: panel, reference });
layer.subscribe(({ id, isTopmost }) => {
  console.log(id, isTopmost);
});
layer.setOptions({ disabled: true });
layer.dispose();
```

- `createPositioner()` returns a Svelte-readable store plus `update`, `setOptions`,
  `setReference`, `setFloating`, `setApplyStyles`, and `dispose`.
- `createLayer()` returns a readable `{ id, isTopmost, handle }` store plus `setOptions` and
  `dispose`.
- Results/state are emitted only when values actually change.
- Layers use a shared per-document registry, so multiple layers attach one keyboard/pointer
  listener pair. Parent/child handles are supported.

## High-level component controllers

```ts
import { createPopover } from "@zealakit/overlay-svelte";

let trigger: HTMLButtonElement;
let content: HTMLDivElement;
let popover;

onMount(() => {
  popover = createPopover({
    trigger,
    content,
    placement: "bottom-start",
    portal: document.body,
  });
});

onDestroy(() => popover?.destroy());

// popover.subscribe(({ isOpen }) => …)
// popover.open(); popover.close(); popover.setOpen(open);
```

`createTooltip`, `createDialog`, and `createContextMenu` return the same readable/method
controller shape. Dialog supports modal/non-modal, scroll lock, backdrop, initial/final
focus; ContextMenu supports pointer coordinates, Context Menu/Shift+F10, roving keyboard
navigation/typeahead, and standard close policy.

Svelte components remain consumer-owned markup. Consumers instantiate controllers after
`bind:this` elements exist (usually in `onMount`) and call `destroy()` in `onDestroy`.

### Svelte-specific limitations

- Controllers are plain stores/methods, not compiled compound components.
- ContextMenu submenus, advanced Dialog parts, and tooltip-provider skip timing are not
  exposed.
- Nested overlays rely on opening order; an explicit parent layer/portal boundary is the
  consumer's responsibility when needed.
- `createPopover()` etc. require DOM elements and must not run during SSR.

## Focus helpers

Re-exported from Core for small popover/dialog foundations:

```ts
import {
  createFocusContainment,
  focusElement,
  focusFirst,
  getActiveElement,
  getFocusableElements,
  isFocusable,
  restoreFocus,
} from "@zealakit/overlay-svelte";
```

The high-level component controllers use these helpers internally; the helpers remain
exported for custom overlays.

## Svelte version and API choice

This package targets **Svelte 5** (`svelte ^5.0.0`). It uses actions and plain stores, not
runes-only APIs, so consumers can use either runes or classic Svelte syntax.

Attachments (Svelte 5.29+) were evaluated but not used: the peer range starts at 5.0, and
actions provide the same element-bound lifecycle with broader compatibility and explicit
`update`/`destroy` semantics.

## SSR / SvelteKit

- Importing the package is safe without browser globals.
- Actions only run in the browser; factories with no elements are inert on the server.
- Svelte component destruction is covered by a compiled-fixture test.
- DOM/observer/listener setup happens when actions mount or elements are supplied.
- Cleanup is idempotent on action destroy / controller dispose.
- No global store is created beyond the internal per-document layer stack registry.

### SvelteKit

There is no SvelteKit-specific entry point. Import actions in components and use controllers
after mount when elements are available. Actions are client-only; package imports and controller
construction are safe during SSR. A compiled Svelte component's server render is covered by the
test suite; a full SvelteKit application is not included in this repository.

## Tests

```bash
pnpm --filter @zealakit/overlay-svelte run test
```

Node test runner + `happy-dom` (run with the `browser` condition so Svelte's client runtime is
used). Actions/controllers are exercised directly against DOM nodes; one test compiles a small
Svelte component with `svelte/compiler` to verify action cleanup on component destruction. No
additional Svelte test framework is required; the example is validated by `svelte-check` and the
Svelte/Vite build.
