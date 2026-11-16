# Agent instructions (Zealakit Overlay)

Zealakit Overlay is a **pnpm monorepo** of headless, framework-agnostic overlay primitives
(floating / layered UI) for Vanilla TypeScript, React, Vue, and Svelte. There is one shared
runtime kernel (`@zealakit/overlay-core`); adapters are thin and idiomatic to their framework.

This file is the root agent guidance. `.agents/` is the single source of truth for
repository-specific AI instructions: `AGENTS.md`, `CLAUDE.md`, and `.cursor/` are symlinks
into it — never duplicate instruction content outside `.agents/`.

## Always follow

- **Skill:** [.agents/skills/overlay/SKILL.md](skills/overlay/SKILL.md)
- **README skill:** [.agents/skills/readme-system/SKILL.md](skills/readme-system/SKILL.md)
  (load it before touching any README)
- **Rules:** [.agents/rules/](rules/)

Load the overlay skill before code, test, docs, or release work. Copy and adapt it only
when adding support for another source tree; keep hard rules here.

## Quick map

| Area | Path | Package |
| --- | --- | --- |
| Framework-agnostic kernel | `packages/core/` | `@zealakit/overlay-core` |
| Imperative DOM adapter | `packages/vanilla/` | `@zealakit/overlay-vanilla` |
| React adapter | `packages/react/` | `@zealakit/overlay-react` |
| Vue adapter | `packages/vue/` | `@zealakit/overlay-vue` |
| Svelte adapter | `packages/svelte/` | `@zealakit/overlay-svelte` |
| Integration examples | `examples/{vanilla,react,vue,svelte,nextjs}/`, `examples/astro/` (React + Vue + Svelte integrations in one project) | private |
| Product documentation | root `README*.md` + `packages/*/README*.md` (EN, VI, CN) | — |
| Dependency monitor | `monitor/` | local dashboard |
| Release packaging helper | `scripts/pack-packages.mjs` | — |
| README structure check | `scripts/check-readmes.mjs` | — |
| Agent skills | `.agents/skills/{overlay,readme-system}/SKILL.md` | — |
| README cover image | `assets/cover.svg` | — |

## Commands

```bash
pnpm install
pnpm build        # builds packages in topological order (build core first)
pnpm typecheck    # requires a successful build (adapters resolve core from dist)
pnpm test         # core + vanilla + react + vue + svelte tests (Node test runner + happy-dom)
pnpm lint         # Biome
pnpm check        # build + typecheck + test + lint
pnpm clean        # remove package/example build output and local tarballs
pnpm pack:packages # pack release tarballs into artifacts/ (no publish)
pnpm release:check # full checks + package tarballs (no publish)
pnpm readme:check # README structure: EN/VI/CN parity, absolute links, H1 = package name

pnpm dev:vanilla
pnpm dev:react
pnpm dev:vue
pnpm dev:svelte
pnpm dev:nextjs
pnpm dev:astro

pnpm monitor      # dependency dashboard at http://127.0.0.1:4177
```

## Hard boundaries

- **Dependency direction:** adapters → core. Core never imports React, Vue, Svelte, or any
  adapter. No adapter imports another adapter. No circular dependencies.
- **Core stays DOM-framework-free:** no framework runtime, no styling. Core owns the
  positioning engine integration; adapters must never import `@floating-ui/*` directly.
- **Positioning:** use `createPositioner()` from core. Collision handling (flip/shift) and
  auto-update are isolated behind it. The engine rationale is recorded in the
  [overlay skill](skills/overlay/SKILL.md).
- **Tests:** new primitives need focused tests in the owning package (`packages/*/tests/`);
  run `pnpm test`. Do not add a second test framework or DOM library.
- **SSR safety:** never touch `window`, `document`, `navigator`, or `matchMedia` during module
  initialization or during React/Vue/Svelte render. Guard DOM work behind
  `isBrowser()`/lifecycle effects/actions.
- **TypeScript:** `type` aliases, not `interface` (except ambient declaration merging);
  `import type` for type-only imports; ESM with explicit `.js` relative specifiers.
- **Naming:** files and folders are `kebab-case`; exported React components are `PascalCase`.
- **Package surface:** do not export speculative or unimplemented APIs. No placeholder
  components, no fake implementations.
- **Scope:** Popover, Tooltip, Dialog, and ContextMenu are implemented as compound components
  in React (own implementation), Vue (render functions) and Svelte (`.svelte` files, exported
  from the root entry `@zealakit/overlay-svelte`), and as declarative `data-*` markup in Vanilla
  (`initOverlays`). Vue, Svelte, and Vanilla build on the shared Core DOM controller; submenus,
  checkbox/radio items, and tooltip skip-delay exist only in React. Lower-level
  controllers/composables stay public. Do not add speculative exports for DropdownMenu, Menubar, Select,
  or other unimplemented components. Select, Combobox, DatePicker, TimePicker,
  ColorPicker, command palette, a full positioning engine, styling, Storybook, and release
  automation remain out of scope unless explicitly requested. Per-component behavior is
  documented in `packages/react/README.md` and the other package READMEs. Arrow
  (Popover/Tooltip) and animation are opt-in and off by default; their DOM logic lives in core
  (`animation/`, `positioning/arrow.ts`), never duplicated per adapter.
- **Documentation:** There is intentionally no `docs/` folder and no separate docs app. Product
  documentation lives only in the root README and package READMEs, in EN, VI, and CN, following
  the [readme-system skill](skills/readme-system/SKILL.md). Keep runnable integration
  references in `examples/`.

## Definition of done

`pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm readme:check` pass. Examples
still build (and SSR examples build) against the local workspace packages. Update this file and
the [skill](skills/overlay/SKILL.md) when boundaries, commands, or workflows change.
