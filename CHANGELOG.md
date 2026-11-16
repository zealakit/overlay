# Changelog

## Unreleased

### Added

- Optional arrow for Popover and Tooltip across all adapters (off by default), with
  `data-side` and the `--overlay-arrow-background`, `--overlay-arrow-border-width` and
  `--overlay-arrow-border-color` variables. Only the outward half is drawn and outlined.
- Optional enter/exit animation (off by default) with `duration`, `delay`, `easing`
  (`ease-in-out`, `linear`, or any CSS timing function), a directional fade
  (`up`/`down`/`left`/`right`/`auto`, exit reverses enter) and custom CSS classes.
- Animation `type: "expand"`: the popup grows out of the edge facing its anchor (opacity 0 to 1
  with the scale) and collapses back into it, following the final placement and RTL.
- Custom animation can now be Web Animations keyframes (array or function receiving
  `{ phase, placement, side, align, transformOrigin }`) as well as CSS classes. Popups expose
  `--overlay-transform-origin` while animating.
- Core exports `runOverlayAnimation`, `createFadeKeyframes`, `getArrowStyles`, and related helpers;
  the shared controller accepts `arrow` and `animation`.

- Vue, Svelte, and Vanilla now ship prebuilt headless components like React: Popover, Tooltip,
  Dialog, and ContextMenu as compound components in Vue (`@zealakit/overlay-vue`) and Svelte
  (`@zealakit/overlay-svelte`), and declarative `data-*` markup via `initOverlays()`
  in Vanilla. Submenus, checkbox/radio items, and the tooltip provider remain React-only.

### Changed

- Core now owns the logic previously copied across packages: `acquireModalBackground` (inert
  background for modals, shared per document by the controller and React Dialog),
  `getMenuItems`/`moveMenuFocus`/`focusMenuTypeahead`/`createTypeaheadBuffer` (menu keyboard
  navigation, used by the controller and React ContextMenu), `moveToPortal`/`restorePortal`
  (Vanilla, Svelte, controller) and `isSamePositionerResult` (React, Vue, Svelte positioners).
- Controller menu navigation now ignores items that belong to a nested menu.
- A dialog backdrop that contains the dialog content now portals and toggles as one unit.
- `@zealakit/overlay-svelte` builds with `svelte-package` and exports components, controllers,
  and actions from the root entry; the `./components` subpath is gone.
- Documentation is now READMEs only, in English, Vietnamese, and Chinese. The `docs/` folder is
  gone; its component, animation, release, and positioning notes moved into the package
  READMEs and the agent skills. The README structure is defined by the `readme-system` skill
  and checked by `pnpm readme:check`.
- `createOverlayController` is split into focused modules (types, animator, tooltip and
  context-menu behaviors); the public API is unchanged apart from the new
  `toggleOnTriggerClick` option.
- Vanilla `createOverlay` is now a thin wrapper over the shared controller. It additionally sets
  `aria-expanded`/`aria-controls` on the reference, and reports `reference-press` instead of
  `imperative` for trigger-driven closes.

### Removed

- Unused Core exports: `watchPosition`, `listenForDismiss`, `createDisposer`/`Disposer`,
  `observeResize`, `isFocusInside`, `isFocusOutside`, `isActivationKey`, `Point`, `fadeOffset`,
  `DEFAULT_OFFSET`, `ExpandAxis`, and `ExpandPlan`.
- The `@zealakit/overlay-svelte/components` subpath. Import components from
  `@zealakit/overlay-svelte`, which now matches the React and Vue adapters.

### Fixed

- Popups no longer drift for a frame when the page scrolls. The default positioning strategy is
  now automatic: `absolute` (the browser moves the popup with its anchor in the same frame), or
  `fixed` for anchors inside fixed/sticky ancestors and bare viewport points such as the
  ContextMenu pointer. Pass `strategy` / `positionMethod` to force one.

### Changed

- The default strategy is no longer always `fixed`; pass `strategy: "fixed"` (or
  `positionMethod="fixed"`) to restore the previous behavior.

- React `animation` is now disabled unless set. Pass `animation` (or `true`) to keep the fade.
- Default animation easing is `ease-in-out` (was `ease-out`).

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
