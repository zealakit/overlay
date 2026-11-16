/**
 * Process-wide state shared by every copy of Core loaded on a page.
 *
 * Each public adapter ships its own bundled copy of Core, so module-level
 * variables would split per adapter (a React and a Vue overlay on the same
 * page would get separate layer stacks, scroll locks, and id counters). State
 * that must stay page-global lives on `globalThis` under a versioned
 * `Symbol.for` key instead. Bump the version when a stored shape changes so
 * incompatible copies never read each other's state.
 *
 * SSR-safe: it only touches `globalThis`, never `window` or `document`, and
 * state is created lazily on first use.
 */
const STATE_VERSION = 1;

export function getGlobalState<T>(name: string, create: () => T): T {
  const key = Symbol.for(`@zealakit/overlay-core/v${STATE_VERSION}/${name}`);
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  let value = store[key];
  if (value === undefined) {
    value = create();
    store[key] = value;
  }
  return value;
}
