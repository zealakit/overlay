# Public API direction

This document describes the public API direction. **Popover, Tooltip, Dialog, and ContextMenu are
implemented for React.**

## Two API layers

### 1. Headless components (primary direction)

Components will be the main consumer-facing API. They provide behavior, accessibility
foundations, state, and composition while remaining unstyled.

Initial component scope:

- `Popover`
- `Tooltip`
- `Dialog` / `Modal`
- `ContextMenu`

Popover, Tooltip, Dialog, and ContextMenu are implemented as React compound components and
are also available as high-level DOM controllers/composables in the Vanilla, Vue, and Svelte
adapters. See [docs/popover.md](popover.md), [docs/tooltip.md](tooltip.md),
[docs/dialog.md](dialog.md), and [docs/context-menu.md](context-menu.md), plus each package
README for framework-specific APIs.

### 2. Hooks and functions (customization layer)

The existing lower-level APIs stay public and supported:

| React | Purpose |
| --- | --- |
| `usePositioner()` | Positioning session, callback refs or explicit virtual/element reference, latest result, manual `update()` |
| `useLayer()` | Shared-stack registration, parent handles, dismissal policy |
| `useEscapeKey()` | Standalone Escape handling |
| `useOverlay()` | Uncontrolled positioning + layer composition |
| `Portal` | DOM transport |
| focus helpers | Focusable lookup, focus/restore, containment primitives |
| `createOverlayController()` | Shared DOM overlay controller used by the non-React adapters for Popover/Tooltip/Dialog/ContextMenu behavior |
| `acquireSharedLayerStack()` | One cross-adapter per-document layer stack/listener set |
| `lockBodyScroll()` | Reference-counted modal body scroll lock from Core |
| Core types / utilities | `Placement`, `PositionerOptions`, layer handles, etc. |

Vanilla controllers, Vue composables, and Svelte actions/controllers remain the equivalent
lower-level APIs in those adapters.

Rules:

- Keep useful existing APIs; do not remove them for component work.
- Do not export internal implementation details.
- Do not add speculative component exports before behavior is designed and tested.

## Component scope

Included in the initial direction:

- Popover
- Tooltip
- Dialog / Modal
- ContextMenu

Explicitly excluded (may be built separately on top of Zealakit Overlay):

- Select
- Combobox
- DatePicker
- TimePicker
- ColorPicker
- Command palette
- Other complex selection and picker components

## Component architecture

Popover, Tooltip, and Dialog follow this model without a generic component framework. Dialog
uses shared React overlay contexts, Slot, Core focus/layer contracts, and its own scroll-lock
integration; it does not depend on the Popover or Tooltip components.

### Shared responsibilities (Core/adapters)

- Collision-aware positioning and auto-update.
- Layer ordering, topmost resolution, parent/child relationships.
- Outside/Escape interaction routing and per-layer opt-outs.
- Focusable detection, focus restoration, and focus containment primitives.
- Reference-counted modal body scroll locking.
- Element refs, lifecycle cleanup, SSR-safe initialization.
- Existing portal primitives.

### Component responsibilities

- Controlled/uncontrolled open state and `onOpenChange`.
- Trigger/content relationship and generated IDs.
- ARIA roles and relationships owned by each component (`dialog`, `tooltip`, `menu`,
  `aria-expanded`, `aria-controls`, `aria-haspopup`, `aria-describedby`, `aria-modal`).
- Component-specific interaction policy (hover intent for Tooltip, modal focus/inert for Dialog,
  pointer/keyboard opening for ContextMenu).
- Portal choice and focus policy.
- Visual styling remains entirely userland.

### Composition model

A headless component should be a small composition root plus parts, not a generic component
runtime or plugin system:

```tsx
// Implemented React Popover shape.
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>…</PopoverContent>
</Popover>
```

Shared behavior:

- **Root** owns open state (controlled or uncontrolled) and component context.
- **Trigger** owns the reference ref and trigger ARIA.
- **Content** owns the floating ref, positioner, layer registration, dismissal, portal, and
  component-specific focus policy.
- Nested content receives the parent layer handle through component context; Core remains the
  ordering source of truth.
- Components use per-instance context only. No global open-state manager and no generic
  framework.

Component-specific behavior:

- **Popover (implemented)**: generic trigger/content; Escape/outside dismissal; optional
  initial focus, focus containment, and restoration.
- **Tooltip (implemented)**: hover/focus timing with shared provider skip-delay; tooltip ARIA;
  non-interactive hoverable content; no focus trap or role dialog.
- **Dialog (implemented)**: modal/non-modal modes, focus containment/restoration, inert
  background, scroll lock, backdrop/viewport/popup composition, nested layer compatibility.
- **ContextMenu (implemented)**: pointer-coordinate/keyboard anchors, menu keyboard navigation,
  checkbox/radio/submenu items, RTL, and nested layer/Dialog integration.
- **Tooltip**: hover/focus intent, non-interactive content by default, `role="tooltip"`, no
  outside-press dismissal.
- **Dialog / Modal**: focus containment/restoration, `aria-modal`, backdrop/inert/scroll policy,
  Escape dismissal.
- **ContextMenu**: virtual reference from pointer coordinates, context-menu/keyboard opening,
  menu focus and navigation policy.

The lower-level hooks/actions remain the customization surface for consumers who need different
semantics.

## Cross-framework strategy

- **Core** owns framework-independent behavior and shared contracts.
- **Adapters** provide idiomatic integration: React hooks/components, Vue composables/components,
  Svelte actions/components, Vanilla controllers.
- Component APIs may differ where frameworks differ (composition, slots, runes, refs), but
  equivalent components should preserve the same behavioral contracts and accessibility
  expectations.
- React will be the first component implementation reference for speed of iteration, but React
  is not a dependency of the other adapters and its component syntax is not the required shape
  elsewhere.
- Low-level APIs remain public in every adapter so custom implementations stay possible.
- Shared behavior tests should target Core once; adapter tests verify lifecycle integration.

## Accessibility ownership

Infrastructure provides focus/interaction primitives and ordering. Components own roles, ARIA
relationships, labelling, focus policy, hidden/inactive content, and modal behavior. The library
must not inject component-specific roles or ARIA attributes from Core.

## Non-goals

- No Select/Combobox/DatePicker/TimePicker/ColorPicker/command palette in this repository.
- No default CSS or theme system.
- No generic component framework, plugin system, or global state manager.
- No component implementation in the current phase.
