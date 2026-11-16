---
name: overlay-react
description: >-
  Use when adding @zealakit/overlay-react to a React 18/19 app: Popover, Tooltip,
  Dialog, ContextMenu, controlled state, styling hooks, hooks, and Next.js rules.
---

# Overlay for React

Use `@zealakit/overlay-react` for headless Popover, Tooltip, Dialog, and ContextMenu
primitives. The package owns positioning, layering, dismissal, focus, and ARIA wiring. You own
all CSS and visual markup.

`@zealakit/overlay-core` is an internal dependency installed automatically. Never install it or
import from it in application code.

## Install

```bash
npm install @zealakit/overlay-react
# or: pnpm add @zealakit/overlay-react
# or: yarn add @zealakit/overlay-react
```

Peer dependencies: `react` and `react-dom` `^18.0.0 || ^19.0.0`. The app already provides them.

## Import

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-react";
```

Every entry carries `"use client"`. In the Next.js App Router, import the package from a client
component. Import every part you use from the same package entry.

## Rules

- Compose the exported parts. Do not rebuild positioning, outside-press, Escape, focus, or ARIA
  behavior yourself.
- Keep every part inside its root. A part used outside its root throws.
- Use `open` + `onOpenChange` for controlled state; otherwise leave the component uncontrolled.
- `asChild` clones exactly one child. The child must forward refs and props.
- Popover adds no `role`; choose the semantics that fit the content. Dialog always needs a
  `DialogTitle` or an `aria-label`.
- Closed content unmounts by default. Use `keepMounted` only when your CSS needs the closed node;
  use the `animation` prop for exit animation instead of delaying unmount manually.
- Style with `className`, `style`, `data-state`, `data-side`, `data-align`, and the other
  `data-*` hooks. Do not add a CSS import; the package ships no CSS.
- ContextMenu submenus, checkbox items, and radio items exist only in the React adapter.

## Popover

```tsx
<Popover>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent side="bottom" align="start" sideOffset={8}>
    <h2>Edit profile</h2>
    <p>Update your profile information.</p>
    <PopoverClose>Close</PopoverClose>
  </PopoverContent>
</Popover>
```

Controlled:

```tsx
const [open, setOpen] = useState(false);

<Popover open={open} onOpenChange={(next) => setOpen(next)}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>Update your profile information.</PopoverContent>
</Popover>;
```

Use `PopoverTitle` and `PopoverDescription` to wire `aria-labelledby` and `aria-describedby`.
Use `PopoverHeader`, `PopoverPortal`, `PopoverPositioner`, and `PopoverPopup` only when the
higher-level parts are not enough.

## Dialog

```tsx
<Dialog>
  <DialogTrigger>Edit profile</DialogTrigger>
  <DialogContent>
    <DialogTitle>Edit profile</DialogTitle>
    <DialogDescription>Update your profile information.</DialogDescription>
    <DialogClose>Cancel</DialogClose>
  </DialogContent>
</Dialog>
```

- Modal by default: focus containment, inert background, and scroll lock.
- Always provide `DialogTitle` or `aria-label`.
- `DialogContent` uses `initialFocus`, `finalFocus`, `restoreFocus`, `keepMounted`, and
  `animation`.
- Set `modal={false}` only when the dialog must not trap focus or lock scroll.

## Tooltip

```tsx
<TooltipProvider delay={500}>
  <Tooltip>
    <TooltipTrigger>Save</TooltipTrigger>
    <TooltipContent side="top">Save changes</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Tooltips are for supplemental labels, not interactive content. Do not put buttons or links in a
tooltip.

## ContextMenu

```tsx
<ContextMenu>
  <ContextMenuTrigger>Profile card</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={() => edit()}>Edit</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem disabled>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

Selecting an item closes the menu tree. Call `event.preventDefault()` in `onSelect` to keep it
open. Nested submenus close first on Escape or outside press.

## Custom markup with hooks

Use `usePositioner`, `useLayer`, `useOverlay`, and `useEscapeKey` only when the compound components
cannot express your markup. Create them inside components; they are effect-safe under Strict Mode.
`Portal` is available for custom portals.

## Styling

Common hooks:

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Popup, trigger | `"open"` or `"closed"`. |
| `data-side` / `data-align` | Popup, arrow | Resolved placement after flip/shift. |
| `data-animating` | Popup | `"enter"` or `"exit"`. |
| `data-modal` / `data-non-modal` | Dialog popup | Modal mode. |

Arrow styling variables: `--overlay-arrow-background`, `--overlay-arrow-border-width`, and
`--overlay-arrow-border-color`.

## Verify

- Run the app's typecheck and the overlay tests.
- Check keyboard Escape, outside press, Tab/Shift+Tab in dialogs, and focus return.
- Check the popup stays inside the viewport when the page scrolls or the trigger moves.
- In Next.js, confirm the component is inside a client boundary.

## Full API

https://github.com/zealakit/overlay/blob/main/packages/react/README.md
