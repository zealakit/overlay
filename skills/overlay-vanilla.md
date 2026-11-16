---
name: overlay-vanilla
description: >-
  Use when adding @zealakit/overlay-vanilla to a plain TypeScript/JavaScript app:
  data-* markup, initOverlays, controllers, styling hooks, and lifecycle rules.
---

# Overlay for Vanilla

Use `@zealakit/overlay-vanilla` for headless Popover, Tooltip, Dialog, and ContextMenu behavior in
plain TypeScript or JavaScript. The package owns positioning, layering, dismissal, focus, and ARIA
wiring. You own the markup and all CSS.

`@zealakit/overlay-core` is an internal dependency installed automatically. Never install it or
import from it in application code.

## Install

```bash
npm install @zealakit/overlay-vanilla
# or: pnpm add @zealakit/overlay-vanilla
# or: yarn add @zealakit/overlay-vanilla
```

No peer dependencies. ESM only. Import every function you use from the same package entry.

## Import

```ts
import {
  initOverlays,
  createPopover,
  createTooltip,
  createDialog,
  createContextMenu,
} from "@zealakit/overlay-vanilla";
```

## Rules

- Prefer declarative `data-*` markup with `initOverlays()`. Use the imperative controllers only
  when the markup cannot express the behavior.
- Give the content `hidden` in the initial HTML. The controller owns `hidden` and `data-state`
  after initialization; do not toggle `hidden` yourself.
- Do not rebuild positioning, outside-press, Escape, focus, or ARIA behavior yourself.
- Run initialization in the browser after the elements exist. Guard against double init:
  `initOverlays()` skips hosts that already have a controller.
- Call `refresh()` after adding or removing marked-up hosts, and `destroy()` when the page tears
  down. `destroy()` is idempotent.
- Style with `data-state`, `data-side`, `data-align`, `data-placement`, and the other `data-*`
  hooks. Do not add a CSS import; the package ships no CSS.
- ContextMenu submenus, checkbox items, and radio items do not exist in the Vanilla adapter.

## Declarative markup

```html
<div data-overlay="popover" data-placement="bottom-start" data-offset="8">
  <button data-trigger type="button">Edit profile</button>
  <div data-content hidden>
    <h2 data-title>Edit profile</h2>
    <p data-description>Update your profile information.</p>
    <button data-close type="button">Close</button>
  </div>
</div>
```

```ts
import { initOverlays } from "@zealakit/overlay-vanilla";

const overlays = initOverlays();

document.addEventListener("overlay-change", (event) => {
  console.log((event as CustomEvent).detail); // { open, reason }
});
```

Host attributes:

| Attribute | Values | Purpose |
| --- | --- | --- |
| `data-overlay` | `popover`, `tooltip`, `dialog`, `context-menu` | Required overlay kind. |
| `data-placement` | `bottom-start`, `top`, ... | Preferred placement; Tooltip defaults to `top`. |
| `data-offset` / `data-align-offset` | number | Main-axis and cross-axis gaps. |
| `data-flip` / `data-shift` / `data-auto-update` | `true` / `false` | Collision handling and repositioning. |
| `data-portal` | `inline`, `#selector` | Render in place or portal to a container. |
| `data-animation` | `true`, `fade`, `expand` | Opt-in animation. |
| `data-dismiss-on-escape` / `data-dismiss-on-outside-press` | `true` / `false` | Dismissal policy. |
| `data-modal` / `data-lock-scroll` / `data-trap-focus` | `true` / `false` | Dialog mode. |

Child markers: `data-trigger`, `data-content`, `data-backdrop`, `data-arrow`, `data-title`,
`data-description`, `data-close`, and `data-item` for context-menu items.

## Imperative controller

```ts
import { createDialog } from "@zealakit/overlay-vanilla";

const dialog = createDialog({
  trigger: document.querySelector<HTMLElement>("#open")!,
  content: document.querySelector<HTMLElement>("#panel")!,
  onOpenChange: (open, reason) => console.log(open, reason),
});

document.querySelector("#close")?.addEventListener("click", () => dialog.close());
```

Controllers return `open()`, `close(reason?)`, `toggle()`, `setOpen()`, `setOptions()`, `update()`,
`subscribe()`, and `destroy()`. Use `open` + `setOpen()` when your own state drives visibility;
`onOpenChange` still reports user intent.

For custom anchoring and positioning, `createOverlay` and `createFloating` are available. Use
`createLayerStack` and the focus helpers only for custom primitives beyond the four built-ins.

## Styling

Common hooks:

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Content, trigger | `"open"` or `"closed"`. |
| `data-side` / `data-align` / `data-placement` | Content | Resolved placement after flip/shift. |
| `data-animating` | Content | `"enter"` or `"exit"`. |
| `data-modal` / `data-non-modal` | Dialog content | Modal mode. |

Arrow styling variables: `--overlay-arrow-background`, `--overlay-arrow-border-width`, and
`--overlay-arrow-border-color`.

## Verify

- Run the app's typecheck and the overlay tests.
- Check keyboard Escape, outside press, Tab/Shift+Tab in dialogs, and focus return.
- Check the popup stays inside the viewport when the page scrolls or the trigger moves.
- Confirm initialization runs after the host elements exist and that `destroy()` removes listeners.

## Full API

https://github.com/zealakit/overlay/blob/main/packages/vanilla/README.md
