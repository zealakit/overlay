# Dialog / Modal (React)

Headless Dialog built on the shared Core layer stack, focus containment, and a
reference-counted scroll lock. Modal is an interaction mode of Dialog, not a
separate component. No visual styling is shipped.

## Basic usage

```tsx
<Dialog>
  <DialogTrigger>Open dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Update your profile information.</DialogDescription>
    </DialogHeader>
    <form>
      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <button type="submit">Save</button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

## Anatomy and public parts

Convenience:

- `Dialog` — state, IDs, modal mode, dismissal flags, direction, parent layer.
- `DialogTrigger` — native button or `asChild`; supplies `aria-haspopup="dialog"`,
  `aria-expanded`, and `aria-controls`.
- `DialogContent` — Portal → optional Backdrop → Viewport → Popup.
- `DialogHeader`, `DialogFooter` — layout-only wrappers.
- `DialogTitle` — required for an accessible name; sets `aria-labelledby`.
- `DialogDescription` — optional; sets `aria-describedby`.
- `DialogClose` — optional close control; no close button is injected.

Advanced:

- `DialogPortal` — body/custom portal plus the dialog interaction root.
- `DialogBackdrop` — structural backdrop with no styles.
- `DialogViewport` — structural layout wrapper with no styles.
- `DialogPopup` — focus, layer, scroll lock, dialog semantics, and data attributes.

There is no `DialogPositioner`: Dialog is not anchored to its trigger. Layout is
consumer-owned through `DialogViewport`/`DialogPopup` CSS.

## Controlled and uncontrolled state

```tsx
<Dialog defaultOpen>…</Dialog>
<Dialog open={open} onOpenChange={setOpen}>…</Dialog>
```

- Default closed; `defaultOpen` for uncontrolled initial state.
- Controlled `open` remains controlled; trigger/dismissal calls `onOpenChange`
  with `trigger`, `outside-press`, `escape`, `close-button`, or `programmatic`.
- Programmatic open/close is done through controlled state or the compound
  trigger. There is no imperative handle.
- An external trigger is supported through controlled state; no global trigger
  registry or handle was added.

## Modal and non-modal behavior

`modal` defaults to `true`.

Modal mode:

- `role="dialog"` + `aria-modal="true"`.
- Focus moves into the popup (default target: the popup container).
- Focus is contained while the dialog is the topmost layer.
- Body siblings outside the **topmost modal dialog portal** are marked `inert`
  and `aria-hidden="true"` where possible. A parent modal Dialog becomes inert
  while a nested modal child is active.
- Document scrolling is locked (`lockScroll` defaults to `modal`).
- A backdrop is rendered by `DialogContent` by default.

Non-modal mode:

- No `aria-modal`.
- No focus trap, background inertness, or scroll lock by default.
- Background remains interactive.
- No backdrop by default; consumers can explicitly request one.
- Dismissal still follows the configured Escape/outside flags.

Modal and non-modal share one implementation.

## Focus management

- Modal default initial focus is the popup container (`tabIndex="-1"`), avoiding
  arbitrary first-link focus.
- `initialFocus` accepts `"container"`, `"first"`, an Element, a getter, or
  `null`.
- Non-modal mode does not move focus unless `initialFocus` is supplied.
- `finalFocus` overrides the restore target; otherwise focus returns to the
  trigger or the element active when the Dialog opened.
- `restoreFocus` defaults to true.
- Restoration is skipped if focus was intentionally moved outside a non-modal
  Dialog. Disconnected targets are ignored.
- Modal Tab/Shift+Tab containment is implemented with Core
  `createFocusContainment`; dynamic focusable content is discovered on demand.
- Parent containment yields while a nested overlay is topmost and resumes when
  the child closes.
- Focus is not tied to animations.

Title and description relationships are registered only when those parts are
rendered. A Dialog without `DialogTitle` has no accessible name unless the
consumer supplies `aria-label`/`aria-labelledby`; this is an accessibility
requirement, not something the library invents.

## Keyboard and dismissal

- Enter/Space activation follows the native trigger button.
- Escape closes the topmost Dialog by default.
- Nested layers close child-first using Core layer priority.
- `dismissOnEscape` and `dismissOnOutsidePress` can be disabled independently.
- Backdrop clicks are outside the popup and follow outside dismissal.
- Clicks/focus/forms inside the popup do not close it.
- A form submit or arbitrary action click does not close the Dialog.
- Consumer `preventDefault()` on close controls suppresses closing.
- No closing is coupled to successful actions or async operations.

## Portal, backdrop, and rendering

- `DialogContent` portals to `document.body` by default.
- `portal={element}` creates the dialog root inside a custom container.
- `portal={false}` renders inline; background inertness cannot be applied safely
  in that mode and is skipped.
- `DialogPortal disabled` omits the portal root.
- `keepMounted` is available on `DialogContent`, `DialogPortal`,
  `DialogBackdrop`, and `DialogPopup` for consumer-controlled transitions.
  `DialogContent` forwards it to the default portal/backdrop/popup composition.
- `DialogBackdrop` has no default color/opacity/blur/animation; style it through
  className/style/data attributes.
- `DialogViewport` and `DialogPopup` have no default dimensions, padding, or
  positioning. The examples show centered, fullscreen, sticky, and mobile
  layouts using consumer CSS.
- SSR imports are safe; dialog content is not rendered server-side.

Nested Popover/Tooltip portals inside a Dialog default into the Dialog popup
through the shared portal-container context. This keeps them inside the
dialog's focus/interaction boundary. A nested Dialog opens its own body portal
and layer.

## Scroll locking

Core exposes `lockBodyScroll(document?)`, a reference-counted scroll lock:

- Applies `overflow: hidden` to `<html>` and `<body>`.
- Compensates the scrollbar with body padding-right.
- Restores the previous inline styles on the final release.
- Nested locks share one state; the last release unlocks.
- No global listener manager.

Dialog uses it only when `modal && lockScroll` (default). Non-modal Dialogs do
not lock scrolling. The content itself is never given `max-height`/`overflow`;
consumers compose scroll regions, sticky headers, and sticky footers.

## Nested overlays

- Dialog inside Dialog: only the topmost modal portal remains active; the parent
  modal boundary becomes inert while the child is active. Child layer priority,
  Escape child-first, focus restoration into the parent, and scroll lock remain
  until the last modal closes.
- Nested popup exposes `data-nested`; a parent popup exposes
  `data-nested-dialog-open` while a nested Dialog is open.
- Dialog inside Popover: Dialog is parented to the Popover layer; Escape closes
  the Dialog before the Popover; closing restores focus to the trigger inside
  the Popover.
- Popover inside Dialog: child Popover portals into the Dialog popup, remains
  interactive, and closes before the Dialog.
- Tooltip inside Dialog: Tooltip does not register a blocking layer; Escape
  closes only the Tooltip.
- Parent Dialog focus containment pauses while a child layer is topmost.

## Accessibility

- `role="dialog"` by default (consumer may override for future specialized
  dialogs).
- `aria-modal="true"` only in modal mode.
- Unique trigger/content/title/description IDs from the Dialog root.
- `DialogTitle`/`DialogDescription` relationships.
- Background siblings are inert/aria-hidden in modal portal mode.
- Focus enters, stays, and returns in modal mode.
- No automatic `alertdialog`, focus trap in non-modal mode, or arbitrary name.

An AlertDialog is not implemented. Dialog is general-purpose; AlertDialog would
add stricter dismissal/role/action expectations without changing Dialog's
defaults.

## Styling and data attributes

Dialog popup exposes:

- `data-state="open"` / `data-state="closed"`.
- `data-open=""` / `data-closed=""` (closed is observable with `keepMounted`).
- `data-modal=""` or `data-non-modal=""`.
- `data-nested=""` for a Dialog rendered inside another Dialog.
- `data-nested-dialog-open=""` while a nested Dialog is open.
- `data-dialog-popup=""`.
- `role`, `aria-modal`, unique `id`.
- Native `className`, `style`, and attributes.

Backdrop: `data-dialog-backdrop`, `data-state`, modal/non-modal data,
`aria-hidden="true"`.
Portal root: `data-dialog-portal=""`.
Viewport: `data-dialog-viewport=""`.

No default width, max-width, height, padding, overflow, colors, shadows, border
radius, backdrop opacity, animation, or theme tokens are shipped.

## Transition and lifecycle

By default, closed Dialog content unmounts. Set `keepMounted` on `DialogContent`
(or advanced `DialogPortal` + `DialogPopup`) when consumer CSS transitions need
closed DOM. Closed content is `hidden` and exposes `data-state="closed"` /
`data-closed`; it does not register a layer, trap focus, inert the background, or
lock scrolling. Focus containment and scroll locking are released as soon as the
open state changes, so exit animations do not leave the page modal. There is no
animation library or animation-completion callback.

## RTL and responsive behavior

- Dialog direction flows to the popup; layout and close placement remain
  consumer CSS.
- No hardcoded left/right positioning.
- No automatic mobile Sheet/Drawer transformation.
- Narrow viewport, fullscreen, bottom-aligned, safe-area, and dynamic viewport
  behavior are consumer CSS responsibilities.
- Focus visibility and touch outside dismissal remain browser/consumer concerns.

## Recommended scrollable composition

```tsx
<DialogContent className="dialog-popup dialog-popup--scroll">
  <DialogHeader className="sticky-header">…</DialogHeader>
  <div className="scroll-body">…</div>
  <DialogFooter className="sticky-footer">…</DialogFooter>
</DialogContent>
```

with consumer CSS controlling max-height/flex/overflow. The library applies no
layout to these wrappers.

## Examples

`examples/react/index.html#dialog` covers basic, form, controlled, custom trigger,
no-close, custom close, scrollable, sticky footer, fullscreen, non-modal, nested,
Dialog+Popover, Dialog inside Popover, RTL, and mobile responsive examples.

## Known limitations

- React-only.
- No default styling/layout.
- No AlertDialog, Sheet, Drawer, or animation system.
- `keepMounted` supports consumer transitions but has no animation callbacks and
  releases modal behavior immediately on close.
- Background inertness requires a body/custom-root portal outside the app root;
  inline Dialog cannot inert its own ancestors.
- Inertness does not install a MutationObserver for body siblings added later.
- Scroll locking uses overflow hidden rather than the fixed-body iOS technique.
- No imperative open/close handle.
- No automatic development warning when `DialogTitle` is omitted.
