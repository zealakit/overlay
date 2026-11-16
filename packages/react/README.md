# @zealakit/overlay-react

Idiomatic React hooks for floating elements, layered dismissal, and Escape handling.
Positioning math and layer ordering come from `@zealakit/overlay-core`; no styles are shipped.

## API layers

The primary API is headless components. **Popover, Tooltip, Dialog, and ContextMenu are
implemented**. The hooks, `Portal`, and focus helpers below remain the
public lower-level customization layer.

- [Popover documentation](https://github.com/zealakit/overlay/blob/main/docs/popover.md)
- [Tooltip documentation](https://github.com/zealakit/overlay/blob/main/docs/tooltip.md)
- [Dialog documentation](https://github.com/zealakit/overlay/blob/main/docs/dialog.md)
- [ContextMenu documentation](https://github.com/zealakit/overlay/blob/main/docs/context-menu.md)
- [API direction](https://github.com/zealakit/overlay/blob/main/docs/api-direction.md)

### Popover

```tsx
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@zealakit/overlay-react";

<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent side="bottom" align="start" sideOffset={8}>
    <PopoverHeader>
      <PopoverTitle>Title</PopoverTitle>
      <PopoverDescription>Description</PopoverDescription>
    </PopoverHeader>
    Content
    <PopoverClose>Close</PopoverClose>
  </PopoverContent>
</Popover>;
```

Advanced parts `PopoverPortal`, `PopoverPositioner`, and `PopoverPopup` are also exported.
Popover is non-modal by default and does not trap focus or assign a role.

### Tooltip

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@zealakit/overlay-react";

<TooltipProvider delay={500}>
  <Tooltip>
    <TooltipTrigger>Save</TooltipTrigger>
    <TooltipContent side="top">Save changes</TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

Tooltip is informational and non-modal. It opens on hover/focus, uses `role="tooltip"` and
`aria-describedby`, is not focusable/trapped, and closes on Escape or outside pointer interaction.
Use Popover for interactive floating content.

### Dialog

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-react";

<Dialog>
  <DialogTrigger>Open dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Update your profile information.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose>Cancel</DialogClose>
      <button type="submit">Save</button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

Dialog supports modal and non-modal modes, focus containment/restoration, Escape/outside
dismissal, inert background, reference-counted scroll locking, nested overlays, and advanced
Portal/Backdrop/Viewport/Popup composition.

### ContextMenu

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@zealakit/overlay-react";

<ContextMenu>
  <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={copy}>Copy</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>;
```

ContextMenu supports right-click, Context Menu key/Shift+F10, pointer-coordinate and
trigger-element anchors, roving keyboard navigation, typeahead, checkbox/radio items,
submenus, RTL, and nested layer/Dialog integration.

## Installation

```bash
npm install @zealakit/overlay-react react react-dom
```

Peer dependencies: React and React DOM `^18.0.0 || ^19.0.0` (both tested). ESM-only. Hooks and
the portal are marked `"use client"` for Next.js App Router and other RSC environments.

## Hooks

### `usePositioner(options)`

Creates a Core positioner in an effect (never during render), tracks element mounting with
callback refs, and returns the latest result.

```tsx
function Popover() {
  const { referenceRef, floatingRef, result } = usePositioner({
    placement: "bottom-start",
    offset: 8,
  });

  return (
    <>
      <button ref={referenceRef}>Open</button>
      <div
        ref={floatingRef}
        style={{
          position: result?.strategy ?? "fixed",
          left: result?.x ?? 0,
          top: result?.y ?? 0,
        }}
      />
    </>
  );
}
```

Why callback refs: React refs do not re-render when `.current` changes. The hook stores the
mounted elements in state, so the positioner is updated exactly when elements appear or go
away. It also returns `referenceElement`/`floatingElement` and a stable `update()`.

Options are Core `PositionerOptions` (`placement`, `offset`, `alignOffset`, `flip`, `shift`,
`padding`, `boundary`, `strategy`, `autoUpdate`). Changes call `setOptions` in an effect.

### `useLayer(options)`

Registers a layer in a shared stack while mounted, and removes it on cleanup.

```tsx
const { id, isTopmost, handle } = useLayer({
  element: floatingElement,
  reference: referenceElement,
  dismissOnEscape: true,
  dismissOnOutsidePress: true,
  boundaries: [trigger, externalToggle], // optional extra interaction boundary
  onDismiss: (reason) => close(reason),
});
```

- Without a `stack` option, layers share a reference-counted per-document stack, so multiple
  layers attach one keyboard/pointer listener pair.
- Only the topmost layer receives Escape/outside interactions; both behaviors are opt-out.
- `boundaries` extends the interaction boundary beyond the floating element and reference; use a
  memoized array so the layer does not re-register on every render.
- Pass `parent: parentHandle` for nested layers. Registration waits until an element/reference
  exists to avoid mount-time churn.
- Strict Mode is safe: registration/disposal run through effects and are repeatable.

### `useEscapeKey(handler, options?)`

General-purpose Escape listener with `enabled` and `target` options. Layer stacks already route
Escape to the topmost layer; use this outside that model.

### `useOverlay(options)`

Composes `usePositioner` and `useLayer` for an uncontrolled open/closed overlay:

```tsx
const { isOpen, toggle, referenceRef, floatingRef, floatingStyles } = useOverlay({
  placement: "bottom-start",
  offset: 8,
});
```

Returns `isOpen`, `placement`, callback refs, `floatingStyles`, `open`/`close`/`toggle`, and
`update()`. The layer is registered only while open and disposed on close/unmount. Accepts a
`stack` for sharing and `onOpenChange` for notifications.

### `Portal`

Renders children into `document.body` (or a given container) after mount. Returns `null` on the
server, so SSR output is stable.

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
} from "@zealakit/overlay-react";
```

## SSR / Next.js

- The package entry has a `"use client"` directive; import hooks from client components.
- Importing the package is safe on the server; no browser globals are read at module load.
- DOM work happens in effects (or `Portal` after mount), never during render.
- `pnpm --filter @zealakit/overlay-react run test` includes a server-render check.

## Tests

```bash
pnpm --filter @zealakit/overlay-react run test
```

Node test runner + `happy-dom` + `@testing-library/react`. Coverage includes mounting/ref
changes, option updates, result clearing, Strict Mode, layer registration/removal, nested
layers, outside/Escape routing, shared listeners, unmount cleanup, and SSR rendering.
