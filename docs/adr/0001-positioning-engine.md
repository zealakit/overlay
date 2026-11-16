# ADR 0001 — Positioning engine for `@zealakit/overlay-core`

- Status: Accepted
- Date: 2026-11-14
- Package: `@zealakit/overlay-core`

## Context

Overlay needs positioning that works for four adapters (Vanilla, React, Vue, Svelte), supports
collision handling (flip/shift), boundary constraints, virtual anchors, automatic updates on
scroll/resize, and cleans up reliably. It must be SSR-safe: importing core must not require
browser globals.

The previous core only had synchronous placement math (`computePosition`): no collision
detection, no boundary awareness, and no stateful update API.

## Options considered

### 1. Native browser features only

CSS anchor positioning and native popover APIs are attractive but not uniformly available
across evergreen browsers at the time of writing, and they do not solve collision-aware
floating placement consistently. They also cannot cover virtual anchors or programmatic
coordinates. Rejected as the sole strategy; native features may later replace parts of the
engine behind the same core API.

### 2. Build a custom positioning engine

A minimal flip/shift engine is tempting, but correct overflow detection involves clipping
ancestors, scroll containers, transforms, zoom, RTL, shadow DOM, and browser quirks. Building
that now would be a large, permanent maintenance surface and duplicates an already-solved
problem — explicitly discouraged by the project scope ("do not prematurely build a custom
positioning engine"). Rejected for this phase.

### 3. Adopt Floating UI (`@floating-ui/dom`)

- Framework-agnostic and already the de-facto standard for this problem.
- Provides `computePosition`, `autoUpdate`, `offset`, `flip`, `shift`, and virtual-element
  support; we only need the core middleware set today.
- Tree-shakeable ESM; the DOM platform is small relative to the rest of an overlay library.
- Import is SSR-safe (verified by importing the built core in a bare Node process).
- Well-tested across browsers, including RTL and clipping-ancestor edge cases.

Costs: one runtime dependency, a public API we must keep stable, and occasional major upgrades
to re-verify.

## Decision

Adopt `@floating-ui/dom` behind a **core-owned API**, `createPositioner()`.

- `packages/core` is the only package allowed to import Floating UI.
- Framework adapters consume `createPositioner`, `PositionerResult`, and `PositionerOptions`;
  engine types never appear in core's public types.
- Core's minimal `VirtualElement` (`{ x, y, width, height }`) is adapted internally to the
  engine's coordinate shape.
- Middleware is composed from core options (`offset`, `flip`, `shift`, `padding`, `boundary`)
  rather than exposing engine middleware directly.
- `autoUpdate` drives re-measurement; disposal cleans it up.

## Consequences

- `@floating-ui/dom` becomes a regular dependency of `@zealakit/overlay-core`; adapter packages
  stay engine-agnostic and bundle it transitively when they use `createPositioner`.
- The existing synchronous `computePosition` / `resolvePlacementCoordinates` helpers remain for
  simple math and for the current adapters. They will be retired once adapters migrate to
  `createPositioner` (next phase), avoiding two positioning paths long-term.
- Arrow placement, size middleware, auto-placement, and hide middleware are intentionally not
  exposed yet; they can be added as opt-in positioner options without breaking adapters.
- Upgrading Floating UI is a normal dependency upgrade with the core positioning tests as the
  regression gate.

## Verification

- Positioner tests run against `happy-dom` with deterministic element boxes, covering placement,
  offset/align offset, flip, shift, option updates, reference changes, virtual anchors, detached
  elements, disposal, and auto-update teardown.
- An SSR test imports the built package in a Node process with no DOM globals.
