# Changelog

## 0.1.0 — 2026-11-15

Initial public release of Zealakit Overlay.

### Packages

- `@zealakit/overlay-core` — framework-independent positioning, layers, dismissal,
  focus primitives, scroll lock, and shared DOM overlay controller.
- `@zealakit/overlay-vanilla` — high-level DOM controllers and low-level overlay APIs.
- `@zealakit/overlay-react` — Popover, Tooltip, Dialog, and ContextMenu compound components,
  hooks, and portal.
- `@zealakit/overlay-vue` — component composables and low-level Vue composables.
- `@zealakit/overlay-svelte` — component controllers, actions, and positioning/layer
  controllers.

### Highlights

- Collision-aware positioning with flip, shift, offset, and automatic updates.
- Shared per-document layer stack with nested overlay ordering and Escape/outside routing.
- Portal support, focus containment/restoration, modal scroll locking, and RTL handling.
- React ContextMenu submenus, checkbox/radio items, and roving keyboard navigation.
- React Tooltip provider timing and provider-level skip delay.
- Window-scroll positioning fix: React position updates commit before paint.
- Correct RTL popup/tooltip/context-menu alignment by relying on the positioning engine's
  direction handling instead of applying a duplicate start/end swap.
- TypeScript declarations, ESM output, and SSR-safe package imports.

### Documentation

- Package READMEs and focused design notes under `docs/` covering installation, component
  behavior, framework integration, and release guidance.

### Compatibility

- Node.js 20 or newer for SSR/tooling.
- React `^18.0.0 || ^19.0.0` with `react-dom`.
- Vue `^3.5.0`.
- Svelte `^5.0.0`.

### Known limitations

- No ContextMenuArrow, AlertDialog, DropdownMenu, Menubar, or Select.
- No default styling, animation system, or mobile long-press context menu.
- Non-React adapters expose the shared high-level controllers rather than full React
  compound-component parity.
