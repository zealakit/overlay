# Popover (React)

Headless, non-modal Popover built on `@zealakit/overlay-core` and the React adapter's
lower-level hooks. No styles are shipped.

## Anatomy

```tsx
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
</Popover>
```

- `Popover` owns open state and generated relationship IDs. It renders no DOM.
- `PopoverTrigger` renders a native button by default, or merges behavior onto a child with
  `asChild`.
- `PopoverContent` is the convenient composition:
  `PopoverPortal -> PopoverPositioner -> PopoverPopup` (portal enabled by default).
- `PopoverHeader`, `PopoverTitle`, `PopoverDescription`, and `PopoverClose` are optional.
  Title/Description establish `aria-labelledby`/`aria-describedby` relationships on the popup.

## Advanced composition

```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverPortal container={customContainer}>
    <PopoverPositioner side="top" align="end" sideOffset={8}>
      <PopoverPopup>Content</PopoverPopup>
    </PopoverPositioner>
  </PopoverPortal>
</Popover>
```

`PopoverPortal`, `PopoverPositioner`, and `PopoverPopup` are public parts. They are not required
for normal usage. There is no `PopoverArrow` yet; Core does not currently expose arrow middleware
or arrow placement data.

## State

Uncontrolled:

```tsx
<Popover defaultOpen>…</Popover>
```

Controlled:

```tsx
const [open, setOpen] = useState(false);

<Popover
  open={open}
  onOpenChange={(next, reason) => {
    setOpen(next);
    console.log(reason);
  }}
>
  …
</Popover>
```

`onOpenChange` reasons: `trigger`, `outside-press`, `escape`, `close-button`, `programmatic`.
Programmatic state changes are made by controlling `open` from the consumer. There is no
imperative ref API.

## Positioning

`PopoverContent` and `PopoverPositioner` accept:

| Prop | Meaning |
| --- | --- |
| `side` | `top`, `right`, `bottom`, `left` (default `bottom`) |
| `align` | `start`, `center`, `end` (default `center`) |
| `sideOffset` | Main-axis offset (default `0`) |
| `alignOffset` | Cross-axis offset (default `0`) |
| `collisionBoundary` | Core boundary (`Element`, `clippingAncestors`, `viewport`) |
| `collisionPadding` | Collision padding |
| `collisionAvoidance` | `{ flip?: boolean; shift?: boolean }`, both default true |
| `positionMethod` | CSS strategy (`fixed` default, or `absolute`) |
| `anchor` | Optional explicit reference element; defaults to the trigger |

Positioning props are consumed by `PopoverPositioner` and are not forwarded to the popup DOM
element. Native props (`className`, `style`, IDs, ARIA, handlers) go to `PopoverPopup`.

### Physical vs logical

Sides are physical. `align="start"`/`"end"` follow the `dir` prop for top/bottom placements:
under `dir="rtl"`, `start` resolves to the physical end. Physical `left`/`right` placements do
not flip under RTL. Inline-start/inline-end are not separate placement values. Content should
receive `dir="rtl"` when needed; `PopoverPopup` propagates the root `dir="rtl"` attribute.

## Trigger composition

```tsx
<PopoverTrigger asChild>
  <MyButton>Open</MyButton>
</PopoverTrigger>
```

- `asChild` clones exactly one child; it does not wrap the child.
- Consumer refs and `onClick` handlers are preserved.
- Consumer handlers run first. Calling `event.preventDefault()` suppresses the trigger toggle.
- Disabled triggers do not open. With `asChild`, `disabled` and `aria-disabled` are passed to the
  child; the child should be a real interactive element that supports them.
- Custom components must forward refs if the Popover is to position against them.
- The trigger gets `aria-expanded` and, while open, `aria-controls`. No `aria-haspopup` or role is
  assigned automatically.

## Content and forms

Popover content is arbitrary React content: headings, links, forms, labels, inputs, selects,
checkboxes, radios, buttons, custom components, scrolling/long content, and dynamically changing
content.

The Popover does not close on input focus, value changes, or arbitrary clicks inside content.
Use `PopoverClose` or controlled state for explicit close actions.

## Dismissal

By default:

- Primary pointer-down outside the popup and trigger closes.
- Escape closes.
- Trigger toggles.
- Close control closes.
- Secondary pointer buttons do not dismiss.
- Nested layers route Escape/outside to the topmost layer only.

Disable individually with `dismissOnEscape={false}` or `dismissOnOutsidePress={false}`.
Touch uses pointer events. Popover does not add a mobile modal mode or block page scrolling.

## Portal

`PopoverContent` portals to `document.body` by default. Use `portal={element}` for a custom
container or `portal={false}` for inline rendering. Advanced composition can use
`PopoverPortal` or omit it entirely. Portal content remains part of the layer boundary, so
interacting inside it does not count as outside.

## Focus and accessibility

Default behavior is intentionally non-modal:

- Opening does not move focus away from the trigger.
- Focus is not trapped.
- Closing restores focus to the trigger only when focus was inside the popup.
- `initialFocus` focuses the first focusable popup element on open.
- `trapFocus` opts into focus containment; the parent trap yields to a nested topmost layer.
- Restore can be disabled with `restoreFocus={false}`.

No `role`, `aria-modal`, `aria-haspopup`, or focus trap is injected automatically. Consumers
choose semantic roles (`role="dialog"`, menu/listbox roles, etc.) and labelling. The optional
Title/Description helpers wire their IDs to the popup's `aria-labelledby`/`aria-describedby`.

Positioning updates never move focus or mutate ARIA.

## Styling hooks

The popup receives:

- `data-state="open"` while mounted.
- `data-open=""`.
- `data-side` and `data-align` from the rendered placement.
- Closed content is unmounted; `data-state="closed"`/`data-closed` are not observable until a
  keep-mounted mode exists.
- CSS variables `--popover-anchor-width` and `--popover-anchor-height`.
- Consumer `className`, `style`, and native attributes.

Inline positioning styles are applied to the popup. Consumer `style` values other than
`position`/`left`/`top` are preserved. No default width, max-height, colors, borders, shadows,
animations, or CSS is shipped.

## Nested overlays

Nested Popovers automatically inherit the parent Popup's layer handle. The child opens
independently, Escape closes the child first, and outside interactions do not dismiss the parent
incorrectly. For a Popover inside an external Dialog-like layer, pass `parentLayer`.

Layer registration order is registration order in Core; a child layer that mounts simultaneously
with its parent should be opened after the parent has registered (normal user interaction does
this). A Dialog component is not part of this phase; examples use a public `useLayer` fixture.

## Examples

[`examples/react/index.html#popover`](../examples/react/index.html#popover) contains the twelve compact
consumer scenarios. The primary [`examples/react`](../examples/react/index.html) page remains the
placement playground.

## Limitations

- Popover is React-only in this phase.
- No Tooltip, Dialog, ContextMenu, Select, Combobox, or picker components.
- No arrow/arrow padding.
- No keep-mounted/animation API; content is unmounted when closed.
- No multiple triggers, virtual references, hover activation, or modal mode.
- No automatic focus trap or ARIA role injection.
- Mobile behavior is pointer-based; no separate mobile pattern.
- Browser-level layout/mobile checks are examples/manual; automated tests use happy-dom.
