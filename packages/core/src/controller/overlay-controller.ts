import {
  createFocusContainment,
  focusElement,
  focusFirst,
  getActiveElement,
  restoreFocus,
  type FocusContainment,
} from "../focus/focus.js";
import { acquireSharedLayerStack } from "../layer/create-layer-stack.js";
import type {
  LayerStack,
  LayerStackHandle,
  LayerStackLease,
} from "../types/layer.js";
import { isEscapeKey } from "../events/keyboard.js";
import { isPointerOutside } from "../events/pointer.js";
import { createPositioner } from "../positioning/index.js";
import type {
  Positioner,
  PositionerBoundary,
  PositionerResult,
} from "../types/positioner.js";
import { parsePlacement } from "../positioning/placement.js";
import { lockBodyScroll } from "../scroll-lock/scroll-lock.js";
import type {
  DismissReason,
  Placement,
  ReferenceElement,
  Strategy,
} from "../types/index.js";
import { isBrowser } from "../utils/dom.js";
import { listen } from "../lifecycle/index.js";
import type { Cleanup } from "../types/lifecycle.js";

export type OverlayControllerKind =
  | "popover"
  | "tooltip"
  | "dialog"
  | "context-menu";

export type OverlayChangeReason =
  | DismissReason
  | "trigger"
  | "select"
  | "programmatic";

export type OverlayFocusTarget = "container" | "first" | Element | null;

export type OverlayControllerOptions = {
  kind: OverlayControllerKind;
  trigger: HTMLElement;
  content: HTMLElement;
  backdrop?: HTMLElement | null;
  /** Controlled visibility; use setOpen() to reflect external state. */
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean, reason: OverlayChangeReason) => void;
  onSelect?: (item: HTMLElement, event: MouseEvent) => void;
  portal?: Element | null;
  stack?: LayerStack;
  parentLayer?: LayerStackHandle | null;
  boundaries?: readonly (Element | null)[];
  placement?: Placement;
  offset?: number;
  alignOffset?: number;
  flip?: boolean;
  shift?: boolean;
  padding?: number;
  boundary?: PositionerBoundary;
  strategy?: Strategy;
  autoUpdate?: boolean;
  dir?: "ltr" | "rtl";
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  modal?: boolean;
  lockScroll?: boolean;
  trapFocus?: boolean;
  initialFocus?: OverlayFocusTarget | boolean;
  finalFocus?: Element | null;
  restoreFocus?: boolean;
  /** Tooltip open/close delays. */
  delay?: number;
  closeDelay?: number;
  hoverableContent?: boolean;
  /** Dialog ARIA relationships. */
  labelledBy?: string;
  describedBy?: string;
};

export type OverlayControllerState = {
  isOpen: boolean;
  placement: Placement;
  point: { x: number; y: number } | null;
};

export type OverlayController = {
  readonly contentId: string;
  readonly isOpen: boolean;
  open(reason?: OverlayChangeReason): void;
  /** Set an explicit context-menu point (null anchors to the trigger). */
  openAt(
    point: { x: number; y: number } | null,
    reason?: OverlayChangeReason,
  ): void;
  close(reason?: OverlayChangeReason): void;
  toggle(reason?: OverlayChangeReason): void;
  /** Reflect controlled external visibility without emitting onOpenChange. */
  setOpen(open: boolean): void;
  setOptions(options: Partial<OverlayControllerOptions>): void;
  update(): Promise<PositionerResult | null>;
  subscribe(listener: (state: OverlayControllerState) => void): Cleanup;
  destroy(): void;
};

let idCounter = 0;

type PortalState = {
  parent: Node;
  nextSibling: Node | null;
  element: HTMLElement;
};

function moveToPortal(
  element: HTMLElement,
  target: Element,
): PortalState | null {
  const parent = element.parentNode;
  if (!parent) {
    return null;
  }
  const state = { parent, nextSibling: element.nextSibling, element };
  target.appendChild(element);
  return state;
}

function restorePortal(state: PortalState | null): void {
  if (!state) {
    return;
  }
  if (state.nextSibling?.parentNode === state.parent) {
    state.parent.insertBefore(state.element, state.nextSibling);
  } else {
    state.parent.appendChild(state.element);
  }
}

type BackgroundEntry = {
  roots: Element[];
  hidden: Map<HTMLElement, { inert: string | null; ariaHidden: string | null }>;
};

const backgroundStacks = new WeakMap<Document, BackgroundEntry[]>();

function topLevelBodyChild(
  root: Element,
  body: HTMLElement,
): HTMLElement | null {
  let node: Element | null = root;
  while (node?.parentElement && node.parentElement !== body) {
    node = node.parentElement;
  }
  return node?.parentElement === body ? (node as HTMLElement) : null;
}

function isBackgroundLive(element: HTMLElement): boolean {
  if (element.hasAttribute("aria-live")) {
    return true;
  }
  const role = element.getAttribute("role");
  return role === "status" || role === "alert" || role === "log";
}

function isNonVisual(element: HTMLElement): boolean {
  return ["SCRIPT", "STYLE", "LINK", "META", "TEMPLATE"].includes(
    element.tagName,
  );
}

function applyBackground(documentRef: Document): void {
  const stack = backgroundStacks.get(documentRef);
  if (!stack) {
    return;
  }
  const body = documentRef.body;
  const active = new Set<HTMLElement>();
  const top = stack.at(-1);
  if (!top) {
    return;
  }
  for (const root of top.roots) {
    if (!root.isConnected) {
      continue;
    }
    const child = topLevelBodyChild(root, body);
    if (child) {
      active.add(child);
    }
  }

  for (const [element, previous] of [...top.hidden]) {
    if (!element.isConnected || active.has(element)) {
      if (previous.inert === null) {
        element.removeAttribute("inert");
      } else {
        element.setAttribute("inert", previous.inert);
      }
      if (previous.ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", previous.ariaHidden);
      }
      top.hidden.delete(element);
    }
  }

  for (const child of [...body.children]) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (active.has(child) || isBackgroundLive(child) || isNonVisual(child)) {
      continue;
    }
    if (top.hidden.has(child)) {
      continue;
    }
    top.hidden.set(child, {
      inert: child.getAttribute("inert"),
      ariaHidden: child.getAttribute("aria-hidden"),
    });
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }
}

function acquireBackground(documentRef: Document, roots: Element[]): Cleanup {
  let stack = backgroundStacks.get(documentRef);
  if (!stack) {
    stack = [];
    backgroundStacks.set(documentRef, stack);
  }
  const entry: BackgroundEntry = { roots, hidden: new Map() };
  stack.push(entry);
  applyBackground(documentRef);

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const current = backgroundStacks.get(documentRef);
    if (!current) {
      return;
    }
    const index = current.indexOf(entry);
    if (index >= 0) {
      current.splice(index, 1);
    }
    for (const [element, previous] of entry.hidden) {
      if (previous.inert === null) {
        element.removeAttribute("inert");
      } else {
        element.setAttribute("inert", previous.inert);
      }
      if (previous.ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", previous.ariaHidden);
      }
    }
    entry.hidden.clear();
    if (current.length === 0) {
      backgroundStacks.delete(documentRef);
    } else {
      applyBackground(documentRef);
    }
  };
}

function focusTarget(
  content: HTMLElement,
  target: OverlayFocusTarget | boolean,
): void {
  if (target === null || target === false) {
    return;
  }
  if (target === true || target === "first") {
    if (!focusFirst(content)) {
      focusElement(content);
    }
    return;
  }
  if (target === "container") {
    focusElement(content);
    return;
  }
  focusElement(target);
}

function menuItems(content: HTMLElement): HTMLElement[] {
  return [
    ...content.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ].filter(
    (item) =>
      item.getAttribute("aria-disabled") !== "true" &&
      !item.hasAttribute("disabled") &&
      !item.hidden,
  );
}

/**
 * Shared DOM controller used by the non-React adapters.
 *
 * It owns open state, positioning, layer registration, dismissal, focus, and
 * component-specific ARIA. It does not render markup or impose styles.
 */
export function createOverlayController(
  initial: OverlayControllerOptions,
): OverlayController {
  if (!isBrowser()) {
    throw new Error(
      "[overlay-core] createOverlayController requires a browser DOM.",
    );
  }

  let options = initial;
  let internalOpen = initial.defaultOpen ?? false;
  let controlledOpen = initial.open ?? internalOpen;
  let isControlled = initial.open !== undefined;
  let disabled = initial.disabled ?? false;
  const contentId = initial.content.id || `overlay-${++idCounter}-content`;
  const doc = initial.content.ownerDocument;
  initial.content.id = contentId;
  if (initial.dir === "rtl") {
    initial.content.dir = "rtl";
  }

  const listeners = new Set<(state: OverlayControllerState) => void>();
  let previousActive: Element | null = null;
  let focusInside = false;
  let layerHandle: LayerStackHandle | null = null;
  let lease: LayerStackLease | null = null;
  let stack: LayerStack | null = null;
  let portalStates: PortalState[] = [];
  let backgroundCleanup: Cleanup | null = null;
  let scrollCleanup: Cleanup | null = null;
  let containment: FocusContainment | null = null;
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let docCleanups: Cleanup[] = [];
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;
  let pointerOver = false;
  let focused = false;
  let contentHovered = false;
  let keyboardInvokedAt = 0;
  let point: { x: number; y: number } | null = null;
  let latestResult: PositionerResult | null = null;

  const original = {
    contentHidden: initial.content.hidden,
    contentRole: initial.content.getAttribute("role"),
    contentTabIndex: initial.content.getAttribute("tabindex"),
    triggerExpanded: initial.trigger.getAttribute("aria-expanded"),
    triggerControls: initial.trigger.getAttribute("aria-controls"),
    triggerHasPopup: initial.trigger.getAttribute("aria-haspopup"),
    triggerDescribedBy: initial.trigger.getAttribute("aria-describedby"),
    backdropHidden: initial.backdrop?.hidden ?? null,
    contentStyle: {
      position: initial.content.style.position,
      left: initial.content.style.left,
      top: initial.content.style.top,
      visibility: initial.content.style.visibility,
    },
  };

  const currentOpen = (): boolean =>
    disabled ? false : isControlled ? controlledOpen : internalOpen;

  const snapshot = (): OverlayControllerState => ({
    isOpen: currentOpen(),
    placement: latestResult?.placement ?? options.placement ?? "bottom",
    point,
  });

  const emitState = (): void => {
    const state = snapshot();
    for (const listener of [...listeners]) {
      listener(state);
    }
  };

  const positioner: Positioner =
    initial.kind === "dialog"
      ? createPositioner({ floating: null, reference: null })
      : createPositioner({
          reference: null,
          floating: null,
          placement:
            initial.placement ??
            (initial.kind === "tooltip" ? "top" : "bottom-start"),
          offset: initial.offset ?? 0,
          alignOffset: initial.alignOffset ?? 0,
          flip: initial.flip ?? true,
          shift: initial.shift ?? true,
          padding: initial.padding ?? 0,
          boundary: initial.boundary,
          strategy: initial.strategy,
          autoUpdate: initial.autoUpdate ?? true,
        });

  const unsubscribePosition = positioner.subscribe(
    (result: PositionerResult) => {
      latestResult = result;
      if (!currentOpen() || options.kind === "dialog") {
        return;
      }
      const parsed = parsePlacement(result.placement);
      const { style } = options.content;
      style.position = result.strategy;
      style.left = `${result.x}px`;
      style.top = `${result.y}px`;
      style.visibility = "visible";
      options.content.dataset.side = parsed.side;
      options.content.dataset.align = parsed.align;
      options.content.dataset.placement = result.placement;
    },
  );

  const setTriggerOpenState = (open: boolean): void => {
    const trigger = options.trigger;
    trigger.dataset.state = open ? "open" : "closed";
    if (options.kind !== "tooltip") {
      trigger.setAttribute("aria-expanded", String(open));
    }
    if (open) {
      trigger.setAttribute("aria-controls", contentId);
    } else {
      trigger.removeAttribute("aria-controls");
    }
  };

  const setContentOpenState = (open: boolean): void => {
    const content = options.content;
    content.dataset.state = open ? "open" : "closed";
    content.hidden = !open;
    if (open) {
      content.style.visibility = "visible";
      content.dataset.open = "";
      delete content.dataset.closed;
    } else {
      delete content.dataset.open;
      content.dataset.closed = "";
      content.style.visibility = original.contentStyle.visibility;
    }
    const backdrop = options.backdrop;
    if (backdrop) {
      backdrop.hidden = !open;
      backdrop.dataset.state = open ? "open" : "closed";
    }
  };

  const ensureStack = (): LayerStack | null => {
    if (initial.kind === "tooltip" || options.kind === "tooltip") {
      return null;
    }
    if (stack) {
      return stack;
    }
    if (options.stack) {
      stack = options.stack;
    } else {
      lease = acquireSharedLayerStack(doc);
      stack = lease.stack;
    }
    return stack;
  };

  const registerLayer = (): void => {
    const activeStack = ensureStack();
    if (!activeStack || layerHandle) {
      return;
    }
    layerHandle = activeStack.register({
      element: options.content,
      reference: options.trigger,
      boundaries: options.boundaries,
      parent: options.parentLayer ?? null,
      dismissOnEscape: options.dismissOnEscape ?? true,
      dismissOnOutsidePress: options.dismissOnOutsidePress ?? true,
      onDismiss: (reason: DismissReason) => {
        requestClose(
          reason === "escape-key"
            ? "escape-key"
            : reason === "outside-press"
              ? "outside-press"
              : "reference-press",
        );
      },
    });
  };

  const disposeLayer = (): void => {
    layerHandle?.dispose();
    layerHandle = null;
  };

  const syncPositionReference = (): void => {
    if (options.kind === "dialog") {
      return;
    }
    const reference: ReferenceElement | null =
      options.kind === "context-menu"
        ? point
          ? {
              getBoundingClientRect: () => ({
                x: point?.x ?? 0,
                y: point?.y ?? 0,
                width: 0,
                height: 0,
              }),
            }
          : options.trigger
        : options.trigger;
    positioner.setReference(currentOpen() ? reference : null);
    positioner.setFloating(currentOpen() ? options.content : null);
    if (currentOpen()) {
      void positioner.update();
    }
  };

  const startDocumentListeners = (): void => {
    if (docCleanups.length > 0) {
      return;
    }
    if (options.kind === "tooltip") {
      docCleanups.push(
        listen<KeyboardEvent>(
          doc,
          "keydown",
          (event) => {
            if (event.defaultPrevented || !isEscapeKey(event)) {
              return;
            }
            event.preventDefault();
            requestClose("escape-key");
          },
          true,
        ),
        listen<PointerEvent>(
          doc,
          "pointerdown",
          (event) => {
            if (
              options.content.contains(event.target as Node) ||
              options.trigger.contains(event.target as Node) ||
              !isPointerOutside(event, [options.content, options.trigger])
            ) {
              return;
            }
            requestClose("outside-press");
          },
          true,
        ),
      );
      return;
    }
    if (options.kind === "context-menu") {
      docCleanups.push(
        listen<MouseEvent>(doc, "contextmenu", (event) => {
          const target = event.target as Node | null;
          if (!target) {
            return;
          }
          if (
            options.content.contains(target) ||
            options.trigger.contains(target)
          ) {
            return;
          }
          const element = target as Element;
          if (element.closest?.('[role="menu"]')) {
            return;
          }
          requestClose("outside-press");
        }),
      );
    }
  };

  const stopDocumentListeners = (): void => {
    for (const cleanup of docCleanups) {
      cleanup();
    }
    docCleanups = [];
  };

  const clearTimers = (): void => {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const clearTypeahead = (): void => {
    if (typeaheadTimer) {
      clearTimeout(typeaheadTimer);
      typeaheadTimer = null;
    }
    typeahead = "";
  };

  const restoreFocusAfterClose = (): void => {
    if (options.kind === "tooltip" || options.restoreFocus === false) {
      return;
    }
    const active = getActiveElement(doc);
    const inside =
      focusInside || (active !== null && options.content.contains(active));
    focusInside = false;
    if (!inside && active !== null && active !== doc.body) {
      return;
    }
    const target = options.finalFocus ?? options.trigger ?? previousActive;
    if (target) {
      restoreFocus(target);
    }
  };

  const openState = (): void => {
    if (destroyed || disabled) {
      return;
    }
    previousActive = getActiveElement(doc);
    if (options.portal) {
      const states: PortalState[] = [];
      const contentState = moveToPortal(options.content, options.portal);
      if (contentState) {
        states.push(contentState);
      }
      if (options.backdrop) {
        const backdropState = moveToPortal(options.backdrop, options.portal);
        if (backdropState) {
          states.push(backdropState);
        }
      }
      portalStates = states;
    }

    setContentOpenState(true);
    if (options.dir === "rtl") {
      options.content.dir = "rtl";
    }
    setTriggerOpenState(true);
    if (options.kind === "tooltip") {
      const base = original.triggerDescribedBy?.trim();
      options.trigger.setAttribute(
        "aria-describedby",
        [base, contentId].filter(Boolean).join(" "),
      );
    }
    registerLayer();
    startDocumentListeners();
    syncPositionReference();

    if (options.kind === "dialog") {
      const modal = options.modal ?? true;
      options.content.setAttribute("role", "dialog");
      if (modal) {
        options.content.setAttribute("aria-modal", "true");
      } else {
        options.content.removeAttribute("aria-modal");
      }
      if (options.labelledBy) {
        options.content.setAttribute("aria-labelledby", options.labelledBy);
      }
      if (options.describedBy) {
        options.content.setAttribute("aria-describedby", options.describedBy);
      }
      if (!options.content.hasAttribute("tabindex")) {
        options.content.setAttribute("tabindex", "-1");
      }
      if (modal) {
        backgroundCleanup = acquireBackground(doc, [
          options.content,
          ...(options.backdrop ? [options.backdrop] : []),
        ]);
        if (options.lockScroll ?? true) {
          scrollCleanup = lockBodyScroll(doc);
        }
      }
      const initialTarget =
        options.initialFocus !== undefined
          ? options.initialFocus
          : modal
            ? "container"
            : null;
      focusTarget(options.content, initialTarget);
      if (options.trapFocus ?? modal) {
        containment = createFocusContainment({
          container: options.content,
          enabled: true,
          restoreFocus: false,
          shouldContain: () => layerHandle?.isTopmost ?? true,
        });
      }
    } else if (options.kind === "context-menu") {
      options.content.setAttribute("role", "menu");
      if (!options.content.hasAttribute("tabindex")) {
        options.content.setAttribute("tabindex", "-1");
      }
      const items = menuItems(options.content);
      for (const item of items) {
        if (!item.hasAttribute("tabindex")) {
          item.setAttribute("tabindex", "-1");
        }
      }
      const first = items[0];
      if (options.initialFocus === null) {
        // Explicitly opt out of initial focus.
      } else if (options.initialFocus instanceof Element) {
        focusElement(options.initialFocus);
      } else if (first) {
        first.focus();
      } else {
        options.content.focus();
      }
    } else if (options.kind === "popover") {
      const requested = options.initialFocus ?? false;
      focusTarget(options.content, requested);
      if (options.trapFocus) {
        containment = createFocusContainment({
          container: options.content,
          enabled: true,
          restoreFocus: false,
          shouldContain: () => layerHandle?.isTopmost ?? true,
        });
      }
    }
  };

  const closeState = (): void => {
    clearTimers();
    clearTypeahead();
    stopDocumentListeners();
    disposeLayer();
    containment?.dispose();
    containment = null;
    backgroundCleanup?.();
    backgroundCleanup = null;
    scrollCleanup?.();
    scrollCleanup = null;
    restoreFocusAfterClose();
    if (options.kind === "tooltip") {
      const originalValue = original.triggerDescribedBy?.trim();
      if (originalValue) {
        options.trigger.setAttribute("aria-describedby", originalValue);
      } else {
        options.trigger.removeAttribute("aria-describedby");
      }
    }
    setContentOpenState(false);
    setTriggerOpenState(false);
    if (options.kind !== "dialog") {
      positioner.setReference(null);
      positioner.setFloating(null);
    }
    for (const state of portalStates.reverse()) {
      restorePortal(state);
    }
    portalStates = [];
    contentHovered = false;
  };

  const emitChange = (open: boolean, reason: OverlayChangeReason): void => {
    options.onOpenChange?.(open, reason);
    emitState();
  };

  function requestOpen(reason: OverlayChangeReason = "programmatic"): void {
    if (destroyed || disabled || currentOpen()) {
      return;
    }
    if (isControlled) {
      emitChange(true, reason);
      return;
    }
    internalOpen = true;
    openState();
    emitChange(true, reason);
  }

  function requestClose(reason: OverlayChangeReason = "programmatic"): void {
    if (destroyed || !currentOpen()) {
      return;
    }
    if (isControlled) {
      emitChange(false, reason);
      return;
    }
    internalOpen = false;
    closeState();
    emitChange(false, reason);
  }

  function setOpen(next: boolean): void {
    if (destroyed || next === currentOpen()) {
      return;
    }
    if (isControlled) {
      controlledOpen = next;
    } else {
      internalOpen = next;
    }
    if (next) {
      openState();
    } else {
      closeState();
    }
    emitState();
  }

  const open = (reason: OverlayChangeReason = "programmatic"): void => {
    if (options.kind === "context-menu") {
      point = null;
    }
    requestOpen(reason);
  };
  const close = (reason: OverlayChangeReason = "programmatic"): void => {
    requestClose(reason);
  };
  const toggle = (reason: OverlayChangeReason = "trigger"): void => {
    if (currentOpen()) {
      requestClose(reason);
    } else {
      requestOpen(reason);
    }
  };

  const update = async (): Promise<PositionerResult | null> => {
    if (options.kind === "dialog" || !currentOpen()) {
      return null;
    }
    return positioner.update();
  };

  const setOptions = (next: Partial<OverlayControllerOptions>): void => {
    options = { ...options, ...next };
    if (next.disabled !== undefined) {
      const wasOpen = currentOpen();
      disabled = next.disabled;
      if (disabled && wasOpen) {
        closeState();
      }
    }
    if (next.open !== undefined) {
      isControlled = true;
      if (next.open !== currentOpen()) {
        controlledOpen = next.open;
        if (next.open && !disabled) {
          openState();
        } else {
          closeState();
        }
      }
    }
    if (
      next.placement !== undefined ||
      next.offset !== undefined ||
      next.alignOffset !== undefined ||
      next.flip !== undefined ||
      next.shift !== undefined ||
      next.padding !== undefined ||
      next.boundary !== undefined ||
      next.strategy !== undefined ||
      next.autoUpdate !== undefined ||
      next.dir !== undefined
    ) {
      if (next.dir === "rtl" && options.content.isConnected) {
        options.content.dir = "rtl";
      }
      positioner.setOptions({
        placement: next.placement ?? options.placement ?? "bottom",
        offset: next.offset ?? options.offset,
        alignOffset: next.alignOffset ?? options.alignOffset,
        flip: next.flip ?? options.flip,
        shift: next.shift ?? options.shift,
        padding: next.padding ?? options.padding,
        boundary: next.boundary ?? options.boundary,
        strategy: next.strategy ?? options.strategy,
        autoUpdate: next.autoUpdate ?? options.autoUpdate,
      });
    }
    emitState();
  };

  const handleTriggerClick = (): void => {
    if (options.kind === "popover" || options.kind === "dialog") {
      toggle("trigger");
    }
  };

  const handleContextMenu = (event: MouseEvent): void => {
    if (disabled || options.kind !== "context-menu") {
      return;
    }
    if (
      event.button === 0 &&
      keyboardInvokedAt > 0 &&
      Date.now() - keyboardInvokedAt < 500
    ) {
      keyboardInvokedAt = 0;
      event.preventDefault();
      return;
    }
    event.preventDefault();
    point = { x: event.clientX, y: event.clientY };
    requestOpen("trigger");
  };

  const handleKeyDownTrigger = (event: KeyboardEvent): void => {
    if (
      options.kind !== "context-menu" ||
      disabled ||
      (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10"))
    ) {
      return;
    }
    event.preventDefault();
    keyboardInvokedAt = Date.now();
    point = null;
    requestOpen("trigger");
  };

  const handlePointerEnter = (event: PointerEvent): void => {
    if (
      options.kind !== "tooltip" ||
      disabled ||
      event.pointerType === "touch"
    ) {
      return;
    }
    pointerOver = true;
    clearTimers();
    const wait = options.delay ?? 500;
    if (wait <= 0) {
      requestOpen("trigger");
      return;
    }
    openTimer = setTimeout(() => {
      openTimer = null;
      requestOpen("trigger");
    }, wait);
  };

  const scheduleClose = (): void => {
    if (options.kind !== "tooltip" || !currentOpen()) {
      return;
    }
    clearTimers();
    const wait = options.closeDelay ?? 100;
    if (wait <= 0) {
      requestClose("programmatic");
      return;
    }
    closeTimer = setTimeout(() => {
      closeTimer = null;
      if (
        !pointerOver &&
        !focused &&
        (!(options.hoverableContent ?? true) || !contentHovered)
      ) {
        requestClose("programmatic");
      }
    }, wait);
  };

  const handlePointerLeave = (): void => {
    if (options.kind !== "tooltip") {
      return;
    }
    pointerOver = false;
    scheduleClose();
  };

  const handleFocus = (): void => {
    if (options.kind !== "tooltip" || disabled) {
      return;
    }
    focused = true;
    clearTimers();
    requestOpen("trigger");
  };

  const handleBlur = (): void => {
    if (options.kind !== "tooltip") {
      return;
    }
    focused = false;
    scheduleClose();
  };

  const handleContentPointerEnter = (): void => {
    if (options.kind !== "tooltip" || !(options.hoverableContent ?? true)) {
      return;
    }
    contentHovered = true;
    clearTimers();
  };

  const handleContentPointerLeave = (): void => {
    if (options.kind !== "tooltip") {
      return;
    }
    contentHovered = false;
    scheduleClose();
  };

  const handleContentFocusIn = (): void => {
    focusInside = true;
  };
  const handleContentFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (!next || !options.content.contains(next)) {
      focusInside = false;
    }
  };

  const focusMenuItem = (item: HTMLElement): void => {
    item.focus();
  };

  const handleMenuKeyDown = (event: KeyboardEvent): void => {
    if (options.kind !== "context-menu" || event.defaultPrevented) {
      return;
    }
    const items = menuItems(options.content);
    if (items.length === 0) {
      return;
    }
    const active = getActiveElement(doc);
    const index = active ? items.indexOf(active as HTMLElement) : -1;
    const move = (delta: 1 | -1): void => {
      event.preventDefault();
      const next =
        index === -1
          ? delta > 0
            ? 0
            : items.length - 1
          : (index + delta + items.length) % items.length;
      const target = items[next];
      if (target) {
        focusMenuItem(target);
      }
    };
    if (event.key === "ArrowDown") {
      move(1);
      return;
    }
    if (event.key === "ArrowUp") {
      move(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      const first = items[0];
      if (first) {
        focusMenuItem(first);
      }
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = items.at(-1);
      if (last) {
        focusMenuItem(last);
      }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (active instanceof HTMLElement && items.includes(active)) {
        event.preventDefault();
        active.click();
      }
      return;
    }
    if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      typeahead += event.key.toLocaleLowerCase();
      if (typeaheadTimer) {
        clearTimeout(typeaheadTimer);
      }
      typeaheadTimer = setTimeout(clearTypeahead, 500);
      const ordered = [...items.slice(index + 1), ...items.slice(0, index + 1)];
      const match = ordered.find((item) =>
        (item.textContent ?? "")
          .trim()
          .toLocaleLowerCase()
          .startsWith(typeahead),
      );
      if (match) {
        focusMenuItem(match);
      }
    }
  };

  const handleMenuClick = (event: MouseEvent): void => {
    if (options.kind !== "context-menu" || event.defaultPrevented) {
      return;
    }
    const target = event.target as Element | null;
    const item = target?.closest<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    );
    if (!item || !options.content.contains(item)) {
      return;
    }
    if (
      item.getAttribute("aria-disabled") === "true" ||
      item.hasAttribute("disabled")
    ) {
      return;
    }
    options.onSelect?.(item, event);
    const role = item.getAttribute("role");
    if (role === "menuitem" && !item.hasAttribute("data-keep-open")) {
      requestClose("select");
    }
  };

  const triggerClick =
    options.kind === "popover" || options.kind === "dialog"
      ? handleTriggerClick
      : null;
  if (triggerClick) {
    options.trigger.addEventListener("click", triggerClick);
  }
  if (options.kind === "tooltip") {
    options.trigger.addEventListener("pointerenter", handlePointerEnter);
    options.trigger.addEventListener("pointerleave", handlePointerLeave);
    options.trigger.addEventListener("focus", handleFocus);
    options.trigger.addEventListener("blur", handleBlur);
    options.content.addEventListener("pointerenter", handleContentPointerEnter);
    options.content.addEventListener("pointerleave", handleContentPointerLeave);
  }
  if (options.kind === "context-menu") {
    options.trigger.addEventListener("contextmenu", handleContextMenu);
    options.trigger.addEventListener("keydown", handleKeyDownTrigger);
    options.content.addEventListener("keydown", handleMenuKeyDown);
    options.content.addEventListener("click", handleMenuClick);
  }
  options.content.addEventListener("focusin", handleContentFocusIn);
  options.content.addEventListener("focusout", handleContentFocusOut);

  // Set kind-specific static semantics.
  if (options.kind === "tooltip") {
    if (!options.content.getAttribute("role")) {
      options.content.setAttribute("role", "tooltip");
    }
    options.trigger.removeAttribute("aria-haspopup");
  } else if (options.kind === "dialog") {
    options.trigger.setAttribute("aria-haspopup", "dialog");
  } else if (options.kind === "context-menu") {
    options.trigger.setAttribute("aria-haspopup", "menu");
    options.content.setAttribute("role", "menu");
  }
  if (options.trigger.id === "" && options.kind !== "tooltip") {
    options.trigger.id = `${contentId}-trigger`;
  }

  setContentOpenState(false);
  setTriggerOpenState(false);
  syncPositionReference();
  if (currentOpen()) {
    openState();
  } else if (disabled) {
    closeState();
  }
  emitState();

  return {
    contentId,
    get isOpen() {
      return currentOpen();
    },
    open,
    openAt(nextPoint, reason = "programmatic") {
      point = nextPoint;
      requestOpen(reason);
    },
    close,
    toggle,
    setOpen,
    setOptions,
    update,
    subscribe(listener) {
      listener(snapshot());
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy() {
      if (destroyed) {
        return;
      }
      closeState();
      destroyed = true;
      unsubscribePosition();
      positioner.dispose();
      if (triggerClick) {
        options.trigger.removeEventListener("click", triggerClick);
      }
      if (options.kind === "tooltip") {
        options.trigger.removeEventListener("pointerenter", handlePointerEnter);
        options.trigger.removeEventListener("pointerleave", handlePointerLeave);
        options.trigger.removeEventListener("focus", handleFocus);
        options.trigger.removeEventListener("blur", handleBlur);
        options.content.removeEventListener(
          "pointerenter",
          handleContentPointerEnter,
        );
        options.content.removeEventListener(
          "pointerleave",
          handleContentPointerLeave,
        );
      }
      if (options.kind === "context-menu") {
        options.trigger.removeEventListener("contextmenu", handleContextMenu);
        options.trigger.removeEventListener("keydown", handleKeyDownTrigger);
        options.content.removeEventListener("keydown", handleMenuKeyDown);
        options.content.removeEventListener("click", handleMenuClick);
      }
      options.content.removeEventListener("focusin", handleContentFocusIn);
      options.content.removeEventListener("focusout", handleContentFocusOut);
      lease?.release();
      lease = null;
      stack = null;
      listeners.clear();
      options = initial;
    },
  };
}
