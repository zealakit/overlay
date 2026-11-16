# @zealakit/overlay-vue

[English](https://github.com/zealakit/overlay/blob/main/packages/vue/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg)

Headless Popover, Tooltip, Dialog, and ContextMenu components for Vue. Provides compound components, reactive positioning, layered dismissal, focus management, and low-level composables. You own visual styling.

Style the parts with `class`, `style`, and the `data-*` hooks below. Content stays in the DOM as `hidden` while closed and the controller owns `hidden`, so never bind it yourself; with `animation` the content stays visible until the exit ends.

> **Note**
> Overlay is headless: it ships no CSS and renders no styled markup. Popover, Tooltip, Dialog, and ContextMenu are implemented. Select, Combobox, DatePicker, DropdownMenu, Menubar, and command palette are not.

## Install

```bash
npm install @zealakit/overlay-vue vue
```

Peer dependency: `vue` `^3.5.0`. ESM only. The components are plain render functions, so no extra build step is needed. `@zealakit/overlay-core` is an internal dependency installed automatically; do not install it separately.

## Popover

### Quick start

```vue
<script setup lang="ts">
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@zealakit/overlay-vue";
</script>

<template>
  <Popover placement="bottom-start" :offset="8">
    <PopoverTrigger>Edit profile</PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Edit profile</PopoverTitle>
        <PopoverDescription>Update your profile information.</PopoverDescription>
      </PopoverHeader>
      <PopoverClose>Close</PopoverClose>
    </PopoverContent>
  </Popover>
</template>
```

### `Popover` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `v-model:open`. |
| `defaultOpen` | `boolean` | `false` | Initial visibility when uncontrolled. |
| `disabled` | `boolean` | `false` | Closes the overlay and ignores the trigger. |
| `placement` | `Placement` | `"bottom-start"` (Tooltip `"top"`) | Side plus optional `-start` or `-end`. |
| `offset` / `alignOffset` | `number` | `0` | Main-axis gap and cross-axis offset in pixels. |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | Collision handling and repositioning on scroll and resize. |
| `padding` | `number` | `0` | Gap from the collision boundary. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Collision boundary. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Automatic: `absolute`, or `fixed` for fixed/sticky anchors. |
| `dir` | `"ltr" \| "rtl"` | — | Applied to the content element. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Close on Escape or on a primary press outside. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portals to `document.body`, an element selects a container, `false` renders in place. |
| `animation` | `boolean \| AnimationConfig` | — | Off unless `true` or a config is passed. |
| `arrow` | `boolean` | `false` | Position the arrow part. Render the arrow component inside the content. |
| `arrowSize` / `arrowPadding` | `number` | `8` / `0` | Arrow edge length and gap from the popup edges, in pixels. |
| `trapFocus` | `boolean` | `false` | Contain focus while this layer is topmost. |
| `initialFocus` | `boolean \| "container" \| "first" \| Element \| null` | — | Where focus lands on open; none by default. |
| `restoreFocus` | `boolean` | `true` | Return focus to the trigger when closing from inside. |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Emitted on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The default slot receives `{ open }`. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `PopoverTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. Sets `type="button"`, `aria-expanded`, and while open `aria-controls`. |

### `PopoverContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div`. No `role` or focus trap is added; `PopoverTitle` and `PopoverDescription` wire `aria-labelledby` and `aria-describedby`. |

`PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `PopoverClose`, and `PopoverArrow` take `as` and forward the remaining attributes. `PopoverClose` closes the popover.

### Controlled usage

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

### Animation configuration

```vue
<Popover arrow :arrow-size="10" :animation="{ type: 'expand', duration: 220 }">
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>
    Update your profile information.
    <PopoverArrow />
  </PopoverContent>
</Popover>
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

```css
.panel {
  --overlay-arrow-background: #121a27;
  --overlay-arrow-border-width: 1px;
  --overlay-arrow-border-color: #3d5478;
}
```

### `as`

Every part renders a sensible default tag. Pass `as` to change it, for example `as="span"` to wrap a disabled button in a focusable element. The part keeps its ids, ARIA attributes, and refs.

## Tooltip

### Quick start

```vue
<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from "@zealakit/overlay-vue";
</script>

<template>
  <Tooltip placement="top" :delay="500">
    <TooltipTrigger>Edit profile</TooltipTrigger>
    <TooltipContent>Update your profile information.</TooltipContent>
  </Tooltip>
</template>
```

### `Tooltip` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `v-model:open`. |
| `defaultOpen` | `boolean` | `false` | Initial visibility when uncontrolled. |
| `disabled` | `boolean` | `false` | Closes the overlay and ignores the trigger. |
| `placement` | `Placement` | `"bottom-start"` (Tooltip `"top"`) | Side plus optional `-start` or `-end`. |
| `offset` / `alignOffset` | `number` | `0` | Main-axis gap and cross-axis offset in pixels. |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | Collision handling and repositioning on scroll and resize. |
| `padding` | `number` | `0` | Gap from the collision boundary. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Collision boundary. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Automatic: `absolute`, or `fixed` for fixed/sticky anchors. |
| `dir` | `"ltr" \| "rtl"` | — | Applied to the content element. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Close on Escape or on a primary press outside. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portals to `document.body`, an element selects a container, `false` renders in place. |
| `animation` | `boolean \| AnimationConfig` | — | Off unless `true` or a config is passed. |
| `arrow` | `boolean` | `false` | Position the arrow part. Render the arrow component inside the content. |
| `arrowSize` / `arrowPadding` | `number` | `8` / `0` | Arrow edge length and gap from the popup edges, in pixels. |
| `delay` | `number` | `500` | Hover opening delay in milliseconds. |
| `closeDelay` | `number` | `100` | Delay before closing after pointer or focus leaves. |
| `hoverableContent` | `boolean` | `true` | Keep open while the pointer is over the content. |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Emitted on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The default slot receives `{ open }`. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `TooltipTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. While open it gets `aria-describedby`; clicking closes but never opens. |

### `TooltipContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div` with `role="tooltip"`. The content is not focusable. |

Hover opens after `delay`, focus opens immediately, and Escape or an outside press closes. Touch hover is ignored. `TooltipArrow` takes `as` and forwards the remaining attributes.

### Controlled usage

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <Tooltip v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <TooltipTrigger>Edit profile</TooltipTrigger>
    <TooltipContent>Update your profile information.</TooltipContent>
  </Tooltip>
</template>
```

### Animation configuration

`Tooltip` takes the same `animation` option as Popover: pass `true` or a config such as `{ duration: 160 }`. See the [Popover options](https://github.com/zealakit/overlay/blob/main/packages/vue/README.md#popover).

### `as`

Every part renders a sensible default tag. Pass `as` to change it, for example `as="span"` to wrap a disabled button in a focusable element. The part keeps its ids, ARIA attributes, and refs.

## Dialog

### Quick start

```vue
<script setup lang="ts">
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-vue";
</script>

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

### `Dialog` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `v-model:open`. |
| `defaultOpen` | `boolean` | `false` | Initial visibility when uncontrolled. |
| `disabled` | `boolean` | `false` | Closes the overlay and ignores the trigger. |
| `placement` | `Placement` | — | Dialogs are not anchored. |
| `dir` | `"ltr" \| "rtl"` | — | Applied to the content element. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Close on Escape or on a primary press outside. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portals to `document.body`, an element selects a container, `false` renders in place. |
| `animation` | `boolean \| AnimationConfig` | — | Off unless `true` or a config is passed. |
| `modal` | `boolean` | `true` | Modal: `aria-modal`, focus containment, inert background, scroll lock. |
| `lockScroll` | `boolean` | `modal` | Lock document scrolling while open. |
| `trapFocus` | `boolean` | `modal` | Contain focus while this layer is topmost. |
| `initialFocus` | `boolean \| "container" \| "first" \| Element \| null` | `"container"` when modal | Where focus lands on open; `null` keeps focus in place. |
| `restoreFocus` | `boolean` | `true` | Restore focus on close. |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Emitted on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The default slot receives `{ open }`. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `DialogTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. Sets `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`. |

### `DialogContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div` with `role="dialog"`. Add a `DialogTitle` or `aria-label` for an accessible name. |

`DialogBackdrop` wraps the viewport and content, so the backdrop, viewport, and content portal and toggle as one unit. `DialogHeader` and `DialogFooter` are layout wrappers; `DialogTitle` and `DialogDescription` wire `aria-labelledby` and `aria-describedby`; `DialogClose` closes the dialog. All take `as`.

### Controlled usage

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <Dialog v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <DialogTrigger>Edit profile</DialogTrigger>
    <DialogContent>Update your profile information.</DialogContent>
  </Dialog>
</template>
```

### Animation configuration

`Dialog` takes the same `animation` option as Popover: pass `true` or a config such as `{ duration: 160 }`. See the [Popover options](https://github.com/zealakit/overlay/blob/main/packages/vue/README.md#popover).

### `as`

Every part renders a sensible default tag. Pass `as` to change it, for example `as="span"` to wrap a disabled button in a focusable element. The part keeps its ids, ARIA attributes, and refs.

## ContextMenu

### Quick start

```vue
<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@zealakit/overlay-vue";
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem @select="console.log('edit')">Edit</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem disabled>Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
```

### `ContextMenu` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `v-model:open`. |
| `defaultOpen` | `boolean` | `false` | Initial visibility when uncontrolled. |
| `disabled` | `boolean` | `false` | Closes the overlay and ignores the trigger. |
| `placement` | `Placement` | `"bottom-start"` (Tooltip `"top"`) | Side plus optional `-start` or `-end`. |
| `offset` / `alignOffset` | `number` | `0` | Main-axis gap and cross-axis offset in pixels. |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | Collision handling and repositioning on scroll and resize. |
| `padding` | `number` | `0` | Gap from the collision boundary. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Collision boundary. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Automatic: `absolute`, or `fixed` for fixed/sticky anchors. |
| `dir` | `"ltr" \| "rtl"` | — | Applied to the content element. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Close on Escape or on a primary press outside. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portals to `document.body`, an element selects a container, `false` renders in place. |
| `animation` | `boolean \| AnimationConfig` | — | Off unless `true` or a config is passed. |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Emitted on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The default slot receives `{ open }`. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `ContextMenuTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. Sets `tabindex="0"`; right-click, the Context Menu key, and Shift+F10 open the menu. |

### `ContextMenuContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div` with `role="menu"`. Arrow keys, Home, End, and typeahead move focus; the menu is not focus-trapped. |

### `ContextMenuItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Skipped by keyboard navigation and never activates. |
| `closeOnSelect` | `boolean` | `true` | Set `false` to keep the menu open after selecting. |
| `as` | `string \| Component` | `"div"` | Tag to render. |
| `@select` | `(event: MouseEvent) => void` | — | Called on click or keyboard activation. The item renders `role="menuitem"`, `aria-disabled`, and `data-disabled`; other attributes are forwarded. |

`ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator`, and `ContextMenuShortcut` are structural. Submenus, checkbox items, and radio items are not part of this package; use React for them.

### Controlled usage

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <ContextMenu v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
    <ContextMenuContent>Update your profile information.</ContextMenuContent>
  </ContextMenu>
</template>
```

### Animation configuration

`ContextMenu` takes the same `animation` option as Popover: pass `true` or a config such as `{ duration: 160 }`. See the [Popover options](https://github.com/zealakit/overlay/blob/main/packages/vue/README.md#popover).

### `as`

Every part renders a sensible default tag. Pass `as` to change it, for example `as="span"` to wrap a disabled button in a focusable element. The part keeps its ids, ARIA attributes, and refs.

## Composables

The components are built on these composables. Use them directly when you need your own markup.

| Export | Purpose |
| --- | --- |
| `usePopover(options)` / `useTooltip(options)` / `useDialog(options)` / `useContextMenu(options)` | Controller composables over template refs. |
| `useOverlayComponent(kind, options)` | The generic form of the four composables. |
| `usePositioner(options)` | Reactive positioner returning a `shallowRef` result. |
| `useLayer(options)` | Register a layer while mounted; nested layers via `parent`. |
| `useOverlay(options)` | Uncontrolled open state composed from `usePositioner` and `useLayer`. |
| `useEscapeKey(handler, options?)` | Escape listener with `enabled` and `target`. |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | Focus primitives re-exported from core. |

```vue
<script setup lang="ts">
import { ref } from "vue";
import { usePopover } from "@zealakit/overlay-vue";

const trigger = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const { isOpen, close } = usePopover({ trigger, content, placement: "bottom-start" });
</script>

<template>
  <button ref="trigger" type="button">Edit profile</button>
  <div ref="content">
    Update your profile information.
    <button type="button" @click="close()">Close</button>
  </div>
</template>
```

Every option accepts a `ref` or getter (`MaybeRefOrGetter`) except callbacks. The return value has `isOpen` (`Ref<boolean>`), `controller`, `contentId`, `open()`, `close()`, `toggle()`, `setOpen()`, `update()`, and `dispose()`.

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

## Lifecycle

- No DOM work runs during render or SSR setup; controllers are created in `onMounted`.
- Each composable is disposed on `onScopeDispose`; outside a scope call the returned `dispose()`.
- `dispose()` is idempotent, so a second call or a remount does nothing extra.
- Nested overlays share one reference-counted layer stack per document, so Escape closes the topmost first.

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

## Nuxt

Importing the package is safe on the server, and overlay content only becomes interactive after mount. Wrap components that create controllers manually in `<ClientOnly>`.

## AI Agent Skill

Coding agents working on this package load the [overlay skill](https://github.com/zealakit/overlay/blob/main/.agents/skills/overlay/SKILL.md) first.

## License

MIT © Zealakit
