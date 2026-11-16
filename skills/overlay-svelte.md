---
name: overlay-svelte
description: >-
  Use when adding @zealakit/overlay-svelte to a Svelte 5 app: Popover, Tooltip, Dialog,
  ContextMenu, bind:open state, controllers/actions, styling hooks, and SvelteKit rules.
---

# Overlay for Svelte

Use `@zealakit/overlay-svelte` for headless Popover, Tooltip, Dialog, and ContextMenu components.
The package owns positioning, layering, dismissal, focus, and ARIA wiring. You own all CSS and
visual markup.

`@zealakit/overlay-core` is an internal dependency installed automatically. Never install it or
import from it in application code.

## Install

```bash
npm install @zealakit/overlay-svelte
# or: pnpm add @zealakit/overlay-svelte
# or: yarn add @zealakit/overlay-svelte
```

Peer dependency: `svelte` `^5.0.0`. The app already provides it. Components ship as `.svelte`
files, so the app needs Vite with `@sveltejs/vite-plugin-svelte` (included in SvelteKit).

## Import

```svelte
<script lang="ts">
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    Dialog,
    DialogBackdrop,
    DialogContent,
    DialogTitle,
    DialogTrigger,
  } from "@zealakit/overlay-svelte";
</script>
```

Import every part you use from the same package entry.

## Rules

- Compose the exported parts. Do not rebuild positioning, outside-press, Escape, focus, or ARIA
  behavior yourself.
- Keep every part inside its root. A part used outside its root throws.
- Use `bind:open` for controlled state and `onOpenChange` for every change reason.
- The controller owns the content `hidden` attribute. Never bind `hidden` yourself.
- Use `as` to change the rendered tag; keep triggers and menu items focusable.
- Popover adds no `role`; choose the semantics that fit the content. Dialog always needs a
  `DialogTitle` or an `aria-label`.
- Style with `class`, `style`, `data-state`, `data-side`, `data-align`, and the other `data-*`
  hooks. Do not add a CSS import; the package ships no CSS.
- ContextMenu submenus, checkbox items, and radio items do not exist in the Svelte adapter.

## Popover

```svelte
<Popover placement="bottom-start" offset={8}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>
    <PopoverTitle>Edit profile</PopoverTitle>
    <PopoverDescription>Update your profile information.</PopoverDescription>
    <PopoverClose>Close</PopoverClose>
  </PopoverContent>
</Popover>
```

Controlled:

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Popover bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>Update your profile information.</PopoverContent>
</Popover>
```

## Dialog

```svelte
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
```

- Modal by default: focus containment, inert background, and scroll lock.
- Always provide `DialogTitle` or `aria-label`.
- `DialogBackdrop` keeps the backdrop, viewport, and content together as one portal unit.
- Set `modal={false}` only when the dialog must not trap focus or lock scroll.

## Tooltip

```svelte
<Tooltip delay={500}>
  <TooltipTrigger>Save</TooltipTrigger>
  <TooltipContent side="top">Save changes</TooltipContent>
</Tooltip>
```

Tooltips are for supplemental labels, not interactive content.

## ContextMenu

```svelte
<ContextMenu>
  <ContextMenuTrigger>Profile card</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onselect={() => edit()}>Edit</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem disabled>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

Svelte uses the lowercase `onselect` prop. Selecting an item closes the menu; set
`closeOnSelect={false}` to keep it open.

## Custom markup with controllers and actions

Use `createPopover`, `createTooltip`, `createDialog`, or `createContextMenu` in `onMount`, then call
`destroy()` in `onDestroy`. They take `trigger` and `content` elements plus the same positioning,
dismissal, and animation options as the components.

The package also exports the actions `floating`, `layer`, `overlay`, `outsideInteraction`,
`escapeKey`, and `portal` (used as `use:floating`, `use:layer`, and so on), plus
`createPositioner` and `createLayer`. Prefer the components unless you need your own markup.

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

- Run `svelte-check`, the app's typecheck, and the overlay tests.
- Check `bind:open`, Escape, outside press, Tab/Shift+Tab in dialogs, and focus return.
- Check the popup stays inside the viewport when the page scrolls or the trigger moves.
- In SvelteKit, importing the package and rendering the components during SSR is safe.

## Full API

https://github.com/zealakit/overlay/blob/main/packages/svelte/README.md
