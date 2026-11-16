# Tooltip (React)

Headless, informational Tooltip built on Core positioning and the React Popover
Positioner/Portal primitives. No styles are shipped.

## Basic usage

```tsx
<TooltipProvider delay={500}>
  <Tooltip>
    <TooltipTrigger>Save</TooltipTrigger>
    <TooltipContent side="top">Save changes</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

The provider is optional. A Tooltip without a provider uses the built-in defaults.

## Public parts

- `TooltipProvider` — optional shared timing and hoverable-content configuration.
- `Tooltip` — owns open state and hover/focus timing.
- `TooltipTrigger` — hover/focus trigger, native button by default, or `asChild`.
- `TooltipContent` — portal + positioner + non-focusable `role="tooltip"` popup.

`TooltipContent` exposes the positioning and portal options directly; there are no separate
public TooltipPortal/Positioner/Popup parts. `TooltipArrow` is deferred because Core does not
currently expose reliable arrow middleware/placement data.

## Provider timing

| Prop | Default | Meaning |
| --- | --- | --- |
| `delay` | `500` | Hover opening delay |
| `closeDelay` | `100` | Delay before closing after pointer/focus leaves |
| `skipDelayDuration` | `300` | Window after opening where another Tooltip skips the opening delay |
| `disableHoverableContent` | `false` | Disable entering Tooltip content without closing |

Tooltip-level `delay`, `closeDelay`, and `disableHoverableContent` override provider values.
`skipDelayDuration` is provider-level.

Behavior:

1. First hover waits `delay`.
2. Once a Tooltip opens, another Tooltip hovered within `skipDelayDuration` opens immediately.
3. After the skip window expires, the full delay applies again.
4. Focus activation opens immediately for keyboard accessibility.
5. Hover and focus are combined: leaving the pointer does not close while the trigger is focused,
   and blur does not close while the pointer is over the trigger.
6. Timing state is scoped to a provider; multiple providers are independent and the nearest
   nested provider wins. There is no global singleton.

## Trigger behavior

Supported:

- Native button trigger.
- `asChild` custom button components.
- Icon-only buttons with consumer `aria-label`.
- Consumer refs and native attributes.
- Consumer event handlers; `preventDefault()` suppresses Tooltip behavior.
- Disabled Tooltip state.
- Native disabled buttons (through a wrapper; see below).

Not supported:

- Click toggling/open.
- Hover on touch pointers (touch hover is ignored).
- Nested interactive trigger wrappers.

Pointer hover opens after the delay; pointer leave schedules close. Keyboard focus opens
immediately. Clicking the trigger closes an open Tooltip but never opens it.
Tooltip does not prevent the consumer's click handler or trigger activation.

## Hoverable content

By default, Tooltip content is hoverable so the pointer can move from trigger to content during
the close delay. This does **not** make content interactive. Tooltip is not a Popover: buttons,
links, inputs, forms, and menus inside Tooltip content are unsupported.

Use `disableHoverableContent` (provider or Tooltip) to close when leaving the trigger regardless
of content hover.

## Positioning

`TooltipContent` supports:

- `side`: top, right, bottom, left
- `align`: start, center, end
- `sideOffset`, `alignOffset`
- `collisionBoundary`, `collisionPadding`
- `collisionAvoidance: { flip?, shift? }`
- `positionMethod`
- `portal`: default body, custom Element, or `false` for inline

Positioning props are consumed by the Positioner and never forwarded to the popup DOM. RTL
start/end alignment follows `dir` for top/bottom placements; physical left/right remain physical.

## Accessibility

- Trigger keeps its own accessible name; Tooltip supplements it and never replaces it.
- Trigger receives `aria-describedby` pointing to the tooltip while open.
- Popup has `role="tooltip"` and a unique ID from the Tooltip/Popover root.
- Tooltip is not a focus destination and is not keyboard-focusable.
- Opening does not move focus; closing does not move focus.
- Escape closes the Tooltip. The Escape handler runs in the capture phase and prevents the parent
  Core layer from also handling it, so a Tooltip inside Popover/Dialog closes first.
- Escape dismissal is handled by a lightweight open-only listener; Tooltip does not register a
  blocking layer and does not trap focus.
- No `aria-haspopup`, `role="dialog"`, or `aria-modal` is assigned.
- Clicking outside closes the Tooltip; parent overlays retain their own outside behavior.
- Disabled native controls are not made focusable automatically. A focusable wrapper is the
  supported pattern for disabled buttons.

## Disabled patterns

Wrapper pattern:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0}>
      <span className="visually-hidden">Save unavailable</span>
      <button type="button" disabled>
        Save
      </button>
    </span>
  </TooltipTrigger>
  <TooltipContent>Saving is currently unavailable.</TooltipContent>
</Tooltip>
```

`aria-disabled` is appropriate only when the consumer provides its own focusable control and
prevents the disabled action. Tooltip does not change disabled semantics or make disabled controls
focusable.

## Controlled state

```tsx
<Tooltip open={open} onOpenChange={(next, reason) => setOpen(next)}>
  …
</Tooltip>
```

Props: `open`, `defaultOpen`, `onOpenChange`, `disabled`, `delay`, `closeDelay`,
`disableHoverableContent`, `dir`.
Reasons: `hover`, `focus`, `escape`, `outside-press`, `trigger`, `programmatic`.

Controlled mode remains controlled: hover/focus/click call `onOpenChange` but do not update
internal state. Tooltip is not a click-toggled Popover.

## Portal and rendering

`TooltipContent` portals to `document.body` by default. Use `portal={element}` for a custom
container or `portal={false}` for inline rendering. Portal content remains hoverable and is
excluded from outside-interaction checks. Server rendering is safe; content is not rendered
server-side.

## Nested overlays

Tooltip does not register a layer, so it does not block parent Popover/Dialog outside handling.
Escape is captured first and prevented, giving the Tooltip priority while open. A Tooltip inside
a Popover remains positioned in the portal and does not dismiss the parent. The test suite also
covers a dialog-like layer fixture.

## Mobile and touch

- Touch hover is ignored rather than opened/closed repeatedly by synthetic hover.
- Focus (including tap-induced focus) can still open the Tooltip; this is not guaranteed across
  all mobile browsers.
- Tooltip is not converted into a click-triggered Popover.
- No mobile-specific modal mode or scroll lock.
- Essential information must not be available only via hover.

## Styling

The tooltip popup provides:

- `role="tooltip"`, unique `id`.
- `data-state="open"`.
- `data-open=""`.
- `data-side`, `data-align`.
- `--tooltip-anchor-width`, `--tooltip-anchor-height`.
- `className`, `style`, native attributes.

Closed content is unmounted; `data-state="closed"`/`data-closed` are not observable. No default
CSS, dimensions, colors, borders, shadows, animations, or theme tokens are shipped.

## Tooltip versus Popover

Use Tooltip for a short, non-interactive description triggered by hover/focus. Use Popover when
the floating content contains interactive controls, forms, or needs explicit open/close state.
Tooltip should not be a substitute for Dialog, Popover, ContextMenu, or any interactive overlay.

## Limitations

- React-only.
- No arrow.
- No interactive content.
- No advanced TooltipPortal/Positioner/Popup exports; `TooltipContent` covers portal/positioning.
- No keep-mounted/animation mode.
- No mobile-specific behavior.
- No automatic disabled-focus handling.
- RTL mapping is physical for sides and logical for start/end alignment.
- Browser testing uses headless Chrome; touch verification is synthetic.

## Examples

[`examples/react/index.html#tooltip`](../examples/react/index.html#tooltip) covers basic, icon, keyboard focus,
shortcut, placement, multiple/provider timing, disabled wrapper, custom trigger, RTL, and nested
overlay cases.
