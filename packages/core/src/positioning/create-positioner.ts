import {
  arrow as arrowMiddleware,
  autoUpdate as createAutoUpdate,
  computePosition as computeEnginePosition,
  flip as flipMiddleware,
  offset as offsetMiddleware,
  shift as shiftMiddleware,
} from "@floating-ui/dom";
import type { ReferenceElement as EngineReferenceElement } from "@floating-ui/dom";

import type { FloatingElement, ReferenceElement } from "../types/element.js";
import type { Rect } from "../types/geometry.js";
import type { Cleanup } from "../types/lifecycle.js";
import type {
  CreatePositionerOptions,
  Positioner,
  PositionerListener,
  PositionerOptions,
  PositionerResult,
} from "../types/positioner.js";
import { isConnected } from "../utils/element.js";
import { isElement } from "../utils/dom.js";
import { parsePlacement } from "./placement.js";
import { resolveStrategy } from "./strategy.js";

/** `strategy` stays undefined until the caller sets it; undefined means automatic. */
type ResolvedOptions = Required<Omit<PositionerOptions, "strategy">> & {
  strategy: PositionerOptions["strategy"];
};

const DEFAULT_OPTIONS: ResolvedOptions = {
  placement: "bottom",
  offset: 0,
  alignOffset: 0,
  flip: true,
  shift: true,
  padding: 0,
  boundary: "clippingAncestors",
  strategy: undefined,
  autoUpdate: true,
  arrow: null,
};

function resolveOptions(patch: Partial<PositionerOptions>): ResolvedOptions {
  return {
    placement: patch.placement ?? DEFAULT_OPTIONS.placement,
    offset: patch.offset ?? DEFAULT_OPTIONS.offset,
    alignOffset: patch.alignOffset ?? DEFAULT_OPTIONS.alignOffset,
    flip: patch.flip ?? DEFAULT_OPTIONS.flip,
    shift: patch.shift ?? DEFAULT_OPTIONS.shift,
    padding: patch.padding ?? DEFAULT_OPTIONS.padding,
    boundary: patch.boundary ?? DEFAULT_OPTIONS.boundary,
    strategy: patch.strategy,
    autoUpdate: patch.autoUpdate ?? DEFAULT_OPTIONS.autoUpdate,
    arrow: patch.arrow ?? DEFAULT_OPTIONS.arrow,
  };
}

/** Drop `undefined` entries so a partial update cannot reset unrelated options. */
function definedOptions(
  patch: Partial<PositionerOptions>,
): Partial<PositionerOptions> {
  const entries = Object.entries(patch).filter(
    ([, value]) => value !== undefined,
  );
  return Object.fromEntries(entries) as Partial<PositionerOptions>;
}

function toClientRect(rect: Rect): {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    left: rect.x,
  };
}

/**
 * Adapt core's minimal `VirtualElement` contract to the engine's shape.
 *
 * The engine is an implementation detail; core only promises `x/y/width/height`.
 */
function toEngineReference(
  reference: ReferenceElement,
): EngineReferenceElement {
  if (isElement(reference)) {
    return reference;
  }

  return {
    getBoundingClientRect: () =>
      toClientRect(reference.getBoundingClientRect()),
    ...(reference.contextElement
      ? { contextElement: reference.contextElement }
      : {}),
  };
}

/**
 * Create a collision-aware positioning session.
 *
 * Collision handling (flip/shift) is delegated to Floating UI but never leaks
 * through this API; adapters only see coordinates, placement, and strategy.
 */
export function createPositioner(
  initial: CreatePositionerOptions = {},
): Positioner {
  let reference: ReferenceElement | null = initial.reference ?? null;
  let floating: FloatingElement | null = initial.floating ?? null;
  let options = resolveOptions(initial);
  let disposed = false;
  let updateId = 0;
  let stopAutoUpdate: Cleanup | null = null;
  const listeners = new Set<PositionerListener>();

  const compute = async (): Promise<PositionerResult | null> => {
    if (disposed) {
      return null;
    }

    const currentReference = reference;
    const currentFloating = floating;
    if (!currentReference || !currentFloating) {
      return null;
    }
    if (!isConnected(currentFloating)) {
      return null;
    }
    if (isElement(currentReference) && !isConnected(currentReference)) {
      return null;
    }

    try {
      const placement = parsePlacement(options.placement).placement;
      const boundary =
        options.boundary === "viewport"
          ? "clippingAncestors"
          : options.boundary;
      const rootBoundary = "viewport";

      const middleware = [
        offsetMiddleware({
          mainAxis: options.offset,
          crossAxis: options.alignOffset,
        }),
      ];

      if (options.flip) {
        middleware.push(
          flipMiddleware({
            padding: options.padding,
            boundary,
            rootBoundary,
          }),
        );
      }
      if (options.shift) {
        middleware.push(
          shiftMiddleware({
            padding: options.padding,
            boundary,
            rootBoundary,
          }),
        );
      }
      if (options.arrow?.element && isConnected(options.arrow.element)) {
        middleware.push(
          arrowMiddleware({
            element: options.arrow.element,
            padding: options.arrow.padding ?? 0,
          }),
        );
      }

      const result = await computeEnginePosition(
        toEngineReference(currentReference),
        currentFloating as HTMLElement,
        {
          placement,
          strategy: resolveStrategy(currentReference, options.strategy),
          middleware,
        },
      );

      const arrow = result.middlewareData.arrow;
      return {
        x: result.x,
        y: result.y,
        placement: result.placement,
        strategy: result.strategy,
        ...(arrow
          ? {
              arrow: {
                ...(typeof arrow.x === "number" ? { x: arrow.x } : {}),
                ...(typeof arrow.y === "number" ? { y: arrow.y } : {}),
                centerOffset: arrow.centerOffset ?? 0,
              },
            }
          : {}),
      };
    } catch {
      return null;
    }
  };

  const update = async (): Promise<PositionerResult | null> => {
    if (disposed) {
      return null;
    }

    const id = ++updateId;
    const currentReference = reference;
    const currentFloating = floating;
    const result = await compute();

    if (disposed || id !== updateId) {
      return null;
    }
    if (reference !== currentReference || floating !== currentFloating) {
      return null;
    }
    if (!result) {
      return null;
    }

    for (const listener of [...listeners]) {
      listener(result);
    }
    return result;
  };

  const stopWatching = (): void => {
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  };

  const startWatching = (): void => {
    stopWatching();

    if (disposed || !options.autoUpdate) {
      return;
    }
    if (!reference || !floating || !isConnected(floating)) {
      return;
    }
    if (isElement(reference) && !isConnected(reference)) {
      return;
    }

    stopAutoUpdate = createAutoUpdate(
      toEngineReference(reference),
      floating as HTMLElement,
      () => {
        void update();
      },
    );
  };

  const refresh = (): void => {
    if (disposed) {
      return;
    }
    startWatching();
    void update();
  };

  refresh();

  return {
    get isDisposed() {
      return disposed;
    },
    setReference(next) {
      if (disposed) {
        return;
      }
      reference = next;
      refresh();
    },
    setFloating(next) {
      if (disposed) {
        return;
      }
      floating = next;
      refresh();
    },
    setOptions(patch) {
      if (disposed) {
        return;
      }
      options = resolveOptions({
        ...options,
        ...definedOptions(patch),
      });
      refresh();
    },
    update,
    subscribe(listener) {
      if (disposed) {
        return () => {};
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      updateId += 1;
      stopWatching();
      listeners.clear();
      reference = null;
      floating = null;
    },
  };
}
