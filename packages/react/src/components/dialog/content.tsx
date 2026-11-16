"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  createFocusContainment,
  focusElement,
  focusFirst,
  getActiveElement,
  lockBodyScroll,
  restoreFocus,
  type AnimationSetting,
  type DismissReason,
} from "@zealakit/overlay-core";
import { useLayer } from "../../hooks/use-layer.js";
import { Portal } from "../portal.js";
import {
  OverlayLayerContext,
  OverlayPortalContainerContext,
  type OverlayLayerContextValue,
} from "../overlay-context.js";
import {
  DialogContentContext,
  DialogNestingContext,
  DialogPortalContext,
  useDialogContext,
  useDialogPortalContext,
  type DialogChangeReason,
  type DialogContentContextValue,
  type DialogNestingContextValue,
} from "./context.js";
import { useModalBackground } from "./modal-background.js";
import { composeRefs } from "../slot.js";
import {
  OverlayPresenceContext,
  useOverlayElementAnimation,
  useOverlayPresence,
  useOverlayPresenceContext,
} from "../../animation/presence.js";

export type DialogFocusTarget =
  | "container"
  | "first"
  | Element
  | (() => Element | null)
  | null;

export type DialogPortalProps = {
  children?: ReactNode;
  /** Defaults to document.body. */
  container?: Element | null;
  /** Render in place without creating a dialog portal root. */
  disabled?: boolean;
  /** Keep portal DOM mounted while closed for consumer transitions. */
  keepMounted?: boolean;
};

export type DialogDataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export type DialogBackdropProps = HTMLAttributes<HTMLDivElement> &
  DialogDataAttributes & {
    /** Keep the backdrop mounted while closed for consumer transitions. */
    keepMounted?: boolean;
  };

export type DialogViewportProps = HTMLAttributes<HTMLDivElement> &
  DialogDataAttributes;

export type DialogPopupProps = HTMLAttributes<HTMLDivElement> &
  DialogDataAttributes & {
    /**
     * Modal default is "container" (the popup itself, tabIndex=-1).
     * Non-modal default is no initial focus unless this is supplied.
     */
    initialFocus?: DialogFocusTarget;
    /** Final focus target override; defaults to the trigger/captured element. */
    finalFocus?: Element | (() => Element | null) | null;
    /** Defaults to true. */
    restoreFocus?: boolean;
    /** Keep the popup mounted while closed for consumer transitions. */
    keepMounted?: boolean;
    /** Fade/custom enter and exit animation. Enabled by default as fade. */
    animation?: AnimationSetting;
  };

export type DialogContentProps = Omit<DialogPopupProps, "children"> & {
  children?: ReactNode;
  /** Defaults to true; modal dialogs also render a backdrop by default. */
  portal?: boolean | Element | null;
  /** Defaults to the Dialog modal setting. */
  backdrop?: boolean;
};

function toDialogReason(reason: DismissReason): DialogChangeReason {
  switch (reason) {
    case "escape-key":
      return "escape";
    case "outside-press":
      return "outside-press";
    case "reference-press":
      return "trigger";
    default:
      return "programmatic";
  }
}

function resolveTarget(
  target: Element | (() => Element | null) | null | undefined,
): Element | null {
  return typeof target === "function" ? target() : (target ?? null);
}

/**
 * Portal wrapper used by DialogContent and available for advanced composition.
 * The wrapper is a body-level interaction boundary for background inertness.
 */
export function DialogPortal({
  children,
  container,
  disabled = false,
  keepMounted = false,
}: DialogPortalProps) {
  const dialog = useDialogContext("DialogPortal");
  const presence = useOverlayPresenceContext();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  if (!dialog.isOpen && !keepMounted && !presence?.present) {
    return null;
  }

  if (disabled) {
    return (
      <DialogPortalContext.Provider value={{ root: null }}>
        {children}
      </DialogPortalContext.Provider>
    );
  }

  return (
    <Portal container={container}>
      <DialogPortalContext.Provider value={{ root }}>
        <div ref={setRoot} data-dialog-portal="">
          {children}
        </div>
      </DialogPortalContext.Provider>
    </Portal>
  );
}

/**
 * Optional structural backdrop. It has no styling and no built-in close button.
 * Clicking it is outside the Dialog popup and follows outside-dismissal rules.
 */
export const DialogBackdrop = forwardRef<HTMLDivElement, DialogBackdropProps>(
  function DialogBackdrop(
    { children, keepMounted = false, ...rest },
    forwardedRef,
  ) {
    const dialog = useDialogContext("DialogBackdrop");
    const presence = useOverlayPresenceContext();
    if (!dialog.isOpen && !keepMounted && !presence?.present) {
      return null;
    }
    return (
      <div
        {...rest}
        ref={forwardedRef}
        hidden={!dialog.isOpen && !presence?.present ? true : undefined}
        aria-hidden="true"
        data-dialog-backdrop=""
        data-state={dialog.isOpen ? "open" : "closed"}
        data-open={dialog.isOpen ? "" : undefined}
        data-closed={dialog.isOpen ? undefined : ""}
        data-modal={dialog.modal ? "" : undefined}
        data-non-modal={dialog.modal ? undefined : ""}
      >
        {children}
      </div>
    );
  },
);

/** Structural layout wrapper. No display, padding, or sizing styles are applied. */
export const DialogViewport = forwardRef<HTMLDivElement, DialogViewportProps>(
  function DialogViewport(props, forwardedRef) {
    const dialog = useDialogContext("DialogViewport");
    return (
      <div
        {...props}
        ref={forwardedRef}
        data-dialog-viewport=""
        data-modal={dialog.modal ? "" : undefined}
        data-non-modal={dialog.modal ? undefined : ""}
      />
    );
  },
);

/**
 * Dialog popup. Owns layer registration, modal focus containment, initial/final
 * focus, scroll locking, and dialog ARIA/data attributes.
 */
export const DialogPopup = forwardRef<HTMLDivElement, DialogPopupProps>(
  function DialogPopup(
    {
      children,
      initialFocus,
      finalFocus,
      restoreFocus: restoreOnClose = true,
      keepMounted = false,
      animation,
      ...rest
    },
    forwardedRef,
  ) {
    const dialog = useDialogContext("DialogPopup");
    const inheritedPresence = useOverlayPresenceContext();
    const localPresence = useOverlayPresence(dialog.isOpen, animation);
    const presence = inheritedPresence ?? localPresence;
    const { root: portalRoot } = useDialogPortalContext();
    const [popupElement, setPopupElement] = useState<HTMLDivElement | null>(
      null,
    );
    const [titleId, setTitleId] = useState<string | null>(null);
    const [descriptionId, setDescriptionId] = useState<string | null>(null);
    const [nestedOpenCount, setNestedOpenCount] = useState(0);
    const focusInsideRef = useRef(false);
    const initialFocusAppliedRef = useRef(false);
    const capturedFocusRef = useRef<Element | null>(null);
    const triggerElementRef = useRef(dialog.triggerElement);
    const finalFocusRef = useRef(finalFocus);
    const restoreOnCloseRef = useRef(restoreOnClose);
    triggerElementRef.current = dialog.triggerElement;
    finalFocusRef.current = finalFocus;
    restoreOnCloseRef.current = restoreOnClose;

    const layer = useLayer({
      element: popupElement,
      reference: dialog.triggerElement,
      parent: dialog.parentLayer,
      dismissOnEscape: dialog.dismissOnEscape,
      dismissOnOutsidePress: dialog.dismissOnOutsidePress,
      disabled: !dialog.isOpen,
      onDismiss: (reason) => {
        dialog.close(toDialogReason(reason));
      },
    });

    const refs = useMemo(
      () => composeRefs(forwardedRef, setPopupElement),
      [forwardedRef],
    );

    useOverlayElementAnimation({
      element: popupElement,
      phase: presence.phase,
      animation: presence.animation,
      onExitComplete: presence.finishExit,
    });

    useModalBackground(portalRoot, dialog.isOpen && dialog.modal);

    useEffect(() => {
      if (
        !dialog.isOpen ||
        !dialog.modal ||
        !dialog.lockScroll ||
        !popupElement
      ) {
        return;
      }
      return lockBodyScroll(popupElement.ownerDocument);
    }, [dialog.isOpen, dialog.lockScroll, dialog.modal, popupElement]);

    useEffect(() => {
      if (!dialog.isOpen || !popupElement) {
        return;
      }
      const handleFocusIn = (): void => {
        focusInsideRef.current = true;
      };
      const handleFocusOut = (event: globalThis.FocusEvent): void => {
        const next = event.relatedTarget as Node | null;
        if (!next || !popupElement.contains(next)) {
          focusInsideRef.current = false;
        }
      };
      popupElement.addEventListener("focusin", handleFocusIn);
      popupElement.addEventListener("focusout", handleFocusOut);
      return () => {
        popupElement.removeEventListener("focusin", handleFocusIn);
        popupElement.removeEventListener("focusout", handleFocusOut);
      };
    }, [dialog.isOpen, popupElement]);

    // Capture the restore target before initial focus moves into the Dialog.
    useEffect(() => {
      if (!dialog.isOpen || !popupElement) {
        return;
      }
      capturedFocusRef.current =
        triggerElementRef.current ??
        getActiveElement(popupElement.ownerDocument);
      return () => {
        const documentRef = popupElement.ownerDocument;
        const active = getActiveElement(documentRef);
        const focusWasInside =
          focusInsideRef.current ||
          (active !== null && popupElement.contains(active));
        focusInsideRef.current = false;
        if (!restoreOnCloseRef.current) {
          return;
        }
        if (!focusWasInside && active !== null && active !== documentRef.body) {
          return;
        }
        const target =
          resolveTarget(finalFocusRef.current) ??
          triggerElementRef.current ??
          capturedFocusRef.current;
        if (!target) {
          return;
        }
        if (!restoreFocus(target)) {
          queueMicrotask(() => {
            restoreFocus(target);
          });
        }
      };
    }, [dialog.isOpen, popupElement]);

    useEffect(() => {
      if (!dialog.isOpen || !popupElement || initialFocusAppliedRef.current) {
        return;
      }
      if (dialog.modal && !layer.isTopmost) {
        return;
      }
      const requested = initialFocus ?? (dialog.modal ? "container" : null);
      if (requested === null) {
        return;
      }
      initialFocusAppliedRef.current = true;
      if (requested === "container") {
        focusElement(popupElement);
      } else if (requested === "first") {
        focusFirst(popupElement);
      } else {
        focusElement(resolveTarget(requested));
      }
    }, [
      dialog.isOpen,
      dialog.modal,
      initialFocus,
      layer.isTopmost,
      popupElement,
    ]);

    useEffect(() => {
      if (!dialog.isOpen) {
        initialFocusAppliedRef.current = false;
        focusInsideRef.current = false;
      }
    }, [dialog.isOpen]);

    useEffect(() => {
      if (!dialog.modal || !layer.isTopmost || !popupElement) {
        return;
      }
      const containment = createFocusContainment({
        container: popupElement,
        enabled: true,
        restoreFocus: false,
      });
      return () => {
        containment.dispose();
      };
    }, [dialog.modal, layer.isTopmost, popupElement]);

    const labelContext = useMemo<DialogContentContextValue>(
      () => ({ setTitleId, setDescriptionId }),
      [],
    );
    const nestingContext = useMemo<DialogNestingContextValue>(
      () => ({
        reportNestedOpen(open) {
          setNestedOpenCount((count) => Math.max(0, count + (open ? 1 : -1)));
        },
      }),
      [],
    );
    const layerContext = useMemo<OverlayLayerContextValue>(
      () => ({ handle: layer.handle, isTopmost: layer.isTopmost }),
      [layer.handle, layer.isTopmost],
    );

    if (!dialog.isOpen && !keepMounted && !presence.present) {
      return null;
    }

    const style = { ...rest.style } as CSSProperties;

    return (
      <OverlayLayerContext.Provider value={layerContext}>
        <OverlayPortalContainerContext.Provider value={popupElement}>
          <DialogNestingContext.Provider value={nestingContext}>
            <DialogContentContext.Provider value={labelContext}>
              {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role may be overridden by specialized consumers such as alert dialogs */}
              <div
                {...rest}
                ref={refs}
                id={dialog.contentId}
                hidden={
                  !dialog.isOpen && !presence.present ? true : undefined
                }
                role={rest.role ?? "dialog"}
                aria-modal={dialog.isOpen && dialog.modal ? true : undefined}
                aria-labelledby={
                  rest["aria-labelledby"] ?? titleId ?? undefined
                }
                aria-describedby={
                  rest["aria-describedby"] ?? descriptionId ?? undefined
                }
                tabIndex={rest.tabIndex ?? -1}
                dir={
                  rest.dir ?? (dialog.direction === "rtl" ? "rtl" : undefined)
                }
                data-dialog-popup=""
                data-state={dialog.isOpen ? "open" : "closed"}
                data-open={dialog.isOpen ? "" : undefined}
                data-closed={dialog.isOpen ? undefined : ""}
                data-modal={dialog.modal ? "" : undefined}
                data-non-modal={dialog.modal ? undefined : ""}
                data-nested={dialog.nested ? "" : undefined}
                data-nested-dialog-open={nestedOpenCount > 0 ? "" : undefined}
                style={style}
              >
                {children}
              </div>
            </DialogContentContext.Provider>
          </DialogNestingContext.Provider>
        </OverlayPortalContainerContext.Provider>
      </OverlayLayerContext.Provider>
    );
  },
);

/**
 * Convenience composition: Portal -> optional Backdrop -> Viewport -> Popup.
 * No layout, sizing, colors, or overflow styles are applied.
 */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { portal = true, backdrop, animation, children, ...popupProps },
    forwardedRef,
  ) {
    const dialog = useDialogContext("DialogContent");
    const keepMounted = popupProps.keepMounted ?? false;
    const presence = useOverlayPresence(dialog.isOpen, animation);
    if (!dialog.isOpen && !keepMounted && !presence.present) {
      return null;
    }

    const showBackdrop = backdrop ?? dialog.modal;
    const content = (
      <>
        {showBackdrop ? <DialogBackdrop keepMounted={keepMounted} /> : null}
        <DialogViewport>
          <DialogPopup
            {...popupProps}
            animation={animation}
            ref={forwardedRef}
          >
            {children}
          </DialogPopup>
        </DialogViewport>
      </>
    );

    return (
      <OverlayPresenceContext.Provider value={presence}>
        {portal === false ? (
          content
        ) : (
          <DialogPortal
            container={
              typeof portal === "object" && portal !== null
                ? portal
                : undefined
            }
            keepMounted={keepMounted}
          >
            {content}
          </DialogPortal>
        )}
      </OverlayPresenceContext.Provider>
    );
  },
);
