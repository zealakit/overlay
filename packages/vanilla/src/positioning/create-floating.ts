import {
  type Cleanup,
  type PositionerListener,
  type PositionerOptions,
  type PositionerResult,
  type ReferenceElement,
  createPositioner,
} from "@zealakit/overlay-core";

export type FloatingOptions = PositionerOptions & {
  reference?: ReferenceElement | null;
  floating?: HTMLElement | null;
  /**
   * Write the result to the floating element (`position`, `left`, `top`,
   * `data-placement`). Defaults to `true`; set `false` to drive styles yourself.
   */
  applyStyles?: boolean;
};

export type Floating = {
  readonly result: PositionerResult | null;
  readonly isDisposed: boolean;
  setReference(reference: ReferenceElement | null): void;
  setFloating(floating: HTMLElement | null): void;
  setOptions(options: Partial<PositionerOptions>): void;
  update(): Promise<PositionerResult | null>;
  subscribe(listener: PositionerListener): Cleanup;
  dispose(): void;
};

/**
 * Create a vanilla positioning controller.
 *
 * This is a thin, DOM-native view over core's `createPositioner()`: it owns no
 * positioning math and applies safe style writes by default.
 */
export function createFloating(options: FloatingOptions = {}): Floating {
  const {
    reference = null,
    floating = null,
    applyStyles = true,
    ...positioning
  } = options;

  let floatingElement = floating;
  let result: PositionerResult | null = null;
  let disposed = false;

  const positioner = createPositioner({
    reference,
    floating,
    ...positioning,
  });

  const applyResult = (next: PositionerResult): void => {
    if (!applyStyles || !floatingElement) {
      return;
    }

    const { style } = floatingElement;
    style.position = next.strategy;
    style.left = `${next.x}px`;
    style.top = `${next.y}px`;
    floatingElement.dataset.placement = next.placement;
  };

  const unsubscribe = positioner.subscribe((next) => {
    result = next;
    applyResult(next);
  });

  return {
    get result() {
      return result;
    },
    get isDisposed() {
      return disposed;
    },
    setReference(next) {
      if (disposed) {
        return;
      }
      positioner.setReference(next);
    },
    setFloating(next) {
      if (disposed) {
        return;
      }
      floatingElement = next;
      positioner.setFloating(next);
    },
    setOptions(next) {
      if (!disposed) {
        positioner.setOptions(next);
      }
    },
    update: () => positioner.update(),
    subscribe(listener) {
      return positioner.subscribe(listener);
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      unsubscribe();
      positioner.dispose();
      floatingElement = null;
    },
  };
}
