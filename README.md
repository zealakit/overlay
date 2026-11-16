# Zealakit Overlay

A lightweight foundation for building floating, layered, and interactive UI
components. One framework-agnostic core and thin, idiomatic adapters for Vanilla,
React, Vue, and Svelte.

- **Headless** — no styles, no theme, no CSS system. You own markup and visuals.
- **Shared core** — positioning, layers, dismissal, focus, scroll lock, and the
  shared DOM overlay controller live once.
- **Native adapters** — React compound components, Vue composables, Svelte
  controllers/actions, and imperative Vanilla controllers.
- **SSR-safe imports** — packages never touch browser globals at module load.
- **ESM + TypeScript** — declarations ship with every package; `sideEffects: false`.

## Components

Popover, Tooltip, Dialog, and ContextMenu are implemented across the adapters:

| Framework | Integration |
| --- | --- |
| Vanilla JS / TS | `createPopover`, `createTooltip`, `createDialog`, `createContextMenu` |
| React 18/19 | Compound components and hooks |
| Vue 3.5+ | `usePopover`, `useTooltip`, `useDialog`, `useContextMenu` |
| Svelte 5 | `createPopover`, `createTooltip`, `createDialog`, `createContextMenu` |

React exposes the full compound APIs, ContextMenu submenus/stateful items, and
Tooltip provider skip timing. Vanilla/Vue/Svelte expose the shared high-level
controllers with consumer-owned markup; the React-only composition layers are
not recreated there.

Not implemented: ContextMenuArrow, AlertDialog, DropdownMenu, Menubar, Select,
styling, animations, long-press context menus, and mobile-specific tooltip UX.

## Documentation

Documentation lives in the root [`README.md`](README.md), the package READMEs,
and the focused design notes under [`docs/`](docs/). There is intentionally no
separate documentation app; `examples/` remains the integration reference.

## Supported frameworks

| Runtime | Package | Integration |
| --- | --- | --- |
| Vanilla JS / TS | `@zealakit/overlay-vanilla` | imperative DOM controllers |
| React 18+ | `@zealakit/overlay-react` | compound components + hooks |
| Vue 3.5+ | `@zealakit/overlay-vue` | composables |
| Svelte 5 | `@zealakit/overlay-svelte` | controllers + actions |

## Package structure

```text
packages/
├── core/       # @zealakit/overlay-core — types, positioner, layers, lifecycle, events, shared controller
├── vanilla/    # @zealakit/overlay-vanilla — high-level controllers + low-level DOM APIs
├── react/      # @zealakit/overlay-react — components, hooks, Portal
├── vue/        # @zealakit/overlay-vue — component composables + low-level composables
└── svelte/     # @zealakit/overlay-svelte — controllers, actions, positioning/layer controllers
```

Dependency direction is strictly one-way:

```text
vanilla ─┐
react ───┤
vue ─────┼──> core
svelte ──┘
```

Core imports no framework and exposes no engine types. Only Core imports the
positioning engine (`@floating-ui/dom`), isolated behind `createPositioner()`.
Adapters own framework lifecycle, markup, and idiomatic state integration.
See [ADR 0001](docs/adr/0001-positioning-engine.md).

## Installation

Release **0.1.0** is prepared locally but is **not automatically published** by this
repository. The package names and imports below are the public package surface.
Install the adapter you need; include its peer framework when applicable:

```bash
# Core only (custom adapters/low-level use)
npm install @zealakit/overlay-core

# Vanilla (no framework peer)
npm install @zealakit/overlay-vanilla

# React 18 or 19
npm install @zealakit/overlay-react react react-dom

# Vue 3.5+
npm install @zealakit/overlay-vue vue

# Svelte 5
npm install @zealakit/overlay-svelte svelte
```

All packages are ESM-only, ship TypeScript declarations, and are SSR-import
safe. No CSS is shipped. See [docs/releasing.md](docs/releasing.md) for release
checks and packaging.

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm build` | Build all packages (Core first, then adapters) |
| `pnpm typecheck` | Typecheck packages — run `pnpm build` first |
| `pnpm lint` / `pnpm lint:fix` | Biome check / autofix |
| `pnpm test` | Core, Vanilla, React, Vue, and Svelte tests |
| `pnpm check` | Build + typecheck + test + lint |
| `pnpm clean` | Remove package/example output and local tarballs |
| `pnpm pack:packages` | Pack release tarballs into `artifacts/` |
| `pnpm release:check` | Full checks plus package tarballs (no publishing) |
| `pnpm dev:vanilla` \| `dev:react` \| `dev:vue` \| `dev:svelte` | Vite examples |
| `pnpm dev:nextjs` | Next.js App Router example (port 3010) |
| `pnpm dev:astro` | Astro integration example (port 4321) |
| `pnpm monitor` | Local dependency dashboard (http://127.0.0.1:4177) |

Build the packages before starting an example. Examples import compiled workspace
packages, not their sources.

## Examples

`examples/` contains integration and smoke-test projects, not product apps:

- `vanilla/`, `react/`, `vue/`, `svelte/` — Vite workspaces.
- `nextjs/` — App Router, Server Component page + Client Component overlay
  (SSR/hydration check).
- `astro/` — React, Vue, and Svelte islands configured together with
  `client:load`, exercising SSR and hydration for all three at once.

The local dependency dashboard lives at `monitor/`.

## Implementation status

| Area | Status |
| --- | --- |
| Core positioning, layers, dismissal, focus, lifecycle | Implemented |
| Shared DOM overlay controller | Implemented |
| Vanilla high-level controllers | Implemented |
| React components + hooks | Implemented |
| Vue component composables | Implemented |
| Svelte controllers + actions | Implemented |
| Popover / Tooltip / Dialog / ContextMenu | Implemented |
| React ContextMenu submenus/check/radio | Implemented (React only) |
| Arrow collision handling | Not implemented |
| Styling, animations, default theme | Not shipped |
| AlertDialog, DropdownMenu, Menubar, Select | Not implemented |
| Touch long-press context menu | Not implemented |

## Repository layout

```text
.
├── .agents/          # AI agent guidance (source of truth)
├── assets/           # Reserved
├── docs/adr/         # Architecture decision records
├── examples/         # Integration smoke tests
├── monitor/          # Local dependency dashboard
├── packages/         # Publishable packages
├── scripts/          # Release tooling
├── AGENTS.md         # Symlink → .agents/AGENTS.md
├── CLAUDE.md         # Symlink → .agents/AGENTS.md
└── .cursor/          # Symlink → .agents/
```

Repository conventions and architecture notes live in
[`.agents/AGENTS.md`](.agents/AGENTS.md) and
[`.agents/skills/overlay/SKILL.md`](.agents/skills/overlay/SKILL.md).

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for the 0.1.0 release notes.

## License

MIT
