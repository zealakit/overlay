import type { Readable } from "svelte/store";
import {
  type Positioner,
  type PositionerOptions,
  type PositionerResult,
  type ReferenceElement,
  createPositioner as createCorePositioner,
  isSamePositionerResult,
} from "@zealakit/overlay-core";

export type CreatePositionerOptions = PositionerOptions & {
  reference?: ReferenceElement | null;
  floating?: HTMLElement | null;
  /** Apply `position`/`left`/`top`/`data-placement`. Defaults to true. */
  applyStyles?: boolean;
};

export type PositionerController = {
  /** Svelte-readable store of the latest result. */
  subscribe: Readable<PositionerResult | null>["subscribe"];
  update(): Promise<PositionerResult | null>;
  setOptions(options: Partial<PositionerOptions>): void;
  setReference(reference: ReferenceElement | null): void;
  setFloating(floating: HTMLElement | null): void;
  setApplyStyles(applyStyles: boolean): void;
  dispose(): void;
};

const OPTION_KEYS = [
  "placement",
  "offset",
  "alignOffset",
  "flip",
  "shift",
  "padding",
  "boundary",
  "strategy",
  "autoUpdate",
] as const;

function sameOptions(
  first: PositionerOptions,
  second: PositionerOptions,
): boolean {
  return OPTION_KEYS.every((key) => first[key] === second[key]);
}

/**
 * Imperative positioning controller with a Svelte-readable result.
 *
 * The `floating` action is a declarative wrapper around this; use the
 * controller directly when you need manual `update()` control outside an
 * action or want to bind the result into a component.
 */
export function createPositioner(
  options: CreatePositionerOptions = {},
): PositionerController {
  const {
    reference = null,
    floating = null,
    applyStyles = true,
    ...positioning
  } = options;

  let currentReference: ReferenceElement | null = reference;
  let currentFloating: HTMLElement | null = floating;
  let applyStylesEnabled = applyStyles;
  let currentOptions: PositionerOptions = { ...positioning };
  let result: PositionerResult | null = null;
  let disposed = false;

  const listeners = new Set<(value: PositionerResult | null) => void>();
  const positioner: Positioner = createCorePositioner({
    ...positioning,
    reference: currentReference,
    floating: currentFloating,
  });

  const apply = (next: PositionerResult): void => {
    if (!applyStylesEnabled || !currentFloating) {
      return;
    }
    currentFloating.style.position = next.strategy;
    currentFloating.style.left = `${next.x}px`;
    currentFloating.style.top = `${next.y}px`;
    currentFloating.dataset.placement = next.placement;
  };

  const emit = (): void => {
    for (const listener of [...listeners]) {
      listener(result);
    }
  };

  const setResult = (next: PositionerResult | null): void => {
    if (next === null) {
      if (result === null) {
        return;
      }
      result = null;
    } else {
      if (isSamePositionerResult(result, next)) {
        return;
      }
      result = next;
      apply(next);
    }
    emit();
  };

  const unsubscribe = positioner.subscribe((next) => {
    if (!currentFloating) {
      return;
    }
    setResult(next);
  });

  return {
    subscribe(run) {
      run(result);
      listeners.add(run);
      return () => {
        listeners.delete(run);
      };
    },
    update: () => positioner.update(),
    setOptions(next) {
      if (disposed) {
        return;
      }

      const merged: PositionerOptions = { ...currentOptions };
      for (const key of OPTION_KEYS) {
        const value = next[key];
        if (value !== undefined) {
          merged[key] = value as never;
        }
      }
      if (sameOptions(currentOptions, merged)) {
        return;
      }
      currentOptions = merged;
      positioner.setOptions(next);
    },
    setReference(next) {
      if (disposed || next === currentReference) {
        return;
      }
      currentReference = next;
      if (!next && currentFloating) {
        setResult(null);
      }
      positioner.setReference(next);
    },
    setFloating(next) {
      if (disposed || next === currentFloating) {
        return;
      }
      currentFloating = next;
      if (!next) {
        setResult(null);
      }
      positioner.setFloating(next);
    },
    setApplyStyles(next) {
      if (applyStylesEnabled === next) {
        return;
      }
      applyStylesEnabled = next;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      unsubscribe();
      positioner.dispose();
      listeners.clear();
      currentReference = null;
      currentFloating = null;
      result = null;
    },
  };
}
