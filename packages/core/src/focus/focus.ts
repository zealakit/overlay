import type { Cleanup } from "../types/lifecycle.js";
import { isEscapeKey } from "../events/keyboard.js";
import { listen } from "../lifecycle/events.js";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "audio[controls]",
  "video[controls]",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isHidden(element: HTMLElement): boolean {
  if (element.closest("[hidden], [inert], [aria-hidden='true']")) {
    return true;
  }

  const view = element.ownerDocument.defaultView;
  if (!view) {
    return false;
  }

  const style = view.getComputedStyle(element);
  return style.display === "none" || style.visibility === "hidden";
}

function isDisabled(element: HTMLElement): boolean {
  if (element.hasAttribute("disabled")) {
    return true;
  }

  try {
    return element.matches(":disabled");
  } catch {
    return false;
  }
}

/**
 * True when an element can currently receive keyboard focus.
 *
 * Visibility is checked through hidden/inert/aria-hidden ancestors and computed
 * styles. Layout metrics are deliberately not required because non-browser DOM
 * implementations (and happy-dom in tests) do not lay out elements.
 */
export function isFocusable(
  element: Element | null | undefined,
): element is HTMLElement {
  if (!element?.isConnected) {
    return false;
  }

  const candidate = element as HTMLElement;
  if (typeof candidate.focus !== "function") {
    return false;
  }
  if (!candidate.matches(FOCUSABLE_SELECTOR) || candidate.tabIndex < 0) {
    return false;
  }
  return !isDisabled(candidate) && !isHidden(candidate);
}

/** Elements inside `container` that can receive focus, in DOM order. */
export function getFocusableElements(container: Element): HTMLElement[] {
  return [
    ...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ].filter(isFocusable);
}

/**
 * Focus an element if it is connected and focusable. Returns whether focus
 * actually moved.
 */
export function focusElement(element: Element | null | undefined): boolean {
  if (!element?.isConnected) {
    return false;
  }

  const candidate = element as HTMLElement;
  if (typeof candidate.focus !== "function") {
    return false;
  }

  candidate.focus();
  return getActiveElement(element.ownerDocument) === element;
}

/**
 * Focus the first focusable element inside `container`.
 *
 * Candidates are tried in order; hidden/disabled nodes that still match the
 * selector cannot block a later valid candidate.
 */
export function focusFirst(container: Element): HTMLElement | null {
  for (const element of getFocusableElements(container)) {
    if (focusElement(element)) {
      return element;
    }
  }
  return null;
}

/** Restore focus to a previously captured element, when it still exists. */
export function restoreFocus(element: Element | null | undefined): boolean {
  return focusElement(element);
}

/** Resolve the deepest active element, including open shadow roots. */
export function getActiveElement(
  root?: Document | ShadowRoot | null,
): Element | null {
  const documentRef =
    root ?? (typeof document !== "undefined" ? document : null);
  if (!documentRef) {
    return null;
  }

  let active = documentRef.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

export type FocusContainmentTarget =
  | "first"
  | "container"
  | Element
  | (() => Element | null)
  | null;

export type FocusContainmentOptions = {
  container: Element | (() => Element | null);
  /** Defaults to true. */
  enabled?: boolean;
  /**
   * Optional focus target when containment turns on. `"first"` focuses the
   * first focusable descendant; `"container"` focuses the container itself
   * (it should be focusable, e.g. `tabindex="-1"`).
   */
  initialFocus?: FocusContainmentTarget;
  /** Restore the previously active element when containment turns off. */
  restoreFocus?: boolean;
  /** Called for Escape while containment is enabled. */
  onEscape?: (event: KeyboardEvent) => void;
  /**
   * Optional predicate for nested layers. Return false to yield focus handling
   * to a child layer while it is active.
   */
  shouldContain?: (event: Event) => boolean;
};

export type FocusContainment = {
  readonly isEnabled: boolean;
  setEnabled(enabled: boolean): void;
  /** Temporarily detach without restoring focus (for a nested child layer). */
  suspend(): void;
  /** Reattach after `suspend()` without recapturing or moving focus. */
  resume(): void;
  focusFirst(): HTMLElement | null;
  focusContainer(): boolean;
  restore(): boolean;
  dispose(): void;
};

function resolveTarget(
  target: Exclude<FocusContainmentTarget, "first" | "container" | null>,
): Element | null {
  return typeof target === "function" ? target() : target;
}

/**
 * Reusable focus containment (a focus trap primitive).
 *
 * While enabled:
 * - Tab/Shift+Tab wrap inside the container.
 * - Focus moving outside the container is redirected back.
 * - Focusable elements are queried on demand, so dynamic content works without
 *   a MutationObserver.
 *
 * It does not set ARIA attributes, roles, or `inert`; those remain component
 * responsibilities. Use `shouldContain` or disable the parent controller when a
 * nested child layer needs its own containment.
 */
export function createFocusContainment(
  options: FocusContainmentOptions,
): FocusContainment {
  let enabled = false;
  let disposed = false;
  let captured: Element | null = null;
  let redirecting = false;
  let cleanups: Cleanup[] = [];

  const resolveContainer = (): Element | null =>
    typeof options.container === "function"
      ? options.container()
      : options.container;

  const detach = (): void => {
    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups = [];
  };

  const restore = (): boolean => {
    if (!options.restoreFocus || !captured) {
      return false;
    }
    const target = captured;
    captured = null;
    return restoreFocus(target);
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!enabled || disposed || event.defaultPrevented) {
      return;
    }

    const container = resolveContainer();
    if (!container?.isConnected) {
      return;
    }
    if (options.shouldContain && !options.shouldContain(event)) {
      return;
    }

    if (isEscapeKey(event)) {
      options.onEscape?.(event);
      return;
    }

    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const focusables = getFocusableElements(container);
    const active = getActiveElement(container.ownerDocument);
    const first = focusables[0] ?? null;
    const last = focusables[focusables.length - 1] ?? null;

    if (!first || !last) {
      event.preventDefault();
      focusElement(container);
      return;
    }

    const index = active ? focusables.indexOf(active as HTMLElement) : -1;
    if (index === -1) {
      event.preventDefault();
      focusElement(event.shiftKey ? last : first);
      return;
    }

    if (event.shiftKey && index === 0) {
      event.preventDefault();
      focusElement(last);
    } else if (!event.shiftKey && index === focusables.length - 1) {
      event.preventDefault();
      focusElement(first);
    }
  };

  const handleFocusIn = (event: FocusEvent): void => {
    if (!enabled || disposed || redirecting) {
      return;
    }

    const container = resolveContainer();
    if (!container?.isConnected) {
      return;
    }
    if (options.shouldContain && !options.shouldContain(event)) {
      return;
    }

    const path = event.composedPath();
    if (path.includes(container)) {
      return;
    }

    const target = event.target as Node | null;
    if (
      target &&
      typeof target.nodeType === "number" &&
      container.contains(target)
    ) {
      return;
    }

    redirecting = true;
    if (!focusFirst(container)) {
      focusElement(container);
    }
    redirecting = false;
  };

  const focusInitial = (container: Element): void => {
    const target = options.initialFocus;
    if (!target) {
      return;
    }
    if (target === "first") {
      focusFirst(container);
      return;
    }
    if (target === "container") {
      focusElement(container);
      return;
    }
    focusElement(resolveTarget(target));
  };

  const attach = (capture: boolean, initial: boolean): boolean => {
    const container = resolveContainer();
    if (!container?.isConnected) {
      return false;
    }

    const documentRef = container.ownerDocument;
    if (capture) {
      captured = options.restoreFocus ? getActiveElement(documentRef) : null;
    }

    cleanups.push(listen<KeyboardEvent>(documentRef, "keydown", handleKeyDown));
    cleanups.push(
      listen<FocusEvent>(documentRef, "focusin", handleFocusIn, true),
    );

    if (initial) {
      focusInitial(container);
    }
    return true;
  };

  const setEnabled = (next: boolean): void => {
    if (disposed || enabled === next) {
      return;
    }

    enabled = next;
    if (next) {
      if (!attach(true, true)) {
        enabled = false;
      }
      return;
    }

    detach();
    restore();
  };

  const suspend = (): void => {
    if (disposed || !enabled) {
      return;
    }
    enabled = false;
    detach();
  };

  const resume = (): void => {
    if (disposed || enabled) {
      return;
    }
    if (attach(false, false)) {
      enabled = true;
    }
  };

  const controller: FocusContainment = {
    get isEnabled() {
      return enabled;
    },
    setEnabled,
    suspend,
    resume,
    focusFirst() {
      const container = resolveContainer();
      return container ? focusFirst(container) : null;
    },
    focusContainer() {
      const container = resolveContainer();
      return container ? focusElement(container) : false;
    },
    restore,
    dispose() {
      if (disposed) {
        return;
      }
      if (enabled) {
        setEnabled(false);
      } else {
        restore();
      }
      disposed = true;
      detach();
    },
  };

  controller.setEnabled(options.enabled ?? true);

  return controller;
}
