# @zealakit/overlay-vue

Idiomatic Composition API utilities for floating elements, layers, outside interaction, and
Escape handling. Positioning and layer ordering come from `@zealakit/overlay-core`; no styles
are shipped.

## Installation

```bash
npm install @zealakit/overlay-vue vue
```

Peer dependency: Vue `^3.5.0` (3.5.0 tested). ESM-only. All DOM work happens after mount.

## Composables

### `usePositioner(options)`

```vue
<script setup lang="ts">
import { ref } from "vue";
import { usePositioner } from "@zealakit/overlay-vue";

const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);

const { result } = usePositioner({
  reference,
  floating,
  placement: "bottom-start",
  offset: 8,
});
</script>

<template>
  <button ref="reference">Open</button>
  <div ref="floating" :style="{ position: result?.strategy, left: `${result?.x ?? 0}px` }" />
</template>
```

- Element and positioning options accept refs, getters, or plain values (`MaybeRefOrGetter`).
- Watchers are shallow and field-specific: no deep watch on a large options object.
- The Core positioner is created lazily after elements exist; option changes call `setOptions`.
- Results are written to a `shallowRef` only when `x`, `y`, `placement`, or `strategy` changes.
- `dispose()` is returned and is also wired to `onScopeDispose`.

### `useLayer(options)`

```ts
const { id, isTopmost, handle } = useLayer({
  element: floatingRef,
  reference: referenceRef,
  parent: parentLayer.handle,
  dismissOnEscape: true,
  dismissOnOutsidePress: true,
  boundaries: [trigger, externalToggle], // optional extra interaction boundary
  onDismiss: (reason) => close(reason),
});
```

- Registers on mount and re-registers when the element, parent, stack, or policies change.
- Without `stack`, layers share a reference-counted per-document stack (one listener pair).
- Only the topmost layer receives Escape/outside; both behaviors can be disabled.
- Parent handles must belong to the same stack; core ordering is authoritative.
- `handle` is a `Readonly<ShallowRef<LayerStackHandle | null>>` for nesting/focus on order.
- Resources are released on component unmount or `effectScope` disposal; `dispose()` is returned
  for usage outside an effect scope.

### `useEscapeKey(handler, options?)`

```ts
useEscapeKey(() => close(), { enabled: isOpen, target: document });
```

A `watchEffect` attaches/removes the listener when `enabled`/`target` change; scope disposal
cleans it up and the composable returns its own `dispose`.

### `useOverlay(options)`

Composes `usePositioner` and `useLayer` for an uncontrolled overlay:

```ts
const { isOpen, toggle, referenceRef, floatingRef, floatingStyles } = useOverlay({
  placement: "bottom-start",
  offset: 8,
});
```

The layer is registered only while open. Options extend `PositionerOptions` with
`defaultOpen`, `dismissOnEscape`, `dismissOnOutsidePress`, `onOpenChange`, and an optional
shared `stack`.

## High-level component composables

```ts
const trigger = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);

const popover = usePopover({
  trigger,
  content,
  placement: "bottom-start",
  portal: document.body,
});

popover.isOpen;          // Ref<boolean>
popover.open();
popover.close();
popover.setOpen(controlledOpen.value);
```

`useTooltip`, `useDialog`, and `useContextMenu` share the same return shape and accept the
same Core positioning/layer/focus options. Dialog adds `modal`, `lockScroll`, backdrop,
initial/final focus. ContextMenu exposes `openAt` through the shared controller and supports
pointer/keyboard invocation, basic roving navigation, and standard close policy.

The composables create the shared Core DOM controller after mount and destroy it on scope
disposal. They expose `isOpen` reactively through the controller subscription. Controlled
`open` is supported by passing a ref/getter and calling `setOpen()` when external state
changes.

### Vue-specific limitations

- The controller owns element attributes/state; do not bind `hidden`, role, or menu tabindex
  yourself.
- ContextMenu submenus, advanced Dialog parts, and tooltip-provider skip timing are not part
  of the composable layer.
- Nested overlays should register in opening order; pass a `parentLayer` when a Core layer
  handle is available.

## Focus helpers

The adapter re-exports Core's framework-independent helpers:

```ts
import {
  createFocusContainment,
  focusElement,
  focusFirst,
  getActiveElement,
  getFocusableElements,
  isFocusable,
  restoreFocus,
} from "@zealakit/overlay-vue";
```

## Reactivity and lifecycle

- No positioning instance or DOM side effect is created during render/SSR setup.
- Element changes are watched with `flush: "sync"` because template refs update outside a
  render; option changes use a post-flush watcher.
- `shallowRef` is used for external results/handles; DOM elements are not wrapped in deep
  reactive proxies.
- Each composable is idempotently disposable and uses `onScopeDispose` when an active scope
  exists. Outside a scope, callers use the returned `dispose()`.

## SSR / Nuxt

- Importing the package does not touch browser globals.
- Watchers/listeners only activate when elements/targets exist; no DOM work runs during SSR.
- `usePositioner`/`useLayer` attach via `onMounted` inside components.
- Server-render check is part of the test suite.

## Tests

```bash
pnpm --filter @zealakit/overlay-vue run test
```

Node test runner + `happy-dom` + `@vue/test-utils`, covering element mounting/replacement,
reactive options, result deduplication, layer registration/removal, nested layers, effect
scope disposal, outside/Escape behavior, shared listeners, overlay lifecycle, and SSR.
