# @zealakit/overlay-core

[English](https://github.com/zealakit/overlay/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/core/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

Internal positioning, layering, focus, and DOM-controller kernel for every Zealakit Overlay adapter. Core is private and never published to npm: every adapter bundles its own copy, so application code uses the adapter for its framework. This reference is for contributors working on the adapters inside the monorepo.

Core renders nothing and ships no CSS. Controllers write only inline `position`, `left`, `top` and `data-*` attributes, so your CSS owns every visual and exit animations collapse cleanly.

> **Note**
> Overlay is a focused, headless set of primitives for Popover, Tooltip, Dialog, and ContextMenu. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Select, Combobox, DatePicker, DropdownMenu, Menubar, and command palette are not implemented.
>
> Overlay is not a replacement for a full UI library or design system. Use it when you need accessible overlay primitives without adopting a large kit, or when your current library's overlays are hard to restyle.

## Install

```bash
pnpm --filter @zealakit/overlay-core run build
```

Core is not on npm, so it cannot be installed. It is built inside the workspace and, at release time, copied into each adapter tarball under `dist/vendor/core`. Page-global state (layer stack, scroll lock, modal background, id counter) lives on `globalThis`, so several adapters on one page still share it. No peer dependencies. The only runtime dependency is `@floating-ui/dom`, which every adapter declares in its place and which stays behind `createPositioner()`, never appearing in public types.

## Public API

| Export | Purpose |
| --- | --- |
| `createPositioner(options)` | Collision-aware positioner: `setReference`, `setFloating`, `setOptions`, `update`, `subscribe`, `dispose`. |
| `computePosition`, `resolvePlacementCoordinates`, `parsePlacement`, `DEFAULT_PLACEMENT` | Synchronous placement math without collision handling. |
| `getArrowStyles`, `applyArrowStyles`, `resetArrowStyles`, `snapshotArrowStyles` | Arrow geometry helpers for custom integrations. |
| `createLayerStack`, `acquireSharedLayerStack`, `createLayerStackRegistry` | Layer ordering plus one Escape/outside listener pair per document. |
| `createLayer` | Open/closed state machine with subscription. |
| `createOverlayController` | Shared DOM controller for popover, tooltip, dialog, and context menu. |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | Focus primitives. |
| `acquireModalBackground` | Mark body siblings inert while a modal is open; stacks per document. |
| `moveToPortal`, `restorePortal` | Move an element into a portal target and put it back. |
| `getMenuItems`, `moveMenuFocus`, `focusFirstMenuItem`, `focusLastMenuItem`, `focusMenuTypeahead`, `createTypeaheadBuffer` | Menu roving focus and typeahead. |
| `lockBodyScroll` | Reference-counted body scroll lock. |
| `runOverlayAnimation`, `createFadeKeyframes`, `createExpandKeyframes`, `normalizeAnimationConfig` | Enter/exit animation runner and helpers. |
| `listen`, `isEscapeKey`, `isOutsidePress`, `isPointerOutside`, `isPrimaryPointer`, `isBrowser` | Event and environment helpers. |
| `isSamePositionerResult` | Compare positioner results to skip redundant updates. |

## Usage

### Quick start

```ts
import { createPositioner } from "@zealakit/overlay-core";

const positioner = createPositioner({
  reference: trigger,
  floating: panel,
  placement: "bottom-start",
  offset: 8,
});

positioner.subscribe(({ x, y, placement, strategy }) => {
  Object.assign(panel.style, { position: strategy, left: `${x}px`, top: `${y}px` });
  panel.dataset.placement = placement;
});

await positioner.update();
positioner.dispose();
```

### `createPositioner` options

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `reference` | `ReferenceElement \| null` | — | Anchor element or virtual `{ getBoundingClientRect }`. |
| `floating` | `HTMLElement \| null` | — | Element to place. |
| `placement` | `Placement` | `"bottom"` | Side plus optional `-start` or `-end`. |
| `offset` | `number` | `0` | Main-axis gap in pixels. |
| `alignOffset` | `number` | `0` | Cross-axis offset in pixels. |
| `flip` | `boolean` | `true` | Flip to the opposite side on overflow. |
| `shift` | `boolean` | `true` | Shift along the cross axis to stay visible. |
| `padding` | `number` | `0` | Gap from the boundary. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Collision boundary. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Automatic: `absolute`, or `fixed` for fixed/sticky anchors. |
| `autoUpdate` | `boolean` | `true` | Reposition on scroll, resize, and layout changes. |
| `arrow` | `{ element, padding? } \| null` | `null` | Measure an arrow element and report its offset. |
| `...` | — | — | The positioner accepts only these options and never touches focus, ARIA, or `hidden`. |

`update()` resolves `null` when an element is missing or detached, or when a newer update supersedes it. Subscribers only receive the latest measurement.

### Controller options

`createOverlayController({ kind, ... })` takes `kind` (`"popover" | "tooltip" | "dialog" | "context-menu"`) plus the options below.

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

The controller sets `role`, `aria-expanded`, `aria-controls`, `aria-haspopup`, `hidden`, and `data-state` for the chosen kind. Escape and outside presses reach only the topmost layer.

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

### Animation configuration

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

## Lifecycle

- Create positioners and controllers only in the browser, after elements exist.
- Call `update()` or `setOptions()` while mounted; both are safe to repeat.
- Call `dispose()` or `destroy()` on teardown. Both are idempotent, so a double call or a second init does nothing.
- Importing the package is safe during SSR; `createOverlayController` throws without a DOM.

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

## License

MIT © Zealakit
