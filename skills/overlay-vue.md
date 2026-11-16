---
name: overlay-vue
description: >-
  Use when adding @zealakit/overlay-vue to a Vue 3 app: Popover, Tooltip, Dialog,
  ContextMenu, v-model state, composables, styling hooks, and Nuxt rules.
---

# Overlay for Vue

Use `@zealakit/overlay-vue` for headless Popover, Tooltip, Dialog, and ContextMenu components.
The package owns positioning, layering, dismissal, focus, and ARIA wiring. You own all CSS and
visual markup.

`@zealakit/overlay-core` is an internal kernel bundled inside the adapter and not published to
npm. Never install it or import from it in application code.

## Install

```bash
npm install @zealakit/overlay-vue
# or: pnpm add @zealakit/overlay-vue
# or: yarn add @zealakit/overlay-vue
```

Peer dependency: `vue` `^3.5.0`. The app already provides it.

## Import

```vue
<script setup lang="ts">
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-vue";
</script>
```

Import every part you use from the same package entry.

## Rules

- Compose the exported parts. Do not rebuild positioning, outside-press, Escape, focus, or ARIA
  behavior yourself.
- Keep every part inside its root. A part used outside its root throws.
- Use `v-model:open` for controlled state and `@open-change` for every change reason.
- The controller owns the content `hidden` attribute. Never bind `hidden` yourself.
- Use `as` to change the rendered tag or component; keep it focusable for triggers and item roles.
- Popover adds no `role`; choose the semantics that fit the content. Dialog always needs a
  `DialogTitle` or an `aria-label`.
- Style with `class`, `style`, `data-state`, `data-side`, `data-align`, and the other `data-*`
  hooks. Do not add a CSS import; the package ships no CSS.
- ContextMenu submenus, checkbox items, and radio items do not exist in the Vue adapter.

## Popover

```vue
<template>
  <Popover placement="bottom-start" :offset="8">
    <PopoverTrigger>Edit profile</PopoverTrigger>
    <PopoverContent>
      <PopoverTitle>Edit profile</PopoverTitle>
      <PopoverDescription>Update your profile information.</PopoverDescription>
      <PopoverClose>Close</PopoverClose>
    </PopoverContent>
  </Popover>
</template>
```

Controlled:

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <Popover v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <PopoverTrigger>Edit profile</PopoverTrigger>
    <PopoverContent>Update your profile information.</PopoverContent>
  </Popover>
</template>
```

## Dialog

```vue
<template>
  <Dialog>
    <DialogTrigger>Edit profile</DialogTrigger>
    <DialogBackdrop>
      <div data-dialog-backdrop></div>
      <div data-dialog-viewport>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your profile information.</DialogDescription>
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </div>
    </DialogBackdrop>
  </Dialog>
</template>
```

- Modal by default: focus containment, inert background, and scroll lock.
- Always provide `DialogTitle` or `aria-label`.
- `DialogBackdrop` keeps the backdrop, viewport, and content together as one portal unit.
- Set `modal={false}` only when the dialog must not trap focus or lock scroll.

## Tooltip

```vue
<template>
  <Tooltip :delay="500">
    <TooltipTrigger>Save</TooltipTrigger>
    <TooltipContent side="top">Save changes</TooltipContent>
  </Tooltip>
</template>
```

Tooltips are for supplemental labels, not interactive content.

## ContextMenu

```vue
<template>
  <ContextMenu>
    <ContextMenuTrigger>Profile card</ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem @select="edit">Edit</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem disabled>Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
```

Selecting an item closes the menu. Use `:close-on-select="false"` when the menu must stay open.

## Custom markup with composables

Use `usePopover`, `useTooltip`, `useDialog`, or `useContextMenu` with template refs when the
compound components cannot express your markup. Options accept refs or getters; dispose with
`onScopeDispose` or call `dispose()` yourself. `usePositioner`, `useLayer`, `useOverlay`, and
`useEscapeKey` are available for deeper composition.

## Styling

Common hooks:

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Content, trigger | `"open"` or `"closed"`. |
| `data-side` / `data-align` | Content | Resolved placement after flip/shift. |
| `data-animating` | Content | `"enter"` or `"exit"`. |
| `data-modal` / `data-non-modal` | Dialog content | Modal mode. |

Arrow styling variables: `--overlay-arrow-background`, `--overlay-arrow-border-width`, and
`--overlay-arrow-border-color`.

## Verify

- Run the app's typecheck and the overlay tests.
- Check `v-model:open`, Escape, outside press, Tab/Shift+Tab in dialogs, and focus return.
- Check the popup stays inside the viewport when the page scrolls or the trigger moves.
- In Nuxt, components are SSR-safe; DOM work starts on mount, so a client-only wrapper is not
  required.

## Full API

https://github.com/zealakit/overlay/blob/main/packages/vue/README.md
