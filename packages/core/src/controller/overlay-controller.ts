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
import {
  applyArrowStyles,
  createPositioner,
  DEFAULT_ARROW_SIZE,
  getArrowStyles,
  resetArrowStyles,
  snapshotArrowStyles,
  type ArrowSnapshot,
} from "../positioning/index.js";
import type { Positioner, PositionerResult } from "../types/positioner.js";
import { parsePlacement } from "../positioning/placement.js";
import { lockBodyScroll } from "../scroll-lock/scroll-lock.js";
import type { DismissReason, ReferenceElement } from "../types/index.js";
import { isBrowser } from "../utils/dom.js";
import { listen } from "../lifecycle/index.js";
import { getMenuItems } from "../menu/navigation.js";
import { acquireModalBackground } from "../modal/background.js";
import {
  moveToPortal,
  restorePortal,
  type PortalState,
} from "../portal/portal.js";
import type { Cleanup } from "../types/lifecycle.js";
import { getGlobalState } from "../utils/global-state.js";
import { createOverlayAnimator } from "./animator.js";
import { createContextMenuBehavior } from "./context-menu-behavior.js";
import type { ControllerHost } from "./host.js";
import { createTooltipBehavior } from "./tooltip-behavior.js";
import type {
  OverlayChangeReason,
  OverlayController,
  OverlayControllerOptions,
  OverlayControllerState,
  OverlayFocusTarget,
} from "./types.js";

export type {
  OverlayArrowOptions,
  OverlayChangeReason,
  OverlayController,
  OverlayControllerKind,
  OverlayControllerOptions,
  OverlayControllerState,
  OverlayFocusTarget,
} from "./types.js";

const idCounter = getGlobalState("overlay-id", () => ({ value: 0 }));

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
  const contentId =
    initial.content.id || `overlay-${++idCounter.value}-content`;
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
  let docCleanups: Cleanup[] = [];
  let destroyed = false;
  let latestResult: PositionerResult | null = null;
  let arrowElement: HTMLElement | null = null;
  let arrowSnapshot: ArrowSnapshot | null = null;

  const arrowSupported = (): boolean =>
    options.kind === "popover" || options.kind === "tooltip";

  const arrowPositionerOption = () =>
    arrowSupported() && options.arrow
      ? { element: options.arrow.element, padding: options.arrow.padding ?? 0 }
      : null;

  const syncArrowElement = (): void => {
    const next = arrowSupported() ? (options.arrow ?? null) : null;
    const nextElement = next?.element ?? null;
    if (nextElement !== arrowElement) {
      if (arrowElement && arrowSnapshot) {
        resetArrowStyles(arrowElement, arrowSnapshot);
      }
      arrowElement = nextElement;
      arrowSnapshot = nextElement ? snapshotArrowStyles(nextElement) : null;
    }
    if (arrowElement && next) {
      // Size first so the positioner can measure the arrow before geometry arrives.
      const size = `${next.size ?? DEFAULT_ARROW_SIZE}px`;
      arrowElement.style.position = "absolute";
      arrowElement.style.width = size;
      arrowElement.style.height = size;
      arrowElement.style.visibility = "hidden";
    }
  };
  syncArrowElement();

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

  const host: ControllerHost = {
    doc,
    getOptions: () => options,
    isDisabled: () => disabled,
    isOpen: currentOpen,
    requestOpen: (reason) => requestOpen(reason),
    requestClose: (reason) => requestClose(reason),
  };
  const animator = createOverlayAnimator(
    host,
    initial.animation,
    () => destroyed,
    () => finalizeClose(),
  );
  const tooltip = createTooltipBehavior(host);
  const contextMenu = createContextMenuBehavior(host);

  const snapshot = (): OverlayControllerState => ({
    isOpen: currentOpen(),
    placement: latestResult?.placement ?? options.placement ?? "bottom",
    point: contextMenu.point,
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
          arrow: arrowPositionerOption(),
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
      if (arrowElement) {
        applyArrowStyles(
          arrowElement,
          getArrowStyles({
            placement: result.placement,
            arrow: result.arrow,
            size: options.arrow?.size,
          }),
        );
      }
      if (animator.pendingEnter) {
        animator.playEnter(result.placement);
      }
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
        ? contextMenu.point
          ? {
              getBoundingClientRect: () => ({
                x: contextMenu.point?.x ?? 0,
                y: contextMenu.point?.y ?? 0,
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
      // A backdrop that wraps the content moves as one unit.
      const wrapped = options.backdrop?.contains(options.content) ?? false;
      const contentState = wrapped
        ? null
        : moveToPortal(options.content, options.portal);
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

    animator.settleExit();
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
    animator.pendingEnter = animator.enabled && options.kind !== "dialog";
    syncPositionReference();
    if (animator.enabled && options.kind === "dialog") {
      animator.playEnter();
    }

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
        backgroundCleanup = acquireModalBackground(doc, [
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
      const items = getMenuItems(options.content);
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

  const finalizeClose = (): void => {
    setContentOpenState(false);
    delete options.content.dataset.animating;
    for (const state of portalStates.reverse()) {
      restorePortal(state);
    }
    portalStates = [];
  };

  const closeState = (immediate = false): void => {
    const wasShown = !options.content.hidden;
    animator.cancelEnter();
    animator.settleExit();
    tooltip.reset();
    contextMenu.reset();
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
    setTriggerOpenState(false);
    if (options.kind !== "dialog") {
      positioner.setReference(null);
      positioner.setFloating(null);
    }
    if (!immediate && animator.enabled && wasShown) {
      animator.startExit(latestResult?.placement);
    } else {
      finalizeClose();
    }
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
      contextMenu.point = null;
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
    if (next.animation !== undefined) {
      animator.setConfig(next.animation);
    }
    if (next.arrow !== undefined) {
      syncArrowElement();
      positioner.setOptions({ arrow: arrowPositionerOption() });
    }
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
    if (
      (options.kind === "popover" || options.kind === "dialog") &&
      options.toggleOnTriggerClick !== false
    ) {
      toggle("trigger");
    }
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

  const triggerClick =
    options.kind === "popover" || options.kind === "dialog"
      ? handleTriggerClick
      : null;
  if (triggerClick) {
    options.trigger.addEventListener("click", triggerClick);
  }
  if (options.kind === "tooltip") {
    tooltip.attach();
  }
  if (options.kind === "context-menu") {
    contextMenu.attach();
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
      contextMenu.point = nextPoint;
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
      closeState(true);
      destroyed = true;
      if (arrowElement && arrowSnapshot) {
        resetArrowStyles(arrowElement, arrowSnapshot);
      }
      arrowElement = null;
      unsubscribePosition();
      positioner.dispose();
      if (triggerClick) {
        options.trigger.removeEventListener("click", triggerClick);
      }
      tooltip.detach();
      contextMenu.detach();
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
