---
name: overlay-architecture
description: >-
  Use for any Zealakit Overlay code, test, documentation, or release work:
  deciding where logic belongs, implementing packages, keeping Core and
  adapters separated, validating behavior, and packaging releases.
---

# Zealakit Overlay

Read `.agents/AGENTS.md` first. Keep this file compact; add separate skills only for other source trees.

## Map

```text
vanilla ─┐
react ───┤
vue ─────┼──> @zealakit/overlay-core
svelte ──┘

examples/* -> adapters
READMEs (EN/VI/CN) -> product documentation
```

- **Core** (`packages/core`) owns types, positioning (incl. arrow geometry), animation
  runner, layers, dismissal, focus, lifecycle, scroll lock, and the shared DOM overlay controller.
- **Adapters** own framework lifecycle and idiomatic APIs:
  - vanilla: declarative `data-*` markup (`initOverlays`) + DOM controllers
  - react: compound components + hooks
  - vue: compound components (render functions) + composables
  - svelte: compound components (`.svelte`, root entry) + controllers + actions
- **Docs** live only in the root and package READMEs (EN, VI, CN), structured by the
  [readme-system skill](../readme-system/SKILL.md). There is no `docs/` folder. Keep examples as
  integration references, not a documentation app.

## Tree

```text
overlay/
├── .agents/
│   ├── AGENTS.md                 # hard rules, commands, boundaries
│   ├── rules/overlay.mdc         # editor always-apply rule
│   └── skills/
│       ├── overlay/SKILL.md      # this workflow
│       └── readme-system/SKILL.md # README structure spec
├── AGENTS.md    -> .agents/AGENTS.md
├── CLAUDE.md    -> .agents/AGENTS.md
├── .cursor      -> .agents
├── assets/                       # README cover image
├── examples/                     # vanilla, react, vue, svelte, nextjs, astro
├── packages/
│   ├── core/src/                 # controller, positioning, layer, focus, ...
│   ├── vanilla/src/              # DOM controllers + low-level APIs
│   ├── react/src/                # components + hooks
│   ├── vue/src/                  # composables
│   └── svelte/src/               # controllers + actions
├── monitor/                      # local dependency dashboard
├── scripts/                      # packaging + README check
├── CHANGELOG.md
├── README.md, README_VI.md, README_CN.md
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── biome.json
```

Each package uses `src/` (public barrel + implementation), `tests/`, and generated `dist/`.
Keep integration demos in `examples/`, documentation in READMEs, and generated output
out of agent guidance.

## Boundaries

- Dependency direction: adapters → Core. Never Core → adapter/framework.
- No adapter imports another adapter.
- Only Core imports `@floating-ui/dom`; engine types stay out of public APIs.
- No default CSS or styling system.
- Do not add speculative APIs, placeholders, or unimplemented components.
- Keep `workspace:^` for Core in adapter manifests.

## Change workflow

1. Identify the owning package and existing tests.
2. Put shared contracts/math/DOM policy in Core; framework lifecycle in the adapter.
3. Use TypeScript `type` aliases, `import type`, explicit `.js` relative imports.
4. Keep imports SSR-safe: no browser globals at module init or during render.
5. Clean up listeners, observers, layers, portals, focus traps, and scroll locks.
6. Export only implemented public APIs and their types from `src/index.ts`.
7. Add focused tests in the owning package; run `pnpm check`.
8. Update the READMEs (all three languages) when public behavior changes; load the
   [readme-system skill](../readme-system/SKILL.md) and run `pnpm readme:check`.

### Framework notes

- **React:** `"use client"` where required; refs/effects; Strict Mode cleanup;
  positioning updates must commit before paint.
- **Vue:** `MaybeRefOrGetter`, shallow refs, correct watcher flush, `onScopeDispose`.
- **Svelte:** Svelte 5 actions/controllers; mount/cleanup via `onMount`/`onDestroy`. The package
  builds with `svelte-package` (not plain `tsc`); components live in `src/parts/` and are
  re-exported from the root entry `src/index.ts`. Tests compile `.svelte` files through a
  `registerHooks` loader in `tests/setup.ts`.
- **Component parts (Vue/Svelte/Vanilla):** keep them thin over `createOverlayController`; do
  not reimplement behavior. A dialog backdrop that wraps the content portals as one unit.
- **Vanilla:** controller options/types; `destroy()` restores portal, listeners, and ARIA/DOM state.
- **Dialog/ContextMenu:** preserve topmost layer, focus, inertness, scroll lock, and Escape order.

## Verification

```bash
pnpm --filter @zealakit/overlay-<pkg> run typecheck
pnpm --filter @zealakit/overlay-<pkg> run test
pnpm check
```

- Tests use Node + happy-dom, React Testing Library, Vue Test Utils, and compiled Svelte
  fixtures. Do not add a second test framework/DOM library.
- For real layout/scroll/focus bugs, verify in a browser against an example. Do not claim a
  visual fix from mocked coordinates alone.
- For release changes, follow the Release section below; inspect tarballs and test isolated
  consumers. Never publish or require credentials unless explicitly asked.

## Positioning engine decision

`@floating-ui/dom` sits behind the Core-owned `createPositioner()`. Native-only positioning
(CSS anchor, native popover) was rejected because browser support is uneven and it cannot cover
virtual anchors; a custom flip/shift engine was rejected because correct overflow detection
(clipping ancestors, scroll containers, transforms, RTL, shadow DOM) is a large maintenance
surface. Core is the only package that imports Floating UI, engine types never appear in public
types, and `autoUpdate` drives re-measurement. Upgrading Floating UI is a normal dependency
bump gated by the Core positioner tests.

## Release

- All five packages share one version. Vanilla, React, Vue, and Svelte are the only packages on
  npm. Core is private: adapters keep `workspace:^` in the repository, and
  `scripts/bundle-core.mjs` (used by `pnpm pack:packages` and the publish script) vendors the
  built Core into each tarball under `dist/vendor/core/`, rewrites the imports, and swaps the
  Core dependency for Core's runtime dependencies (`@floating-ui/dom`).
- Shared page state in Core (layer registry, scroll lock, modal background, id counter) lives on
  `globalThis` via `getGlobalState()`. Add any new page-global state the same way, and bump its
  version when a stored shape changes; `tests/bundled-copies.test.ts` guards this.
- Peer ranges: React `^18.0.0 || ^19.0.0`, Vue `^3.5.0`, Svelte `^5.0.0`.
- Preflight: `pnpm install --frozen-lockfile`, `pnpm clean`, `pnpm check`, `pnpm readme:check`,
  build every example, then `pnpm pack:packages` (tarballs in `artifacts/`, no publish).
- Inspect each adapter tarball: only `package.json`, `README*.md`, `LICENSE`, and `dist/**`
  (including `dist/vendor/core/**`); no `workspace:` and no `@zealakit/overlay-core` in the
  manifest or `dist` outside the vendor folder; `main`/`module`/`types`/`exports` point into
  `dist`; no sources, tests, source maps, absolute paths, or credentials; metadata has repository, homepage, bugs,
  license, engines, and framework peers.
- Validate the adapter tarballs in temporary projects outside the repository (no Core tarball;
  framework peer from the registry, a TypeScript build, and a Node SSR import). Never
  validate with `workspace:*` aliases or `packages/*` imports.
- Publishing is manual and needs explicit authorization: run `pnpm npm:publish:check`, then
  `pnpm npm:publish:all` (or one adapter command, `pnpm npm:publish:<adapter>`). The script
  builds and tests Core plus the target adapters, packs and bundles Core into each adapter
  tarball, inspects it, then publishes only adapters. Core is never published and never
  documented as an install entry point. No CI or automated publishing. Storybook and Changesets stay
  out of scope. Tag `vX.Y.Z` only after preflight.

## Documentation

- READMEs are the only product documentation; follow the
  [readme-system skill](../readme-system/SKILL.md) for structure, tables, links, and voice.
- User-facing integration skills live in `skills/overlay-<framework>.md`; internal agent guidance
  stays in `.agents/`. Link the former from the root and package READMEs, never the latter.
- Keep the root README and package READMEs synchronized with public APIs in EN, VI, and CN.
- Use absolute GitHub links, because npm breaks relative ones.
- Document implemented behavior only; state limitations clearly. There is no docs app.

## Reuse

To support another source tree, copy this file to
`.agents/skills/<source>/SKILL.md`, change `name`/`description` and paths, and add it to
`.agents/AGENTS.md`. Keep hard repository rules in `AGENTS.md`; keep this file compact.
