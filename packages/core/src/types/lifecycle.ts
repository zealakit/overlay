/** A function that releases a resource. Must be safe to call more than once. */
export type Cleanup = () => void;

/**
 * Groups cleanup functions and disposes them in reverse registration order.
 *
 * `dispose()` is idempotent; adding a cleanup after disposal invokes it
 * immediately so leaked listeners cannot accumulate.
 */
export type Disposer = {
  readonly isDisposed: boolean;
  add(cleanup: Cleanup): Cleanup;
  dispose(): void;
};
