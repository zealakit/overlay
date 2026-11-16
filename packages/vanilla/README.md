# @zealakit/overlay-vanilla

[English](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg)

Headless Popover, Tooltip, Dialog, and ContextMenu for plain TypeScript and JavaScript. Provides declarative `data-*` markup, imperative controllers, positioning, a layer stack, focus handling, and ARIA wiring on elements you own. You own visual styling.

Style the trigger and content with your own CSS and the `data-*` hooks below. The controller toggles `hidden` on the content, so keep exit animations in `animation` rather than relying on `display: none`.

> **Note**
> Overlay is headless: it ships no CSS and renders no styled markup. Popover, Tooltip, Dialog, and ContextMenu are implemented. Select, Combobox, DatePicker, DropdownMenu, Menubar, and command palette are not.

## Install

```bash
npm install @zealakit/overlay-vanilla
```

No peer dependencies. `@zealakit/overlay-core` is an internal dependency installed automatically; do not install it separately. ESM only.

## Public API

| Export | Purpose |
| --- | --- |
| `initOverlays(root?)` | Turn `[data-overlay]` markup into controllers; returns `{ get, refresh, destroy }`. |
| `createPopover(options)` | Non-modal anchored panel with click toggle. |
| `createTooltip(options)` | Hover and focus tooltip with delays and `role="tooltip"`. |
| `createDialog(options)` | Modal or non-modal dialog with focus containment and scroll lock. |
| `createContextMenu(options)` | Right-click and keyboard menu with roving focus and typeahead. |
| `createOverlay(options)` | Low-level click-triggered popover over a reference and a floating element. |
| `createFloating(options)` | Core positioner that writes `position`, `left`, `top`, and `data-placement`. |
| `createLayerStack(options?)` | Layer registry for one document: ordering, nesting, Escape and outside routing. |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | Focus primitives for custom overlays. |

## Markup

### Quick start

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

### Host attributes

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data-overlay` | `"popover" \| "tooltip" \| "dialog" \| "context-menu"` | **required** | Kind of overlay the host creates. |
| `data-placement` | `Placement` | `"bottom-start"` | Tooltip defaults to `top`. Dialog is not anchored. |
| `data-offset` / `data-align-offset` / `data-padding` | `number` | `0` | Gaps and offsets in pixels. |
| `data-flip` / `data-shift` / `data-auto-update` | `boolean` | `true` | Write `false` to turn off. |
| `data-strategy` | `"absolute" \| "fixed"` | automatic | Automatic: `absolute`, or `fixed` for fixed/sticky anchors. |
| `data-dir` | `"ltr" \| "rtl"` | — | Applied to the content element. |
| `data-dismiss-on-escape` / `data-dismiss-on-outside-press` | `boolean` | `true` | Write `false` to turn off. |
| `data-portal` | `"inline" \| "#selector"` | `document.body` | `inline` keeps the content in place; a selector picks a container. |
| `data-animation` / `data-animation-duration` | `"true" \| "fade" \| "expand"` / `number` | — | Off unless set. Duration is in milliseconds. |
| `data-arrow-size` | `number` | `8` | Used when the content has `[data-arrow]`. |
| `data-delay` / `data-close-delay` / `data-hoverable-content` | `number` / `boolean` | `500` / `100` / `true` | Tooltip only. |
| `data-modal` / `data-lock-scroll` / `data-trap-focus` | `boolean` | `true` / `modal` / `modal` | Dialog only. |
| `data-initial-focus` / `data-restore-focus` | `"container" \| "first" \| "none"` / `boolean` | `"container"` when modal / `true` | Where focus lands on open, and whether it returns on close. |
| `data-default-open` / `data-disabled` | `boolean` | `false` | Initial state and disabled state. |
| `...` | — | — | Other attributes stay on the host. The host dispatches `overlay-change` with `{ open, reason }` and, for context menus, `overlay-select` with `{ item, event }`; both bubble. |

### Child markers

| Attribute | Where | Purpose |
| --- | --- | --- |
| `[data-trigger]` | Direct child of the host | The element that opens the overlay. A hidden stand-in is used when it is missing. |
| `[data-content]` | Direct child of the host, or inside `[data-backdrop]` | The floating element; give it `hidden` in the markup. |
| `[data-backdrop]` | Direct child of the host | Dialog wrapper. It may contain the content, and then both portal and toggle as one unit. |
| `[data-arrow]` | Inside the content | Arrow element for Popover and Tooltip; positioned by the controller. |
| `[data-title]` / `[data-description]` | Inside the content | Gets an id and wires `aria-labelledby` / `aria-describedby` on the content. |
| `[data-close]` | Inside the content | Closes the overlay it belongs to when clicked. |
| `[data-item]` | Inside a context-menu content | Becomes a `role="menuitem"`; add `data-disabled` to disable and `data-keep-open` to stay open. |

`initOverlays()` skips hosts that already own a controller, so calling it twice is safe. After adding or removing markup call `refresh()`; call `destroy()` when the page tears down. `get(idOrElement)` returns the controller for a host.

## Usage

### Quick start

```ts
import { createDialog } from "@zealakit/overlay-vanilla";

const dialog = createDialog({
  trigger: document.querySelector<HTMLElement>("#open")!,
  content: document.querySelector<HTMLElement>("#panel")!,
  onOpenChange: (open, reason) => console.log(open, reason),
});

document.querySelector("#close")?.addEventListener("click", () => dialog.close());
```

### Controller options

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `trigger` | `HTMLElement` | **required** | Element that anchors and invokes the overlay. |
| `content` | `HTMLElement` | **required** | Floating element you own. The controller toggles `hidden` and `data-state`. |
| `backdrop` | `HTMLElement \| null` | — | Dialog backdrop element. |
| `open` | `boolean` | — | Controlled visibility; reflect external state with `setOpen()`. |
| `defaultOpen` | `boolean` | `false` | Initial visibility when uncontrolled. |
| `disabled` | `boolean` | `false` | Closes the overlay and ignores triggers. |
| `onOpenChange` | `(open, reason) => void` | — | Called on every user or programmatic change. |
| `onSelect` | `(item, event) => void` | — | ContextMenu only: an item was activated. |
| `portal` | `Element \| null` | — | Move content (and backdrop) here while open. |
| `stack` | `LayerStack` | per-document | Share an explicit layer stack. |
| `parentLayer` | `LayerStackHandle \| null` | — | Parent layer for nested overlays. |
| `boundaries` | `(Element \| null)[]` | — | Extra elements that count as inside. |
| `placement` | `Placement` | `"bottom-start"` | Tooltip defaults to `top`. Dialog is not anchored. |
| `offset` | `number` | `0` | Main-axis gap in pixels. |
| `alignOffset` | `number` | `0` | Cross-axis offset in pixels. |
| `flip` | `boolean` | `true` | Flip to the opposite side when there is no room. |
| `shift` | `boolean` | `true` | Shift along the cross axis to stay visible. |
| `padding` | `number` | `0` | Gap from the collision boundary. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Collision boundary. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Automatic: `absolute`, or `fixed` for fixed/sticky anchors. |
| `autoUpdate` | `boolean` | `true` | Reposition on scroll, resize, and layout changes. |
| `arrow` | `{ element, size?, padding? } \| null` | — | Popover and Tooltip only; you own the arrow element. |
| `animation` | `boolean \| AnimationConfig` | — | Off unless `true` or a config is passed. |
| `dir` | `"ltr" \| "rtl"` | — | Applied to the content element. |
| `dismissOnEscape` | `boolean` | `true` | Close on Escape (topmost layer only). |
| `dismissOnOutsidePress` | `boolean` | `true` | Close on a primary press outside. |
| `modal` | `boolean` | `true` | Dialog only: inert background, focus containment, scroll lock. |
| `lockScroll` | `boolean` | `true` | Dialog only, while `modal`. |
| `trapFocus` | `boolean` | `modal` | Dialog follows `modal`; Popover defaults to `false`. |
| `initialFocus` | `"container" \| "first" \| Element \| boolean \| null` | — | Dialog: container when modal. ContextMenu: first item. Popover: none. |
| `finalFocus` | `Element \| null` | — | Where focus returns on close; defaults to the trigger. |
| `restoreFocus` | `boolean` | `true` | Restore focus on close. |
| `delay` | `number` | `500` | Tooltip only: open delay in milliseconds. |
| `closeDelay` | `number` | `100` | Tooltip only: close delay in milliseconds. |
| `hoverableContent` | `boolean` | `true` | Tooltip only: keep open while the pointer is over the content. |
| `labelledBy` / `describedBy` | `string` | — | Dialog only: ids for `aria-labelledby` / `aria-describedby`. |
| `toggleOnTriggerClick` | `boolean` | `true` | Popover and Dialog: toggle when the trigger is clicked. |
| `...` | — | — | No other attributes are forwarded; set them on your own elements. |

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | — | Current visibility (read-only). |
| `contentId` | `string` | — | Id assigned to the content element. |
| `open(reason?)` / `close(reason?)` / `toggle(reason?)` | `void` | — | Change visibility and call `onOpenChange`. |
| `openAt(point, reason?)` | `void` | — | ContextMenu: open at `{ x, y }`; `null` anchors to the trigger. |
| `setOpen(open)` | `void` | — | Reflect controlled state without calling `onOpenChange`. |
| `setOptions(patch)` | `void` | — | Update options after creation. |
| `update()` | `Promise<PositionerResult \| null>` | — | Re-measure; resolves `null` while closed. |
| `subscribe(listener)` | `() => void` | — | Called immediately and on every change with `{ isOpen, placement, point }`. |
| `destroy()` | `void` | — | Idempotent; removes listeners and restores attributes. |

Controllers are uncontrolled by default. Pass `open` and call `setOpen()` when your own state drives visibility; `onOpenChange` still reports user intent.

### Controlled usage

```ts
let open = false;
const popover = createPopover({
  trigger,
  content,
  open,
  onOpenChange: (next) => {
    open = next;
    popover.setOpen(open);
  },
});
```

### Animation configuration

```ts
createPopover({
  trigger,
  content,
  arrow: { element: arrowEl, size: 10, padding: 8 },
  animation: { type: "expand", duration: 220 },
});
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` with a config | Set `false` to turn the animation off. |
| `type` | `"fade" \| "expand" \| "custom"` | `"fade"` | `expand` grows out of the anchor edge; `custom` is inferred when `custom` is set. |
| `direction` | `"up" \| "down" \| "left" \| "right" \| "auto"` | `"auto"` | Travel direction; `auto` follows the resolved placement. |
| `duration` | `number` | `160` | Milliseconds. |
| `delay` | `number` | `0` | Milliseconds. |
| `easing` | `string` | `"ease-in-out"` | `ease-in-out`, `linear`, or any CSS timing function. |
| `custom` | `{ enter, exit } \| keyframes` | — | CSS classes or Web Animations keyframes (array or function). |
| `...` | — | — | Pass `true` for the defaults. Exit replays enter in reverse; reduced motion keeps only opacity. |

### `createOverlay`

```ts
const overlay = createOverlay({
  reference: trigger,
  floating: panel,
  placement: "bottom-start",
  portal: document.body,
  onOpenChange: (open, reason) => console.log(open, reason),
});
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `reference` | `Element` | **required** | Anchor element; clicking it toggles when `trigger` is `"click"`. |
| `floating` | `HTMLElement` | **required** | Element to position. It is hidden while closed. |
| `trigger` | `"click" \| "none"` | `"click"` | `none` leaves toggling to your code. |
| `placement` / `offset` / `alignOffset` / `flip` / `shift` / `padding` / `boundary` / `strategy` / `autoUpdate` | — | — | Same as the controller options above; `placement` defaults to `"bottom"`. |
| `portal` | `Element \| null` | — | Move `floating` here while open; it returns on close. |
| `stack` / `boundaries` / `defaultOpen` / `dismissOnEscape` / `dismissOnOutsidePress` | — | — | Same as the controller options above. |
| `onOpenChange` | `(open, reason?) => void` | — | `reason` is a dismiss reason such as `"escape-key"` or `"reference-press"` on close. |

`createOverlay` returns `isOpen`, `placement`, `open()`, `close(reason?)`, `toggle()`, `update()`, `subscribe(listener)`, and `destroy()`. It is a thin wrapper over the popover controller.

## Lifecycle

- Create controllers after the elements exist and in the browser only; `initOverlays`, `createOverlay`, and the controllers do nothing or throw without a DOM.
- Guard against double init: `initOverlays` skips initialized hosts, and manual controllers should be one per trigger, reused with `setOptions()`.
- Call `destroy()` when the elements go away. It is idempotent and restores attributes, portal position, and focus.
- Controllers share one reference-counted layer stack per document unless you pass `stack`.

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Content, trigger | `"open"` or `"closed"`. |
| `data-open` / `data-closed` | Content | Presence flags for CSS selectors. |
| `data-side` / `data-align` / `data-placement` | Content | Resolved placement after flip and shift. |
| `data-animating` | Content | `"enter"` or `"exit"` while an animation runs. |
| `--overlay-transform-origin` | Content | Anchor-edge origin for class-based animation. |
| `--overlay-arrow-*` | Panel or ancestor | Arrow background, border width, and border color. |

```css
.panel {
  --overlay-arrow-background: #121a27;
  --overlay-arrow-border-width: 1px;
  --overlay-arrow-border-color: #3d5478;
}
```

## AI Agent Skill

Coding agents working on this package load the [overlay skill](https://github.com/zealakit/overlay/blob/main/.agents/skills/overlay/SKILL.md) first.

## License

MIT © Zealakit
