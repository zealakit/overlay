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
docs/ + READMEs -> product documentation
```

- **Core** (`packages/core`) owns types, positioning, layers, dismissal, focus,
  lifecycle, scroll lock, and the shared DOM overlay controller.
- **Adapters** own framework lifecycle and idiomatic APIs:
  - vanilla: DOM controllers
  - react: compound components + hooks
  - vue: composables
  - svelte: controllers + actions
- **Docs** live in `README.md`, package READMEs, and `docs/`. Keep examples as integration
  references, not a documentation app.

## Tree

```text
overlay/
├── .agents/
│   ├── AGENTS.md                 # hard rules, commands, boundaries
│   ├── rules/overlay.mdc         # editor always-apply rule
│   └── skills/overlay/SKILL.md   # this workflow
├── AGENTS.md    -> .agents/AGENTS.md
├── CLAUDE.md    -> .agents/AGENTS.md
├── .cursor      -> .agents
├── docs/                         # ADRs, component design, release docs
├── examples/                     # vanilla, react, vue, svelte, nextjs, astro
├── packages/
│   ├── core/src/                 # controller, positioning, layer, focus, ...
│   ├── vanilla/src/              # DOM controllers + low-level APIs
│   ├── react/src/                # components + hooks
│   ├── vue/src/                  # composables
│   └── svelte/src/               # controllers + actions
├── monitor/                      # local dependency dashboard
├── scripts/                      # packaging helpers
├── CHANGELOG.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── biome.json
```

Each package uses `src/` (public barrel + implementation), `tests/`, and generated `dist/`.
Keep integration demos in `examples/`, documentation in READMEs/`docs/`, and generated output
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
8. Update docs/READMEs when public behavior changes.

### Framework notes

- **React:** `"use client"` where required; refs/effects; Strict Mode cleanup;
  positioning updates must commit before paint.
- **Vue:** `MaybeRefOrGetter`, shallow refs, correct watcher flush, `onScopeDispose`.
- **Svelte:** Svelte 5 actions/controllers; mount/cleanup via `onMount`/`onDestroy`.
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
- For release changes, follow `docs/releasing.md` and `docs/release-checklist.md`; inspect
  tarballs and test isolated consumers. Never publish or require credentials unless explicitly
  asked.

## Documentation

- Keep the root README, package READMEs, and `docs/` synchronized with public APIs.
- Use absolute GitHub links in package READMEs where npm would break relative links.
- Document implemented behavior only; state limitations clearly. There is no docs app.

## Reuse

To support another source tree, copy this file to
`.agents/skills/<source>/SKILL.md`, change `name`/`description` and paths, and add it to
`.agents/AGENTS.md`. Keep hard repository rules in `AGENTS.md`; keep this file compact.
