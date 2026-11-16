# Plan — Arrow + Animation across all adapters

Status: draft · Branch: `coding/v1.0.0-beta.1`

Each task below is sized for **one subagent run**: ≤ 3–4 source files, one package's tests,
and a self-contained brief. Run tasks **in order** unless marked parallel-safe. Every brief must
tell the subagent to load `.agents/skills/overlay/SKILL.md` first and to run only the verify
command listed (not the whole `pnpm check`) to keep memory low.

---

## 0. Where things stand today (read before starting)

| Area | Arrow | Animation |
| --- | --- | --- |
| Core types / positioner | ✅ `ArrowOptions`, `ArrowData`, arrow middleware in `create-positioner.ts` | ✅ `types/animation.ts`: `normalizeAnimationConfig`, `resolveAnimationDirection` |
| Core DOM controller (`controller/overlay-controller.ts`) | ❌ none | ❌ none (toggles `hidden` instantly) |
| React | ✅ `components/arrow.tsx` (`PopoverArrow`, `TooltipArrow`, `arrow` shorthand on Content, off by default) | ✅ `animation/presence.tsx` (WAAPI fade + custom classes, exit reverses direction, reduced motion) |
| Vanilla / Vue / Svelte | ❌ (they wrap the core controller) | ❌ |
| Tests | ❌ no arrow tests anywhere | ⚠️ only one React test touches animation |
| Docs | ⚠️ `docs/popover.md` still says "no arrow / no animation" | ⚠️ stale |

So the work is mainly: **move the animation and arrow DOM logic into core helpers, have the core
controller use them (that covers Vanilla, Vue and Svelte), refactor React onto the same helpers,
then add tests, docs and examples.**

## 1. Decisions (confirm before Task C1)

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | Animation default | **Off** everywhere (`animation` omitted ⇒ disabled; `true` ⇒ default fade). Today React defaults to **on**, so this changes React's current behavior. |
| D2 | Timing functions | Presets `"ease-in-out"` (default) and `"linear"`; still accept any CSS timing string (for example a `cubic-bezier(...)`) through `(string & {})`. |
| D3 | Direction | `"up" \| "down" \| "left" \| "right" \| "auto"` (auto = from final placement). Exit always replays the enter movement in reverse (opposite direction). Already true in React; lock it in with tests. |
| D4 | Arrow ownership (Vanilla/Vue/Svelte) | Headless: the consumer provides the arrow element (`arrow: { element, size?, padding? }`); core only positions it and writes its styles. React keeps rendering its own `<div>`. |
| D5 | Arrow styling mechanism | Core writes geometry inline (`left/top`, static side `-size/2`, `rotate(45deg)`), plus `data-side` on the arrow element and the CSS variables `--overlay-arrow-size` and `--overlay-arrow-background` (default `inherit`) and `--overlay-arrow-border`. The popup panel sets the variables, so the arrow keeps the panel's color and border. |
| D6 | Scope | Arrow: Popover + Tooltip only (Dialog has no anchor; ContextMenuArrow stays out of scope). Animation: all four, plus the Dialog backdrop (fade only, no movement). |

---

## 2. Tasks

Legend: **Files** = only files the agent may touch · **Verify** = the only command to run.

### Core — animation

**C1. Animation config defaults and presets**
- Files: `packages/core/src/types/animation.ts`, new `packages/core/tests/animation.test.ts`
- Do: apply D1/D2 (`enabled` default false when `undefined`; `true` ⇒ enabled fade; easing
  default `"ease-in-out"`; export `AnimationTimingFunction` preset type). Keep existing
  validation errors.
- Tests: normalize `undefined/true/false/{…}`, invalid duration/delay throws, custom requires
  enter+exit, `resolveAnimationDirection` for all sides and an explicit override.
- Verify: `pnpm --filter @zealakit/overlay-core run build && pnpm --filter @zealakit/overlay-core run test`

**C2. Pure fade keyframes builder**
- Files: new `packages/core/src/animation/keyframes.ts`, new `packages/core/src/animation/index.ts`,
  `packages/core/src/index.ts`, `packages/core/tests/animation.test.ts`
- Do: move `enterOffset` + keyframe construction out of React `presence.tsx` into
  `createFadeKeyframes(phase: "enter"|"exit", direction, distance)`. No DOM access.
- Tests: enter "up" goes from `translate 0 4px` to `0 0`; exit is the exact reverse; distance 0
  (reduced motion) gives opacity only.
- Verify: same as C1.

**C3. DOM animation runner (framework-free)**
- Files: new `packages/core/src/animation/run-animation.ts`, `packages/core/src/animation/index.ts`,
  `packages/core/tests/animation.test.ts`
- Do: `runOverlayAnimation(element, { phase, config, placement, reducedMotion }) => { finished: Promise<void>; cancel(): void }`.
  Port logic from React `useOverlayElementAnimation`: WAAPI fade, custom classes waiting on
  `getAnimations()`, immediate finish when WAAPI is missing or there are no animations, cancel
  removes classes. Add `prefersReducedMotion(win)` helper (guarded, called lazily, never at
  import).
- Tests (happy-dom): no-WAAPI resolves immediately; custom class added/removed; cancel
  prevents resolve; SSR test still passes (no globals at import).
- Verify: same as C1.

**C4. React uses the core runner**
- Files: `packages/react/src/animation/presence.tsx` only
- Do: replace the in-hook WAAPI/custom logic with `runOverlayAnimation`; keep the hook's public
  shape. Apply D1 default (Content `animation` omitted ⇒ off); update the JSDoc on the
  `animation` props in popover/tooltip/dialog/context-menu `content.tsx` (comment-only edits).
- Verify: `pnpm build:core && pnpm --filter @zealakit/overlay-react run test`

### Core — arrow

**C5. Arrow style helper**
- Files: new `packages/core/src/positioning/arrow.ts`, `packages/core/src/positioning/index.ts`,
  new `packages/core/tests/arrow.test.ts`
- Do: `arrowStaticSide(side)` and `getArrowStyles({ placement, arrow: ArrowData|undefined, size })`
  returning a plain style object + `side` (D5). Plus `applyArrowStyles(element, styles)` /
  `resetArrowStyles(element, original)` for DOM callers.
- Tests: each of the 4 sides puts the arrow on the opposite edge; hidden when no data; CSS-var
  background default.
- Verify: same as C1.

**C6. React arrow uses the core helper and gets tests**
- Files: `packages/react/src/components/arrow.tsx`, new `packages/react/tests/arrow.test.ts`
- Do: replace local `staticEdge` and style math with `getArrowStyles`; keep `style` prop override.
- Tests: `arrow` shorthand off by default (no `[data-arrow]`); on ⇒ one arrow with `data-side`;
  `PopoverArrow` + shorthand renders only one; `TooltipArrow` works; flipped placement updates
  `data-side`.
- Verify: `pnpm build:core && pnpm --filter @zealakit/overlay-react run test`

### Core controller (covers Vanilla / Vue / Svelte)

**C7. Controller `arrow` option**
- Files: `packages/core/src/controller/overlay-controller.ts`, `packages/vanilla/tests/components.test.ts`
- Do: add `arrow?: { element: HTMLElement; size?: number; padding?: number } | null` to
  `OverlayControllerOptions` (ignored for `dialog`/`context-menu`). Pass to the positioner, apply
  `getArrowStyles` in the position subscription, support toggling through `setOptions`, and
  restore the original styles on `destroy`.
- Tests: no arrow by default; arrow element gets `data-side` + styles after open; `setOptions({ arrow: null })` resets.
- Verify: `pnpm build:core && pnpm --filter @zealakit/overlay-vanilla run test`

**C8a. Controller `animation` option: enter**
- Files: `overlay-controller.ts`, `packages/vanilla/tests/components.test.ts`
- Do: add `animation?: AnimationSetting`; on open, after the first position result, call
  `runOverlayAnimation(content, { phase: "enter", … })`. Set `data-animating="enter"` while running.
- Verify: as C7.

**C8b. Controller animation: exit + interruption**
- Files: same as C8a
- Do: on close, keep content visible with `data-state="closed"` + `data-animating="exit"` until
  `finished`, then set `hidden`. Reopening during exit cancels it and plays enter. `destroy()`
  cancels any running animation. Layer/focus teardown stays immediate (only visuals are deferred).
- Tests: hidden only after exit resolves; reopen mid-exit; destroy mid-exit; disabled ⇒ instant
  (current behavior unchanged).
- Verify: as C7.

**C8c. Controller animation: Dialog backdrop**
- Files: same as C8a
- Do: backdrop runs a fade with no movement, in sync with the content; it's hidden after both finish.
- Verify: as C7.

### Adapters

**A1. Vanilla surface + README**: `packages/vanilla/src/components/overlay-components.ts` (types
already pass through, so check only), `packages/vanilla/README.md`. Verify: vanilla test.

**A2. Vue**: `packages/vue/src/composables/use-overlay-component.ts` (+ test file). Accept a
`Ref<HTMLElement|null>` for `arrow.element`, and forward `animation` + `arrow` reactively through
`setOptions`. Tests in `packages/vue/tests/components.test.ts`. Verify:
`pnpm build:core && pnpm --filter @zealakit/overlay-vue run test`

**A3. Svelte**: `packages/svelte/src/components/overlay-components.ts` (+ an action for the arrow
element if the pattern requires it). Tests in `packages/svelte/tests/components.test.ts`. Verify:
`pnpm build:core && pnpm --filter @zealakit/overlay-svelte run test`

A2 and A3 are parallel-safe after C8c (they touch different packages).

### Docs and examples (parallel-safe with each other, after A3)

**D-1.** `docs/popover.md`, `docs/tooltip.md`: remove the "no arrow/animation" lines and document the
`arrow` and `animation` options, the CSS variables and the data attributes.
**D-2.** `docs/dialog.md`, `docs/context-menu.md`, root `README.md` (the "Not implemented" line), `CHANGELOG.md`.
**D-3.** `packages/react/README.md`, `packages/vue/README.md`, `packages/svelte/README.md`.
**E-1…E-6.** One task per example (`examples/vanilla`, `react`, `vue`, `svelte`, `nextjs`, `astro`):
add an arrow + animation demo (direction picker, linear vs ease-in-out). Verify: that example's build.

### Final

**F1.** `pnpm check` (build + typecheck + test + lint), then build every example. Update
`CLAUDE.md` and `.agents/skills/overlay/SKILL.md` if any boundaries changed (for example the new
core `animation/` module).

---

## 3. Dependency graph

```
C1 → C2 → C3 → C4
          C3 ─┐
C5 → C6       ├→ C7 → C8a → C8b → C8c → A1 ─┬→ A2 ─┐
C5 ───────────┘                             └→ A3 ─┴→ D-1/D-2/D-3, E-1…E-6 → F1
```
C5/C6 can run in parallel with C1–C4 (different files).

## 4. Subagent brief template

```
Load .agents/skills/overlay/SKILL.md. Implement task <ID> from docs/plans/arrow-and-animation.md.
Touch only the listed files. Follow the decisions in section 1. Run only the Verify command;
report changed files, test results, and anything left undone. Do not commit.
```
