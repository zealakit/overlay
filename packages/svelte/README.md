# @zealakit/overlay-svelte

[English](https://github.com/zealakit/overlay/blob/main/packages/svelte/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

Headless Popover, Tooltip, Dialog, and ContextMenu components for Svelte 5. Provides compound components, positioning, layered dismissal, focus management, and low-level controllers and actions. You own visual styling.

Style the parts with `class`, `style`, and the `data-*` hooks below. Content stays in the DOM as `hidden` while closed and the controller owns `hidden`, so never bind it yourself; with `animation` the content stays visible until the exit ends.

> **Note**
> Overlay is a focused, headless set of primitives for Popover, Tooltip, Dialog, and ContextMenu. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Select, Combobox, DatePicker, DropdownMenu, Menubar, and command palette are not implemented.
>
> Overlay is not a replacement for a full UI library or design system. Use it when you need accessible overlay primitives without adopting a large kit, or when your current library's overlays are hard to restyle.

## Install

```bash
npm install @zealakit/overlay-svelte

# or yarn, pnpm, ...
```

Peer dependency: `svelte` `^5.0.0`; a Svelte app already provides it. Svelte 5 only; ESM only. Components, controllers, and actions share one entry, `@zealakit/overlay-svelte`. Components ship as `.svelte` files, so use Vite with `@sveltejs/vite-plugin-svelte` (SvelteKit includes it). `@zealakit/overlay-core` is an internal dependency installed automatically; do not install it separately.

## Popover

### Quick start

```svelte
<script lang="ts">
  import {
    Popover,
    PopoverClose,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
  } from "@zealakit/overlay-svelte";
</script>

<Popover placement="bottom-start" offset={8}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Edit profile</PopoverTitle>
      <PopoverDescription>Update your profile information.</PopoverDescription>
    </PopoverHeader>
    <PopoverClose>Close</PopoverClose>
  </PopoverContent>
</Popover>
```

### `Popover` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `bind:open`. |
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
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Called on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The children snippet receives `{ open }`; no other props are forwarded. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `PopoverTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"button"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. Sets `type="button"`, `aria-expanded`, and while open `aria-controls`. |

### `PopoverContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div`. No `role` or focus trap is added; `PopoverTitle` and `PopoverDescription` wire `aria-labelledby` and `aria-describedby`. |

`PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `PopoverClose`, and `PopoverArrow` take `as` and forward the remaining attributes. `PopoverClose` closes the popover.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Popover bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>Update your profile information.</PopoverContent>
</Popover>
```

### Animation configuration

```svelte
<Popover arrow arrowSize={10} animation={{ type: "expand", duration: 220 }}>
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

```svelte
<script lang="ts">
  import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "@zealakit/overlay-svelte";
</script>

<Tooltip placement="top" delay={500}>
  <TooltipTrigger>Edit profile</TooltipTrigger>
  <TooltipContent>Update your profile information.</TooltipContent>
</Tooltip>
```

### `Tooltip` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `bind:open`. |
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
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Called on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The children snippet receives `{ open }`; no other props are forwarded. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `TooltipTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"button"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. While open it gets `aria-describedby`; clicking closes but never opens. |

### `TooltipContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div` with `role="tooltip"`. The content is not focusable. |

Hover opens after `delay`, focus opens immediately, and Escape or an outside press closes. Touch hover is ignored. `TooltipArrow` takes `as` and forwards the remaining attributes.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Tooltip bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <TooltipTrigger>Edit profile</TooltipTrigger>
  <TooltipContent>Update your profile information.</TooltipContent>
</Tooltip>
```

### Animation configuration

`Tooltip` takes the same `animation` option as Popover: pass `true` or a config such as `{ duration: 160 }`. See the [Popover options](https://github.com/zealakit/overlay/blob/main/packages/svelte/README.md#popover).

### `as`

Every part renders a sensible default tag. Pass `as` to change it, for example `as="span"` to wrap a disabled button in a focusable element. The part keeps its ids, ARIA attributes, and refs.

## Dialog

### Quick start

```svelte
<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
  } from "@zealakit/overlay-svelte";
</script>

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

### `Dialog` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `bind:open`. |
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
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Called on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The children snippet receives `{ open }`; no other props are forwarded. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `DialogTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"button"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. Sets `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`. |

### `DialogContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div` with `role="dialog"`. Add a `DialogTitle` or `aria-label` for an accessible name. |

`DialogBackdrop` wraps the viewport and content, so the backdrop, viewport, and content portal and toggle as one unit. `DialogHeader` and `DialogFooter` are layout wrappers; `DialogTitle` and `DialogDescription` wire `aria-labelledby` and `aria-describedby`; `DialogClose` closes the dialog. All take `as`.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Dialog bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <DialogTrigger>Edit profile</DialogTrigger>
  <DialogContent>Update your profile information.</DialogContent>
</Dialog>
```

### Animation configuration

`Dialog` takes the same `animation` option as Popover: pass `true` or a config such as `{ duration: 160 }`. See the [Popover options](https://github.com/zealakit/overlay/blob/main/packages/svelte/README.md#popover).

### `as`

Every part renders a sensible default tag. Pass `as` to change it, for example `as="span"` to wrap a disabled button in a focusable element. The part keeps its ids, ARIA attributes, and refs.

## ContextMenu

### Quick start

```svelte
<script lang="ts">
  import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
  } from "@zealakit/overlay-svelte";
</script>

<ContextMenu>
  <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onselect={() => console.log("edit")}>Edit</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem disabled>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### `ContextMenu` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled visibility. Use `bind:open`. |
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
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Called on every change; `reason` is `trigger`, `escape-key`, `outside-press`, `reference-press`, `select`, or `programmatic`. The children snippet receives `{ open }`; no other props are forwarded. |

The root renders no element. It owns state and shares it with its parts, so a part used outside its root throws a clear error.

### `ContextMenuTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag to render. Use a focusable element. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the element. Sets `tabindex="0"`; right-click, the Context Menu key, and Shift+F10 open the menu. |

### `ContextMenuContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag to render. |
| `...attrs` | `HTMLAttributes` | — | Forwarded to the content `div` with `role="menu"`. Arrow keys, Home, End, and typeahead move focus; the menu is not focus-trapped. |

### `ContextMenuItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Skipped by keyboard navigation and never activates. |
| `closeOnSelect` | `boolean` | `true` | Set `false` to keep the menu open after selecting. |
| `as` | `string` | `"div"` | Tag to render. |
| `onselect` | `(event: MouseEvent) => void` | — | Called on click or keyboard activation. The item renders `role="menuitem"`, `aria-disabled`, and `data-disabled`; other attributes are forwarded. |

`ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator`, and `ContextMenuShortcut` are structural. Submenus, checkbox items, and radio items are not part of this package; use React for them.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<ContextMenu bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
  <ContextMenuContent>Update your profile information.</ContextMenuContent>
</ContextMenu>
```

### Animation configuration

`ContextMenu` takes the same `animation` option as Popover: pass `true` or a config such as `{ duration: 160 }`. See the [Popover options](https://github.com/zealakit/overlay/blob/main/packages/svelte/README.md#popover).

### `as`

Every part renders a sensible default tag. Pass `as` to change it, for example `as="span"` to wrap a disabled button in a focusable element. The part keeps its ids, ARIA attributes, and refs.

## Controllers and actions

The components are built on these lower-level APIs. Use them directly when you need your own markup.

| Export | Purpose |
| --- | --- |
| `createPopover(options)` / `createTooltip(options)` / `createDialog(options)` / `createContextMenu(options)` | Controllers over the shared overlay controller. |
| `createPositioner(options)` | Readable store of the latest position plus `update`, `setOptions`, `dispose`. |
| `createLayer(options)` | Readable `{ id, isTopmost, handle }` store. |
| `use:floating` | Position a node against `reference`. |
| `use:layer` | Register a node in the layer stack. |
| `use:overlay` | Open/closed composition of `floating` and `layer`. |
| `use:outsideInteraction` / `use:escapeKey` / `use:portal` | Standalone outside-press, Escape, and portal actions. |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | Focus primitives re-exported from core. |

```svelte
<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createPopover, type PopoverController } from "@zealakit/overlay-svelte";

  let trigger: HTMLButtonElement;
  let content: HTMLDivElement;
  let popover: PopoverController | undefined;

  onMount(() => {
    popover = createPopover({ trigger, content, placement: "bottom-start" });
  });
  onDestroy(() => popover?.destroy());
</script>

<button bind:this={trigger} type="button">Edit profile</button>
<div bind:this={content}>Update your profile information.</div>
```

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

## Lifecycle

- Components create their controller after mount and destroy it with the component; nothing runs during SSR.
- Create manual controllers in `onMount` and call `destroy()` in `onDestroy`. It is idempotent, so a repeated call or double init does nothing.
- Actions run only in the browser and clean up when the node is destroyed.
- Layers share one reference-counted stack per document.

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

## SvelteKit

No SvelteKit-specific entry exists. Importing the package is safe on the server, and the components render their markup during SSR with the content `hidden`.

## Agent Skill

Add the [Overlay Svelte skill](https://github.com/zealakit/overlay/blob/main/skills/overlay-svelte.md) to your agent's skills directory so it can follow the component, styling, and accessibility rules for this package.

## License

MIT © Zealakit
