# ContextMenu (React)

Headless contextual command menu built on the shared Core layer stack, focus
utilities, and React positioner. It is not a generic DropdownMenu and does not
open on left click.

## Basic usage

```tsx
<ContextMenu>
  <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={handleCopy}>Copy</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem disabled>Unavailable action</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

## Public API

- `ContextMenu`
- `ContextMenuTrigger`
- `ContextMenuContent`
- `ContextMenuItem`
- `ContextMenuGroup`
- `ContextMenuLabel`
- `ContextMenuSeparator`
- `ContextMenuCheckboxItem`
- `ContextMenuRadioGroup`
- `ContextMenuRadioItem`
- `ContextMenuSub`
- `ContextMenuSubTrigger`
- `ContextMenuSubContent`
- `ContextMenuShortcut`

`ContextMenuShortcut` is presentational (`aria-hidden`) and does not register
keyboard shortcuts. No `ContextMenuPortal`, `ContextMenuPositioner`,
`ContextMenuPopup`, or `ContextMenuArrow` part is exported; `ContextMenuContent`
and `ContextMenuSubContent` expose positioning and portal options directly.

## Trigger and opening

`ContextMenuTrigger` renders a focusable generic `<div>` by default. It is
intentionally not a button because a context menu is not a click-triggered menu.
Consumers can provide role/label or use `asChild` with an existing target.

Opening:

- Native `contextmenu` event (right-click).
- Keyboard `ContextMenu` key.
- `Shift + F10`.
- Controlled `open` state for programmatic opening.

Pointer invocation stores `clientX/clientY`; the menu is positioned there through
a Core virtual reference (zero-size rect) using `usePositioner({ reference })`,
a small additive extension supporting virtual/element references. Keyboard
invocation anchors to the trigger element. `event.preventDefault()` is called only when the menu is enabled
and handles the invocation. A disabled ContextMenu/trigger leaves the native
browser menu untouched.

Trigger consumer handlers run first; `preventDefault()` suppresses ContextMenu
handling.

## State

```tsx
<ContextMenu defaultOpen>…</ContextMenu>
<ContextMenu open={open} onOpenChange={setOpen}>…</ContextMenu>
```

- Default closed.
- Controlled and uncontrolled visibility.
- Reasons: `trigger`, `outside-press`, `escape`, `select`, `programmatic`.
- Disabled root/trigger.
- No imperative handle.
- External/programmatic opening is supported through controlled state; with no
  pointer invocation it anchors to the mounted trigger.

## Items and selection

`ContextMenuItem`:

- `role="menuitem"`, `aria-disabled`, `data-disabled`.
- `disabled` prevents activation.
- `onSelect(event)` receives an event with `preventDefault()` and
  `originalEvent`.
- `closeOnSelect` defaults to true. Set it false or call
  `event.preventDefault()` to keep the menu open.
- `asChild` supports custom elements; default is a non-focusable-by-tab
  `<div role="menuitem">` managed through programmatic roving focus.

Checkbox items:

- `checked`, `defaultChecked`, `onCheckedChange`.
- `role="menuitemcheckbox"`, `aria-checked`, `data-state`.
- Do not close by default; `closeOnSelect` is opt-in.

Radio groups:

- `ContextMenuRadioGroup` supports `value`, `defaultValue`, `onValueChange`.
- `ContextMenuRadioItem` uses `role="menuitemradio"` and `aria-checked`.
- Only one value per group; does not close by default.

Groups/labels/separators:

- `ContextMenuGroup` renders `role="group"` and associates a child
  `ContextMenuLabel`.
- `ContextMenuLabel` is not focusable.
- `ContextMenuSeparator` renders a semantic `<hr>` and is not focusable.
- `ContextMenuShortcut` is a presentational hint only.

## Keyboard

- `ArrowDown`/`ArrowUp` move and wrap.
- `Home`/`End` jump to first/last.
- `Enter`/`Space` activate the focused item.
- Printable characters use typeahead (500 ms buffer).
- Escape closes the topmost menu; submenu closes before root.
- Disabled items, labels, and separators are skipped.
- Root/submenu focus enters the first navigable item.
- Focus returns to the trigger/submenu trigger when appropriate.
- No focus trap; ContextMenu is not modal.

Submenu keys are direction-aware:

- LTR: `ArrowRight` opens, `ArrowLeft` closes.
- RTL: `ArrowLeft` opens, `ArrowRight` closes.

## Submenus

`ContextMenuSub` is currently uncontrolled (`defaultOpen` available). It supports
pointer hover and keyboard opening, a 100 ms close delay for moving into the
submenu, collision-aware positioning adjacent to the submenu trigger, and nested
focus/layer priority. Multiple submenu levels are supported.

Selecting an item closes the whole root menu hierarchy. Escape/outside closes
only the active submenu first. `ContextMenuSubContent` inherits the parent layer
and Dialog portal boundary.

## Portal and positioning

- Portal target defaults to `document.body`, or an enclosing Dialog popup when
  present.
- `portal={element}` selects a custom container; `portal={false}` renders inline.
- Root positioning options: `side`, `align`, `sideOffset`, `alignOffset`,
  `collisionBoundary`, `collisionPadding`, `collisionAvoidance`, `positionMethod`.
- Root uses pointer coordinates for pointer invocation and the trigger element
  for keyboard/programmatic invocation.
- Submenus default to right in LTR and left in RTL, with flip/shift collision.
- Auto-update runs on scroll/resize/layout changes.
- No new positioning engine.

Because the trigger and both menu levels may be in different portals, submenu
click boundaries use separate child layers; the parent layer remains open.

## Focus, layers, and Dialog

- Root menu and each submenu register on the shared Core layer stack.
- Escape and outside pointer are routed to the topmost menu only.
- Right-clicking outside the menu closes it without preventing the native menu.
- Multiple independent ContextMenus replace the active menu when a new target is
  right-clicked.
- ContextMenu inside Dialog parents its layer to the Dialog and portals into the
  Dialog popup, so focus containment/background relationships remain coherent.
- A Dialog opened from a menu item closes the menu and does not leave stale menu
  layers.

## Accessibility

- `role="menu"`, `aria-orientation="vertical"`.
- `role="menuitem"`, `menuitemcheckbox`, `menuitemradio`.
- `aria-checked`, `aria-disabled`, `aria-haspopup`, `aria-expanded`.
- Submenus associate `aria-labelledby` with the submenu trigger.
- Trigger exposes `aria-haspopup="menu"`, expanded state, and controls while open.
- Consumer provides the accessible name for the trigger/menu.
- Menus are not focus-trapped and do not use Dialog semantics.
- No live-region wrapping.

## Touch and mobile

Right-click is not a touch interaction. This phase does **not** add long-press or
gesture recognition. Touch scrolling and native gestures are not blocked.
Consumers should provide an explicit alternate action path on touch devices.
Long-press could be added later as an opt-in behavior without changing the menu.

## RTL

- `dir` flows to menu/submenu.
- Root start/end alignment is logical for top/bottom.
- Submenu side reverses in RTL.
- Keyboard open/close arrows reverse.
- No hardcoded close-button or layout positions.

## Styling

No CSS is shipped. Consumers control spacing/colors/icons.

Observed surfaces:

- Menu: `role="menu"`, `data-state="open"`, `data-open`, `data-context-menu`,
  `data-submenu`, `data-side`, `data-align`.
- Items: `aria-disabled`, `data-disabled`, `data-state` for check/radio.
- Label/shortcut/separator markers.
- `className`, `style`, native attributes, refs.

There is no default width, padding, border, shadow, colors, animation, or theme
token.

## Known limitations

- React-only.
- No `ContextMenuArrow`.
- No advanced Portal/Positioner/Popup exports.
- No generic DropdownMenu/Menubar/Select.
- No long-press activation.
- `ContextMenuSub` is uncontrolled; no imperative/controlled submenu API.
- No keep-mounted/exit animation state.
- Default trigger is a generic focusable div; consumers must provide role/name
  appropriate to their target.
- Near-viewport-edge placement relies on Core collision; a menu taller than the
  viewport must be constrained/scrollable through consumer CSS.
- Touch/keyboard/mobile behavior needs real-device validation.

## Examples

`examples/react/index.html#context-menu` demonstrates basic pointer opening, icons and
shortcut hints, groups, checkbox/radio items, nested submenus, disabled and
destructive styling, keyboard invocation, card targets, RTL, viewport edges, and
Dialog integration.
